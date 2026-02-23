import { createApiClient } from '$lib/api';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const client = createApiClient({ fetch });

	try {
        // params.slug is the slug from URL. API parameter is named `id` but accepts slug.
		const { data, error: apiError } = await client.GET('/tokens/{id}', {
			params: {
				path: { id: params.slug } 
			}
		});

		if (apiError || !data?.success || !data?.data) {
			throw error(404, 'Token not found');
		}

		return {
			token: {
                ...data.data,
                logoUrl: data.data.logo?.url
            }
		};
	} catch (err) {
        // re-throw redirects or SvelteKit errors
        if ((err as any)?.status && (err as any)?.body) throw err; 
        
		console.error('API connection failed:', err);
		throw error(500, 'API connection failed');
	}
};

export const actions = {
    update: async ({ request, params, fetch }) => {
        const formData = await request.formData();
        const client = createApiClient({ fetch }) as any;
        
        const name = formData.get('name') as string;
        // ticker might be read-only in some APIs, but let's assume updateable
        const shariaStatus = formData.get('shariaStatus') as string;
        const status = formData.get('status') as string;

        try {
            const { data, error } = await client.PATCH(`/tokens/${params.slug}`, {
                body: {
                    name,
                    shariaStatus,
                    status
                }
            });

            if (error || !data?.success) {
                console.error('Update token error:', error || data);
                return fail(400, { success: false, message: error?.message || 'Failed to update token.' });
            }

            return { success: true, message: 'Token updated successfully!' };
        } catch (err) {
            console.error('Update token exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
    },
    delete: async ({ params, fetch }) => {
        const client = createApiClient({ fetch }) as any;
        try {
            // Using DELETE method
            const { error, data } = await client.DELETE(`/tokens/${params.slug}`);
            
            if (error || (data && !data.success)) {
                return fail(400, { success: false, message: error?.message || 'Failed to delete token.' });
            }
        } catch (err) {
            console.error('Delete token exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
        
        throw redirect(303, '/tokens');
    }
} satisfies Actions;
