import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminStats } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const res = await getAdminStats(auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};
