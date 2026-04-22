import { createApiClient } from '$lib/api';

export const load = async ({ fetch, locals }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	// Stream semua counts secara parallel - halaman langsung render, data menyusul
	const counts = Promise.all([
		client.GET('/tokens', { params: { query: { limit: 1 } } }),
		client.GET('/users', { params: { query: { limit: 1 } } }),
		client.GET('/posts', { params: { query: { limit: 1 } } }),
		client.GET('/messages', { params: { query: { limit: 1 } } }),
		client.GET('/tags', { params: { query: { limit: 1 } } })
	]).then(([tokensRes, usersRes, postsRes, messagesRes, tagsRes]) => ({
		tokenCount: tokensRes.data?.data?.pagination.total ?? 0,
		userCount: usersRes.data?.data?.pagination.total ?? 0,
		postCount: postsRes.data?.data?.pagination.total ?? 0,
		messageCount: messagesRes.data?.data?.pagination.total ?? 0,
		tagCount: tagsRes.data?.data?.pagination.total ?? 0,
	})).catch(() => ({
		tokenCount: 0, userCount: 0, postCount: 0, messageCount: 0, tagCount: 0
	}));

	return { counts };
};
