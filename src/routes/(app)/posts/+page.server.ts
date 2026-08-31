import { createApiClient } from '$lib/api';
import { loadAllTags } from '$lib/server/tags';
import { fail } from '@sveltejs/kit';
import { paginationFromResponse } from '$lib/pagination';
import type { Actions, PageServerLoad } from './$types';

const statusValues = ['draft', 'published', 'archived'] as const;
const sectionValues = ['news', 'education', 'research', 'activity'] as const;
const sortValues = ['title', 'status', 'section', 'tags', 'publishedAt'] as const;

type SortKey = (typeof sortValues)[number];

function isValueIn<T extends readonly string[]>(
	value: string | null,
	values: T
): value is T[number] {
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
	const tag = url.searchParams.get('tag') || '';
	const published = ['published', 'unpublished'].includes(url.searchParams.get('published') || '')
		? url.searchParams.get('published')!
		: '';
	const sortParam = url.searchParams.get('sort');
	const sort: SortKey = isValueIn(sortParam, sortValues) ? sortParam : 'publishedAt';
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
	if (tag) query.tags = [tag];

	const [postResult, availableTags] = await Promise.all([
		hasConflictingFilters ? Promise.resolve(null) : client.GET('/posts', { params: { query } }),
		loadAllTags(fetch, locals.user?.accessToken)
	]);
	const data = postResult?.data;

	const posts =
		data?.map((post) => ({
			id: post.id,
			title: post.title,
			slug: post.slug,
			status: post.status,
			section: post.section,
			publishedAt: post.publishedAt,
			updatedAt: post.updatedAt,
			authorName: post.createdBy?.name || 'Unknown',
			tags: post.tags.map((tag) => ({
				id: tag.id,
				name: tag.name,
				slug: tag.slug
			}))
		})) ?? [];

	return {
		search: search || '',
		status,
		section,
		tag,
		published,
		sort,
		direction,
		availableTags: availableTags.map((item) => ({ name: item.name, slug: item.slug })),
		pagination: postResult
			? paginationFromResponse(postResult.response, page, 20, data?.length ?? 0)
			: { total: 0, page, limit: 20, totalPages: 0 },
		posts
	};
};

export const actions = {
	publish: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const postId = formData.get('postId');

		if (typeof postId !== 'string' || !postId) {
			return fail(400, { message: 'Post tidak valid.' });
		}

		const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
		const { error } = await client.PATCH('/posts/{id}', {
			params: { path: { id: postId } },
			body: { status: 'published' }
		});

		if (error) {
			return fail(400, { message: 'Gagal mempublikasikan post.' });
		}

		return { success: true, message: 'Post telah dipublikasikan.' };
	}
} satisfies Actions;
