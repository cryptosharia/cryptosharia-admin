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
		const { data, error: apiError } = await client.GET('/tags/{identifier}', {
			params: {
				path: { identifier: params.slug }
			}
		});

		if (apiError || !data) {
			throw error(404, 'Tag not found');
		}

		return {
			tag: {
				...data,
				contentSection: data.section,
				showInNavigation: Boolean(data.section)
			}
		};
	} catch (err) {
		if ((err as any)?.status && (err as any)?.body) throw err;
		console.error('API connection failed:', err);
		throw error(500, 'API connection failed');
	}
};

export const actions = {
	update: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const id = formData.get('id') as string;
		const showInNavigation = formData.get('showInNavigation') === 'on';
		const contentSection = (formData.get('contentSection') as string) || null;

		if (showInNavigation && !contentSection) {
			return fail(400, { success: false, message: 'Pilih section untuk kategori publik.' });
		}

		try {
			const { data, error } = await client.PATCH('/tags/{id}', {
				params: { path: { id } },
				body: {
					name,
					slug,
					description: description || null,
					section: showInNavigation ? (contentSection as 'news' | 'education') : null
				}
			});

			if (error || !data) {
				console.error('Update tag error:', error || data);
				return fail(400, { success: false, message: error?.message || 'Failed to update tag.' });
			}

			return { success: true, message: 'Tag updated successfully!' };
		} catch (err) {
			console.error('Update tag exception:', err);
			return fail(500, { success: false, message: 'Internal server error' });
		}
	},
	delete: async ({ request, fetch, locals }) => {
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string' || !id) {
			return fail(400, { success: false, message: 'Tag ID is missing.' });
		}
		try {
			const { error } = await client.DELETE('/tags/{id}', {
				params: { path: { id } }
			});

			if (error) {
				return fail(400, { success: false, message: error?.message || 'Failed to delete tag.' });
			}
		} catch (err) {
			console.error('Delete tag exception:', err);
			return fail(500, { success: false, message: 'Internal server error' });
		}

		throw redirect(303, '/tags');
	}
} satisfies Actions;
