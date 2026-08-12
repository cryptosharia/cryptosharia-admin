import { createApiClient } from '$lib/api';
import type { PageServerLoad } from './$types';

const statusValues = ['draft', 'published', 'archived'] as const;
const sectionValues = ['news', 'education', 'research', 'activity'] as const;
const sortValues = ['title', 'status', 'section', 'publishedAt'] as const;

type SortKey = (typeof sortValues)[number];

function isValueIn<T extends readonly string[]>(value: string | null, values: T): value is T[number] {
	return value !== null && (values as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

    const search = url.searchParams.get('search') || undefined;
    const page = Number(url.searchParams.get('page') || '1');
    const status = isValueIn(url.searchParams.get('status'), statusValues)
        ? url.searchParams.get('status')
        : '';
    const section = isValueIn(url.searchParams.get('section'), sectionValues)
        ? url.searchParams.get('section')
        : '';
    const published = ['published', 'unpublished'].includes(url.searchParams.get('published') || '')
        ? url.searchParams.get('published')!
        : '';
    const sortParam = url.searchParams.get('sort');
    const sort: SortKey = isValueIn(sortParam, sortValues)
        ? sortParam
        : 'publishedAt';
    const direction = url.searchParams.get('direction') === 'asc' ? 'asc' : 'desc';

    const requestedStatuses = status
        ? [status]
        : published === 'published'
            ? ['published']
            : published === 'unpublished'
                ? ['draft', 'archived']
                : ['draft', 'published', 'archived'];

    const hasConflictingFilters = Boolean(
        status && published && (status === 'published') !== (published === 'published')
    );

    const query: any = {
        limit: 20,
        page,
        statuses: requestedStatuses,
        sortBy: sort,
        sortDirection: direction
    };
    if (search) query.search = search;
    if (section) query.sections = [section];

    const { data } = hasConflictingFilters
        ? { data: undefined }
        : await client.GET('/posts', { params: { query } });

    const posts = data?.data?.items.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        section: post.section,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        authorName: post.createdBy?.name || 'Unknown'
    })) ?? [];

	return {
        search: search || '',
        status,
        section,
        published,
        sort,
        direction,
        pagination: data?.data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
        posts
    };
};
