import { createApiClient } from '$lib/api';
import { uploadAsset } from '$lib/server/assets';
import { loadAllTags } from '$lib/server/tags';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const client = createApiClient({
		fetch,
		accessToken: locals.user?.accessToken
	});

	try {
		const [postRes, tags] = await Promise.all([
			client.GET('/posts/{identifier}', { params: { path: { identifier: params.id } } }),
			loadAllTags(fetch, locals.user?.accessToken)
		]);

		if (postRes.error || !postRes.data) {
			throw error(404, 'Post not found');
		}

		return {
			post: {
				...postRes.data,
				coverImage: postRes.data.coverImage?.url || ''
			},
			tags
		};
	} catch (err: any) {
		if (err?.status) throw err; // re-throw SvelteKit errors (404, etc.)
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
		const excerpt = (formData.get('excerpt') as string) || '';
		const content = (formData.get('content') as string) || '';
		const isFeatured = formData.get('isFeatured') === 'on';
		const type = formData.get('type') as string;
		const eventDateStr = formData.get('eventDate') as string;
		const eventDate = eventDateStr ? new Date(eventDateStr).toISOString() : null;
		const externalLink = (formData.get('externalLink') as string) || null;

		const tagsStr = formData.get('tags') as string;
		const tags = tagsStr
			? tagsStr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const coverImageFile = formData.get('coverImage') as File | null;
		let coverImageId: string | undefined;

		if (!title || !slug || !section || !type || !excerpt || !content) {
			return fail(400, { missing: true, message: 'Required post fields are missing.' });
		}

		try {
			if (coverImageFile && coverImageFile.size > 0) {
				const uploadedAsset = await uploadAsset(
					fetch,
					coverImageFile,
					locals.user?.accessToken
				);
				coverImageId = uploadedAsset?.id ?? undefined;
			}

			// Using PATCH usually for updates
			const { data, error } = await client.PATCH('/posts/{id}', {
				params: { path: { id: params.id } },
				body: {
					title,
					slug,
					section: section as 'news' | 'education' | 'research' | 'activity',
					type: type as 'article' | 'webinar' | 'video' | 'headline',
					status: status || 'draft',
					isFeatured,
					eventDate,
					externalLink,
					tags,
					...(coverImageId ? { coverImageId } : {}),
					excerpt,
					content
				}
			});

			if (error || !data) {
				console.error('API Error:', error || data);
				return fail(400, { message: 'Failed to update post via API' });
			}

			return { success: true, message: 'Post updated successfully' };
		} catch (err: any) {
			console.error('Error updating post:', err);
			if (err instanceof Response) throw err;
			return fail(500, { message: err.message || 'Failed to update post.' });
		}
	},
	delete: async ({ params, fetch, locals }) => {
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});
		try {
			const { error } = await client.DELETE('/posts/{id}', {
				params: { path: { id: params.id } }
			});
			if (error) return fail(400, { message: 'Failed to delete post.' });
		} catch (error) {
			console.error('Error deleting post:', error);
			return fail(500, { message: 'Failed to delete post.' });
		}
		throw redirect(303, '/posts');
	}
} satisfies Actions;
