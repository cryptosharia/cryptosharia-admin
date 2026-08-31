import { createApiClient } from '$lib/api';
import { paginationFromResponse } from '$lib/pagination';

export const load = async ({
	fetch,
	locals,
	url
}: {
	fetch: typeof globalThis.fetch;
	locals: App.Locals;
	url: URL;
}) => {
	const client = createApiClient({
		fetch,
		accessToken: locals.user?.accessToken
	});

	const page = Number(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('search') || undefined;

	try {
		const { data, response } = await client.GET('/messages', {
			params: {
				query: {
					limit: 20,
					page,
					search
				}
			}
		});

		return {
			messages: data ?? [],
			pagination: paginationFromResponse(response, page, 20, data?.length ?? 0),
			search: search ?? ''
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			messages: [],
			pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: '',
			error: 'API connection failed'
		};
	}
};
