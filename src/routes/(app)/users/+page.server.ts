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
        const query: any = { limit: 100, page };
        if (search) query.search = search;

		const { data } = await client.GET('/users', {
			params: { query }
		});

		return {
            search: search || '',
			users: data?.data?.items?.map((user: any) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role, // role is now a string enum from API
                roleName: user.role, // Mapping for UI compatibility if needed
				status: user.status,
				createdAt: user.createdAt,
				lastLoginAt: user.lastLoginAt,
                avatarUrl: user.avatar?.url
			})) ?? []
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			users: [],
			error: 'API connection failed'
		};
	}
};
