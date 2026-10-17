import type { PageServerLoad } from './$types';
import { getAdminContentById } from '$lib/server/academyClient';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';
	const res = await getAdminContentById(params.id, accessToken);

	if (!res.ok || !res.data) {
		throw error(res.status || 404, res.message || 'Materi Academy tidak ditemukan');
	}

	return {
		content: res.data
	};
};
