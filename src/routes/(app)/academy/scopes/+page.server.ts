import type { PageServerLoad } from './$types';
import { getAdminScopes } from '$lib/server/academyClient';

export const load: PageServerLoad = async ({ locals }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';
	const res = await getAdminScopes(accessToken);

	return {
		scopes: res.ok && res.data ? res.data : [],
		error: res.ok ? null : res.message || 'Gagal memuat daftar scopes'
	};
};
