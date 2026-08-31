import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const showInNavigation = formData.get('showInNavigation') === 'on';
		const contentSection = (formData.get('contentSection') as string) || undefined;

		if (!name || !slug) {
			return fail(400, { missing: true, message: 'Name and Slug are required.' });
		}
		if (showInNavigation && !contentSection) {
			return fail(400, { message: 'Pilih section untuk kategori publik.' });
		}

		try {
			const { data, error } = await client.POST('/tags', {
				body: {
					name,
					slug,
					description: description || null,
					section: showInNavigation ? (contentSection as 'news' | 'education') : null
				}
			});

			if (error || !data) {
				console.error('API Error:', error || data);
				return fail(400, { message: 'Failed to create tag' });
			}
		} catch (error: any) {
			console.error('Error creating tag:', error);
			if (error instanceof Response) throw error; // handle redirect
			return fail(500, { message: 'Failed to create tag.' });
		}

		throw redirect(303, '/tags');
	}
} satisfies Actions;
