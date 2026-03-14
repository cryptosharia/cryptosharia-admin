import { createApiClient } from '$lib/api';

export const load = async ({ fetch, locals, setHeaders }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	try {
		// Fetch all 3 in parallel - much faster than sequential
		const [tokensRes, usersRes, postsRes] = await Promise.all([
			client.GET('/tokens', { params: { query: { limit: 1 } } }),
			client.GET('/users', { params: { query: { limit: 1 } } }),
			client.GET('/posts', { params: { query: { limit: 1 } } })
		]);

		return {
			tokenCount: tokensRes.data?.data?.pagination.total ?? 0,
			userCount: usersRes.data?.data?.pagination.total ?? 0,
			postCount: postsRes.data?.data?.pagination.total ?? 0,
			messageCount: 0,
			tagCount: 0
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			tokenCount: 0,
			userCount: 0,
			postCount: 0,
			messageCount: 0,
			tagCount: 0,
			error: 'API connection failed'
		};
	}
};
