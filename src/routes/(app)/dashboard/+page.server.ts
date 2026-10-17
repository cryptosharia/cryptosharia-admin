import { createApiClient } from '$lib/api';
import { getAdminStats, getAdminContent } from '$lib/server/academyClient';
import { canManageAcademy } from '$lib/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const accessToken = locals.user?.accessToken || locals.accessToken;
	const isAcademyManager = canManageAcademy(locals.user?.role);

	const client = createApiClient({
		fetch,
		accessToken
	});

	// 1. Fetch Core Ecosystem Counts in parallel
	const ecosystemCounts = Promise.all([
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

	// 2. Fetch Academy Stats and Pending Reviews if permitted
	let academyStatsPromise = Promise.resolve<{
		totalLessons: number;
		publishedLessons: number;
		draftContent: number;
		reviewContent: number;
		totalScopes: number;
		totalGrants: number;
	} | null>(null);

	let pendingReviewsPromise = Promise.resolve<any[]>([]);

	if (isAcademyManager && accessToken) {
		academyStatsPromise = getAdminStats(accessToken)
			.then((res) => (res.ok && res.data ? res.data : null))
			.catch(() => null);

		pendingReviewsPromise = getAdminContent({ status: 'review' }, accessToken)
			.then((res) => (res.ok && Array.isArray(res.data) ? res.data.slice(0, 5) : []))
			.catch(() => []);
	}

	return {
		ecosystemCounts,
		academyStats: await academyStatsPromise,
		pendingReviews: await pendingReviewsPromise,
		canAcademy: isAcademyManager
	};
};
