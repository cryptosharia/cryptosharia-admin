import { createApiClient } from '$lib/api';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
    const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

    try {
        const { data, error: apiError } = await client.GET('/posts/{id}', {
            params: { path: { id: params.id } }
        });

        if (apiError || !data?.success || !data?.data) {
            throw error(404, 'Post not found');
        }

        return { 
            post: {
                ...data.data,
                coverImage: data.data.coverImage?.url || ''
            } 
        };
    } catch (err) {
        console.error('Failed to load post:', err);
        throw error(500, 'Failed to load post');
    }
};

export const actions = {
	update: async ({ request, params, fetch, locals }) => {
		const formData = await request.formData();
        const client = createApiClient({ 
            fetch, 
            accessToken: locals.user?.accessToken 
        });
		
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const section = formData.get('section') as string;
		const status = formData.get('status') as 'draft' | 'published' | 'archived';
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;
		const isFeatured = formData.get('isFeatured') === 'on';

		if (!title || !slug || !section) {
			return fail(400, { missing: true, message: 'Title, Slug and Section are required.' });
		}

		try {
            // Using PATCH usually for updates
            const { data, error } = await (client as any).PATCH('/posts/{id}', {
                params: { path: { id: params.id } },
                body: {
					title,
					slug,
					section,
					status: status || 'draft',
					excerpt,
					content,
					isFeatured
                }
            });

            if (error || !data?.success) {
                console.error('API Error:', error || data);
                return fail(400, { message: 'Failed to update post via API' });
            }
			
			return { success: true, message: 'Post updated successfully' };
		} catch (error: any) {
			console.error('Error updating post:', error);
			if (error instanceof Response) throw error;
			return fail(500, { message: 'Failed to update post.' });
		}
	},
	delete: async ({ params, fetch, locals }) => {
        const client = createApiClient({ 
            fetch, 
            accessToken: locals.user?.accessToken 
        });
		try {
			await (client as any).DELETE('/posts/{id}', {
                params: { path: { id: params.id } }
            });
		} catch (error) {
			console.error('Error deleting post:', error);
			return fail(500, { message: 'Failed to delete post.' });
		}
		throw redirect(303, '/posts');
	}
} satisfies Actions;
