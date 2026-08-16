import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = createApiClient({ 
		fetch, 
		accessToken: locals.user?.accessToken 
	});

	const page = Number(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('search') || undefined;

	try {
        const query: any = { limit: 20, page };
        if (search) query.search = search;

		const { data } = await client.GET('/tags', {
			params: { query }
		});

		return {
			tags: data?.data?.items ?? [],
			pagination: data?.data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: search ?? ''
		};
	} catch (error) {
		console.error('API connection failed:', error);
		return {
			tags: [],
			pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
			search: '',
			error: 'API connection failed'
		};
	}
};

export const actions = {
    togglePublic: async ({ request, fetch, locals }) => {
        const formData = await request.formData();
        const slug = String(formData.get('slug') || '');
        const showInNavigation = formData.get('showInNavigation') === 'on';
        const contentSectionValue = String(formData.get('contentSection') || '');
        const contentSection = contentSectionValue || null;
        const displayOrderValue = String(formData.get('displayOrder') || '');
        const displayOrder = displayOrderValue === '' ? null : Number(displayOrderValue);

        if (!slug) return fail(400, { success: false, message: 'Tag tidak valid.' });
        if (showInNavigation && !contentSection) {
            return fail(400, { success: false, message: 'Pilih bagian Berita atau Edukasi terlebih dahulu.' });
        }
        if (displayOrder !== null && (!Number.isInteger(displayOrder) || displayOrder < 0)) {
            return fail(400, { success: false, message: 'Urutan harus berupa angka nol atau lebih.' });
        }

        const client = createApiClient({ fetch, accessToken: locals.user?.accessToken }) as any;
        const { data, error } = await client.PATCH(`/tags/${slug}`, {
            body: { contentSection, showInNavigation, displayOrder }
        });

        if (error || !data?.success) {
            return fail(400, { success: false, message: error?.message || 'Status kategori gagal diperbarui.' });
        }

        return { success: true, message: showInNavigation ? 'Tag ditampilkan di navigasi publik.' : 'Tag disembunyikan dari navigasi publik.' };
    }
} satisfies Actions;
