import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	const search = url.searchParams.get('search') || undefined;
	const page = Number(url.searchParams.get('page') || '1');

	try {
        const query: any = {
            limit: 20,
            page,
            statuses: ['draft', 'published', 'archived']
        };
        if (search) query.search = search;

		const { data } = await client.GET('/tokens', {
			params: { query }
		});

		return {
            search: search || '',
            pagination: data?.data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
			tokens: data?.data?.items?.map((token: any) => ({
				id: token.id,
				name: token.name,
				ticker: token.ticker,
				slug: token.slug,
				rank: token.rank,
				status: token.status,
				shariaStatus: token.shariaStatus,
				logoUrl: token.logo?.url,
				updatedAt: token.updatedAt
			})) ?? []
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			tokens: [],
			search: '',
			pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
			error: 'API connection failed'
		};
	}
};
