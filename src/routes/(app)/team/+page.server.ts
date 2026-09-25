import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/api';
import { env as privateEnv } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const apiUrl = API_BASE_URL;
	const CS_API_KEY = privateEnv.CS_API_KEY;
	const search = url.searchParams.get('search') || '';
	const page = Number(url.searchParams.get('page') || '1');

	try {
		const queryParams = new URLSearchParams({
			page: String(page),
			limit: '50',
			isActive: 'all',
			sortBy: 'orderIndex',
			sortDirection: 'asc'
		});
		if (search) queryParams.set('search', search);

		const res = await fetch(`${apiUrl}/team-members?${queryParams.toString()}`, {
			headers: {
				...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
				...(CS_API_KEY ? { 'Api-Key': CS_API_KEY } : {})
			}
		});

		if (!res.ok) {
			console.error(`Failed to load team members, status ${res.status}`);
			return {
				members: [],
				search,
				total: 0,
				error: 'Gagal memuat daftar anggota tim'
			};
		}

		const data = await res.json();
		const items = Array.isArray(data) ? data : (data?.data?.items ?? data?.items ?? []);
		const totalHeader = res.headers.get('total-items');
		const total = totalHeader ? Number(totalHeader) : items.length;

		return {
			members: items,
			search,
			total
		};
	} catch (error) {
		console.error('API connection failed for team members:', error);
		return {
			members: [],
			search,
			total: 0,
			error: 'Gagal menghubungi server API'
		};
	}
};

export const actions = {
	delete: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { message: 'ID anggota tim diperlukan.' });
		}

		const apiUrl = API_BASE_URL;
		const apiKey = privateEnv.CS_API_KEY;
		try {
			const res = await fetch(`${apiUrl}/team-members/${id}`, {
				method: 'DELETE',
				headers: {
					...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
					...(apiKey ? { 'Api-Key': apiKey } : {})
				}
			});

			if (!res.ok) {
				const errText = await res.text();
				return fail(res.status, { message: errText || 'Gagal menghapus anggota tim.' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting team member:', error);
			return fail(500, { message: 'Terjadi kesalahan saat menghapus anggota tim.' });
		}
	},

	toggleActive: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const currentState = formData.get('isActive') === 'true';

		if (!id) {
			return fail(400, { message: 'ID anggota tim diperlukan.' });
		}

		const apiUrl = API_BASE_URL;
		const apiKey = privateEnv.CS_API_KEY;
		try {
			const res = await fetch(`${apiUrl}/team-members/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
					...(apiKey ? { 'Api-Key': apiKey } : {})
				},
				body: JSON.stringify({ isActive: !currentState })
			});

			if (!res.ok) {
				return fail(res.status, { message: 'Gagal memperbarui status anggota tim.' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error toggling team member status:', error);
			return fail(500, { message: 'Terjadi kesalahan saat mengubah status.' });
		}
	}
} satisfies Actions;
