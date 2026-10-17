import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeAdminGrant } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';

export const PUT: RequestHandler = async ({ params, locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const id = params.id?.trim();
	if (!id) {
		return json(
			{ error: 'BAD_REQUEST', message: 'ID grant diperlukan.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const res = await revokeAdminGrant(id, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};
