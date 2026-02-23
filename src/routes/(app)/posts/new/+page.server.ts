import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
        const client = createApiClient({ fetch }) as any;
		
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const section = formData.get('section') as string;
		const status = formData.get('status') as 'draft' | 'published' | 'archived';
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;
        // API handles cover image differently (likely file upload or URL)
        // Ideally we upload first, get ID, then post.
        // For simplicity, we assume API accepts Url if implemented, or we ignore it for V1.
		const isFeatured = formData.get('isFeatured') === 'on';
		const publishedAt = formData.get('publishedAt') ? new Date(formData.get('publishedAt') as string).toISOString() : null;

		if (!title || !slug || !section) {
			return fail(400, { missing: true, message: 'Title, Slug and Section are required.' });
		}

		try {
            const { data, error } = await client.POST('/posts', {
                body: {
                    title,
                    slug,
                    section,
                    status: status || 'draft',
                    excerpt,
                    content,
                    isFeatured,
                    publishedAt
                }
            });

            if (error || !data?.success) {
                console.error('API Error:', error || data);
                return fail(400, { message: 'Failed to create post via API' });
            }
		} catch (error: any) {
			console.error('Error creating post:', error);
			if (error instanceof Response) throw error; // handle redirect if thrown inside try
			return fail(500, { message: 'Failed to create post.' });
		}

		throw redirect(303, '/posts');
	}
} satisfies Actions;
