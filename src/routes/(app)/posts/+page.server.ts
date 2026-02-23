import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

    // Fetch posts with associated data (author is incl in response)
	const { data } = await client.GET('/posts', {
        params: {
            query: {
                limit: 100, // Fetch first 100 for now
                statuses: ['draft', 'published', 'archived']
            }
        }
    });

	return { 
        posts: data?.data?.items.map(post => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            section: post.section,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            authorName: post.createdBy?.name || 'Unknown' 
        })) ?? [] 
    };
};
