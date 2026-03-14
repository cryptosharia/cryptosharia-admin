import { createApiClient } from '$lib/api';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

	try {
        // Tag endpoint uses `{id}` which supports ID or Slug in our API
		const { data, error: apiError } = await client.GET('/tags/{id}', {
			params: {
				path: { id: params.slug } 
			}
		});

		if (apiError || !data?.success || !data?.data) {
			throw error(404, 'Tag not found');
		}

		return {
			tag: data.data
		};
	} catch (err) {
        if ((err as any)?.status && (err as any)?.body) throw err; 
		console.error('API connection failed:', err);
		throw error(500, 'API connection failed');
	}
};

export const actions = {
    update: async ({ request, params, fetch, locals }) => {
        const formData = await request.formData();
        const client = createApiClient({ 
            fetch, 
            accessToken: locals.user?.accessToken 
        }) as any;
        
        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const description = formData.get('description') as string;

        try {
            const { data, error } = await client.PATCH(`/tags/${params.slug}`, {
                body: {
                    name,
                    slug,
                    description: description || undefined
                }
            });

            if (error || !data?.success) {
                console.error('Update tag error:', error || data);
                return fail(400, { success: false, message: error?.message || 'Failed to update tag.' });
            }

            return { success: true, message: 'Tag updated successfully!' };
        } catch (err) {
            console.error('Update tag exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
    },
    delete: async ({ params, fetch, locals }) => {
        const client = createApiClient({ 
            fetch, 
            accessToken: locals.user?.accessToken 
        }) as any;
        try {
            const { error, data } = await client.DELETE(`/tags/${params.slug}`);
            
            if (error || (data && !data.success)) {
                return fail(400, { success: false, message: error?.message || 'Failed to delete tag.' });
            }
        } catch (err) {
            console.error('Delete tag exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
        
        throw redirect(303, '/tags');
    }
} satisfies Actions;
