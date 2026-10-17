import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';
import { createApiClient } from '$lib/api';

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const search = url.searchParams.get('q')?.trim() || '';
	const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '10'), 1), 50);

	const client = createApiClient({
		fetch,
		accessToken: auth.accessToken
	});

	try {
		const query: Record<string, unknown> = {
			limit,
			roles: ['member']
		};
		if (search) {
			query.search = search;
		}

		const { data, error } = await client.GET('/users', {
			params: { query: query as any }
		});

		if (error) {
			return json(
				{ error: 'FETCH_USERS_FAILED', message: 'Gagal mengambil data siswa.' },
				{ status: 502, headers: { 'cache-control': 'no-store' } }
			);
		}

		const students = (data || []).map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			avatarUrl: u.avatar?.url
		}));

		return json(students, {
			headers: { 'cache-control': 'private, no-cache' }
		});
	} catch (err) {
		return json(
			{ error: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server saat mencari siswa.' },
			{ status: 500, headers: { 'cache-control': 'no-store' } }
		);
	}
};
