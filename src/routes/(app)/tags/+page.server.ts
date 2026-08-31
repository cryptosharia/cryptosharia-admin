import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import { paginationFromResponse } from '$lib/pagination';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

const sortValues = ['name', 'slug', 'description'] as const;
const sectionValues = ['news', 'education'] as const;

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

	const page = Number(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('search') || undefined;
	const sort = isValueIn(url.searchParams.get('sort'), sortValues)
		? url.searchParams.get('sort')
		: 'name';
	const direction = url.searchParams.get('direction') === 'desc' ? 'desc' : 'asc';
	const section = isValueIn(url.searchParams.get('section'), sectionValues)
		? url.searchParams.get('section')
		: '';

	try {
		const query: any = { limit: 20, page, sortBy: sort, sortDirection: direction };
		if (search) query.search = search;
		if (section) query.sections = [section];

		const { data, response } = await client.GET('/tags', {
			params: { query }
		});

		return {
			tags: (data ?? []).map((tag) => ({
				...tag,
				contentSection: tag.section,
				showInNavigation: Boolean(tag.section)
			})),
			pagination: paginationFromResponse(response, page, 20, data?.length ?? 0),
			search: search ?? '',
			sort,
			direction,
			section
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			tags: [],
			pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: '',
			sort: 'name',
			direction: 'asc',
			section: '',
			error: 'API connection failed'
		};
	}
};

export const actions = {
	togglePublic: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		const showInNavigation = formData.get('showInNavigation') === 'on';
		const contentSectionValue = String(formData.get('contentSection') || '');
		const contentSection = contentSectionValue || null;

		if (!id) return fail(400, { success: false, message: 'Tag tidak valid.' });
		if (showInNavigation && !contentSection) {
			return fail(400, {
				success: false,
				message: 'Pilih bagian Berita atau Edukasi terlebih dahulu.'
			});
		}
		const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
		const { error } = await client.PATCH('/tags/{id}', {
			params: { path: { id } },
			body: { section: showInNavigation ? (contentSection as 'news' | 'education') : null }
		});

		if (error) {
			return fail(400, {
				success: false,
				message: error?.message || 'Status kategori gagal diperbarui.'
			});
		}

		return {
			success: true,
			message: showInNavigation
				? 'Tag ditampilkan di navigasi publik.'
				: 'Tag disembunyikan dari navigasi publik.'
		};
	}
} satisfies Actions;
