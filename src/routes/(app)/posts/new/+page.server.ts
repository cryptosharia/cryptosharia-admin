import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/public';

// A helper to perform raw fetch to /assets if openapi-fetch struggles with FormData
async function uploadAsset(fetchFn: typeof fetch, file: File, accessToken: string) {
	const formData = new FormData();
	formData.append('file', file);
	const apiUrl = env.PUBLIC_CS_API_URL || 'http://localhost:5173';
	const res = await fetchFn(`${apiUrl}/assets`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`
		},
		body: formData
	});
	if (!res.ok) {
        const errorText = await res.text();
		throw new Error(errorText || 'File upload failed');
	}
	const json = await res.json();
	return json.data; // Should contain the Asset object with `id`
}

export const actions = {
	default: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
        const client = createApiClient({ 
			fetch, 
			accessToken: locals.user?.accessToken 
		}) as any;
		
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const section = formData.get('section') as string;
		const status = formData.get('status') as 'draft' | 'published' | 'archived';
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;
		const type = formData.get('type') as string;
		const eventDateStr = formData.get('eventDate') as string;
		const eventDate = eventDateStr ? new Date(eventDateStr).toISOString() : null;
		const externalLink = formData.get('externalLink') as string || null;
		const coverImageFile = formData.get('coverImage') as File | null;

		const isFeatured = formData.get('isFeatured') === 'on';
        const tagsStr = formData.get('tags') as string;
        const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;

		if (!title || !slug || !section) {
			return fail(400, { missing: true, message: 'Title, Slug and Section are required.' });
		}

		let coverImageId: string;

		try {
			if (!coverImageFile || coverImageFile.size === 0) {
				return fail(400, { message: 'Cover Image is required' });
			}
			
			// 1. Upload the image first
			const uploadedAsset = await uploadAsset(fetch, coverImageFile, locals.user?.accessToken || '');
			coverImageId = uploadedAsset.id;

			// 2. Create the post
            const { data, error } = await client.POST('/posts', {
                body: {
                    title,
                    slug,
                    section,
					type,
                    status: status || 'draft',
                    excerpt,
                    content,
					coverImageId,
                    isFeatured,
					eventDate,
					externalLink,
                    tags
                }
            });

            if (error || !data?.success) {
                console.error('API Error:', error || data);
                return fail(400, { message: data?.message || 'Failed to create post via API' });
            }
		} catch (error: any) {
			console.error('Error creating post:', error);
			if (error instanceof Response) throw error; // handle redirect if thrown inside try
			return fail(500, { message: error.message || 'Failed to create post.' });
		}

		throw redirect(303, '/posts');
	}
} satisfies Actions;
