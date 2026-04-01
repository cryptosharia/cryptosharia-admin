import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

    const search = url.searchParams.get('search') || undefined;
    const page = Number(url.searchParams.get('page') || '1');

    const query: any = {
        limit: 20,
        page,
        statuses: ['draft', 'published', 'archived']
    };
    if (search) query.search = search;

    const { data } = await client.GET('/posts', {
        params: { query }
    });

	return { 
        search: search || '',
        pagination: data?.data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
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
