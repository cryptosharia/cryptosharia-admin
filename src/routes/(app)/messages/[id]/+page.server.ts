import { createApiClient } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch, locals }: { params: { id: string }, fetch: typeof globalThis.fetch, locals: App.Locals }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	try {
        // Try getting by ID
		const { data, error: apiError } = await client.GET('/messages/{id}', {
			params: {
				path: { id: params.id }
			}
		});

        if (apiError || !data?.success) {
            // If the endpoint doesn't exist, try getting from list
            const { data: listData } = await client.GET('/messages', {
                params: {
                    query: { limit: 100 }
                }
            });
            const msg = listData?.data?.items?.find((m: any) => m.id === params.id);
            if (!msg) throw error(404, 'Message not found');
            return { message: msg };
        }

		return {
			message: data?.data
		};
	} catch (err: any) {
		console.error('API connection failed:', err);
		throw error(err.status || 500, err.body?.message || 'Failed to load message');
	}
};
