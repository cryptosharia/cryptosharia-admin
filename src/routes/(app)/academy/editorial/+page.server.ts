import type { PageServerLoad } from './$types';
import { getAdminContent } from '$lib/server/academyClient';

export const load: PageServerLoad = async ({ locals }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';

	const res = await getAdminContent({}, accessToken);

	const allContent = res.ok && Array.isArray(res.data) ? res.data : [];

	return {
		content: allContent,
		error: res.ok ? null : res.message || 'Gagal memuat daftar materi antrean editorial'
	};
};
