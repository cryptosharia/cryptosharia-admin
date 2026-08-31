import { createApiClient } from '$lib/api';

export const load = async ({ fetch, locals }) => {
	const client = createApiClient({
		fetch,
		accessToken: locals.user?.accessToken
	});

	// Stream semua counts secara parallel - halaman langsung render, data menyusul
	const counts = Promise.all([
		client.GET('/cryptoassets', { params: { query: { limit: 1 } } }),
		client.GET('/users', { params: { query: { limit: 1 } } }),
		client.GET('/posts', { params: { query: { limit: 1 } } }),
		client.GET('/messages', { params: { query: { limit: 1 } } }),
		client.GET('/tags', { params: { query: { limit: 1 } } })
	])
		.then(([tokensRes, usersRes, postsRes, messagesRes, tagsRes]) => ({
			tokenCount: Number(tokensRes.response.headers.get('total-items') ?? 0),
			userCount: Number(usersRes.response.headers.get('total-items') ?? 0),
			postCount: Number(postsRes.response.headers.get('total-items') ?? 0),
			messageCount: Number(messagesRes.response.headers.get('total-items') ?? 0),
			tagCount: Number(tagsRes.response.headers.get('total-items') ?? 0)
		}))
		.catch(() => ({
			tokenCount: 0,
			userCount: 0,
			postCount: 0,
			messageCount: 0,
			tagCount: 0
		}));

	return { counts };
};
