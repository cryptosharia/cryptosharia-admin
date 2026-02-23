import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	try {
		const { data } = await client.GET('/users', {
			params: {
				query: {
					limit: 100
				}
			}
		});

		return {
			users: data?.data?.items.map(user => ({
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
