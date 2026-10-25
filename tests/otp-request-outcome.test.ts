import assert from 'node:assert/strict';
import test from 'node:test';
import { getOtpRequestOutcome } from '../src/lib/server/otpRequestOutcome.ts';

const failedResponse = (status: number, headers?: HeadersInit) => ({
	error: { error: 'INTERNAL_ONLY', message: 'do not show provider or API details' },
	response: new Response(null, { status, headers })
});

test('maps an OTP rate limit to 429 and shows Retry-After', async () => {
	const outcome = await getOtpRequestOutcome(async () =>
		failedResponse(429, { 'retry-after': '42' })
	);
	assert.deepEqual(outcome, {
		ok: false,
		status: 429,
		message: 'Terlalu banyak permintaan. Silakan coba lagi dalam 42 detik.'
	});
});

test('uses RateLimit-Reset when Retry-After is absent', async () => {
	const outcome = await getOtpRequestOutcome(async () =>
		failedResponse(429, { 'ratelimit-reset': '45' })
	);
	assert.equal(outcome.ok, false);
	if (!outcome.ok) assert.match(outcome.message, /dalam 45 detik/);
});

test('maps validation errors to a safe input message', async () => {
	const outcome = await getOtpRequestOutcome(async () => failedResponse(422));
	assert.deepEqual(outcome, {
		ok: false,
		status: 422,
		message: 'Alamat email tidak valid. Periksa lalu coba lagi.'
	});
});

test('hides API key, authorization, and server errors behind a generic service message', async () => {
	for (const status of [401, 403, 500, 503]) {
		const outcome = await getOtpRequestOutcome(async () => failedResponse(status));
		assert.deepEqual(outcome, {
			ok: false,
			status: 503,
			message: 'Layanan pengiriman kode sedang mengalami kendala. Silakan coba lagi.'
		});
	}
});

test('maps an unreachable API to a generic service message', async () => {
	const outcome = await getOtpRequestOutcome(async () => {
		throw new Error('synthetic local network failure');
	});
	assert.deepEqual(outcome, {
		ok: false,
		status: 503,
		message: 'Layanan pengiriman kode sedang mengalami kendala. Silakan coba lagi.'
	});
});

test('accepts a successful no-content OTP response', async () => {
	const outcome = await getOtpRequestOutcome(async () => ({
		response: new Response(null, { status: 204 })
	}));
	assert.deepEqual(outcome, { ok: true });
});
