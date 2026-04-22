import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_CS_API_URL } from '$env/static/public';
import { CS_API_KEY } from '$env/static/private';



export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
	const { data } = await client.GET('/tags', { params: { query: { limit: 100 } } });
	return { tags: data?.data?.items ?? [] };
};

async function uploadAsset(fetchFn: typeof fetch, file: File, accessToken: string) {
	const formData = new FormData();
	formData.append('file', file);
	const apiUrl = PUBLIC_CS_API_URL.replace(/\/$/, '');
	
	console.log(`Uploading asset to: ${apiUrl}/assets. API Key present: ${!!CS_API_KEY}, Token present: ${!!accessToken}`);
	
	const res = await fetchFn(`${apiUrl}/assets`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Api-Key': CS_API_KEY
		},
		body: formData
	});
	
	if (!res.ok) {
        const errorText = await res.text();
		console.error(`Upload failed with status ${res.status}:`, errorText);
		throw new Error(errorText || `File upload failed with status ${res.status}`);
	}
	
	const json = await res.json();
	return json.data;
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
		const excerpt = (formData.get('excerpt') as string) || undefined;
		const content = (formData.get('content') as string) || undefined;
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
					coverImageId,
                    isFeatured,
					eventDate,
					externalLink,
                    tags,
                    ...(excerpt ? { excerpt } : {}),
                    ...(content ? { content } : {})
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
