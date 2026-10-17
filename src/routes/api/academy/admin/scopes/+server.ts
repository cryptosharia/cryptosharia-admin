import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminScopes, createAdminScope } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';
import { createScopeSchema } from '$lib/server/academyValidation';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const res = await getAdminScopes(auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json(
			{ error: 'INVALID_JSON', message: 'Format JSON permintaan tidak valid.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const parsed = createScopeSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json(
			{
				error: 'VALIDATION_ERROR',
				message: 'Data scope tidak valid.',
				issues: parsed.error.issues
			},
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const res = await createAdminScope(parsed.data, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 201, headers: { 'cache-control': 'no-store' } });
};
