import { createApiClient } from '$lib/api';

const PAGE_SIZE = 100;

/**
 * The tags endpoint intentionally caps each response at 100 records. Form
 * selectors need the complete taxonomy, so follow its pagination here rather
 * than silently making tags after the first page impossible to select.
 */
export async function loadAllTags(fetchFn: typeof fetch, accessToken?: string) {
	const client = createApiClient({ fetch: fetchFn, accessToken });
	const firstPage = await client.GET('/tags', {
		params: { query: { page: 1, limit: PAGE_SIZE } }
	});

	const firstItems = firstPage.data?.data?.items ?? [];
	const totalPages = firstPage.data?.data?.pagination?.totalPages ?? 0;

	if (firstPage.error || totalPages === 0) return firstItems;

	const remainingPages = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
		client.GET('/tags', {
			params: { query: { page: index + 2, limit: PAGE_SIZE } }
		})
	);
	const remainingResults = await Promise.all(remainingPages);

	return [...firstItems, ...remainingResults.flatMap((result) => result.data?.data?.items ?? [])];
}
