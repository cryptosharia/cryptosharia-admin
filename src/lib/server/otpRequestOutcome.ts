export type OtpRequestOutcome =
	| { ok: true }
	| { ok: false; status: 400 | 422 | 429 | 503; message: string };

type ApiResult = {
	error?: unknown;
	response: {
		ok: boolean;
		status: number;
		headers: { get(name: string): string | null };
	};
};

const SERVICE_UNAVAILABLE_MESSAGE =
	'Layanan pengiriman kode sedang mengalami kendala. Silakan coba lagi.';

function retryAfterSeconds(headers: ApiResult['response']['headers']): number | null {
	const retryAfter = headers.get('retry-after');
	if (retryAfter && /^\d+$/.test(retryAfter)) {
		const seconds = Number(retryAfter);
		if (seconds > 0 && seconds <= 24 * 60 * 60) return seconds;
	}

	const reset = headers.get('ratelimit-reset');
	if (!reset || !/^\d+$/.test(reset)) return null;

	const value = Number(reset);
	const seconds =
		value > 1_000_000_000_000
			? Math.ceil((value - Date.now()) / 1000)
			: value > 1_000_000_000
				? Math.ceil(value - Date.now() / 1000)
				: value;
	return seconds > 0 && seconds <= 24 * 60 * 60 ? seconds : null;
}

function rateLimitMessage(seconds: number | null): string {
	if (seconds === null) return 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.';
	if (seconds < 60) return `Terlalu banyak permintaan. Silakan coba lagi dalam ${seconds} detik.`;
	if (seconds < 60 * 60)
		return `Terlalu banyak permintaan. Silakan coba lagi dalam ${Math.ceil(seconds / 60)} menit.`;
	return `Terlalu banyak permintaan. Silakan coba lagi dalam ${Math.ceil(seconds / 3600)} jam.`;
}

/** Maps upstream status without exposing API internals or account existence. */
export async function getOtpRequestOutcome(
	request: () => Promise<ApiResult>
): Promise<OtpRequestOutcome> {
	try {
		const { error, response } = await request();
		if (!error && response.ok) return { ok: true };

		if (response.status === 429) {
			return {
				ok: false,
				status: 429,
				message: rateLimitMessage(retryAfterSeconds(response.headers))
			};
		}

		if (response.status === 400 || response.status === 422) {
			return {
				ok: false,
				status: response.status,
				message: 'Alamat email tidak valid. Periksa lalu coba lagi.'
			};
		}

		return { ok: false, status: 503, message: SERVICE_UNAVAILABLE_MESSAGE };
	} catch {
		return { ok: false, status: 503, message: SERVICE_UNAVAILABLE_MESSAGE };
	}
}
