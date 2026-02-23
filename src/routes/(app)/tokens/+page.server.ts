import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	try {
		const { data } = await client.GET('/tokens', {
			params: {
				query: {
					limit: 100,
					statuses: ['draft', 'published', 'archived']
				}
			}
		});

		return {
			tokens: data?.data?.items.map(token => ({
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
			error: 'API connection failed'
		};
	}
};
