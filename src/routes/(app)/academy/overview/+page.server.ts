import type { PageServerLoad } from './$types';
import { getAdminStats } from '$lib/server/academyClient';
import type { AdminStatsDto } from '$lib/academyDtos';

export const load: PageServerLoad = async ({ locals }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';
	const res = await getAdminStats(accessToken);

	const stats: AdminStatsDto = res.ok && res.data ? res.data : {
		totalLessons: 0,
		publishedLessons: 0,
		draftContent: 0,
		reviewContent: 0,
		totalScopes: 0,
		totalGrants: 0
	};

	return {
		stats,
		error: res.ok ? null : res.message || 'Gagal memuat statistik Academy'
	};
};
