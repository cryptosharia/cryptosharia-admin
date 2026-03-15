import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	const page = Number(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('search') || undefined;

	try {
        const query: any = { limit: 20, page };
        if (search) query.search = search;

		const { data } = await client.GET('/tags', {
			params: { query }
		});

		return {
			tags: data?.data?.items ?? [],
			pagination: data?.data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: search ?? ''
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			tags: [],
			pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: '',
			error: 'API connection failed'
		};
	}
};
