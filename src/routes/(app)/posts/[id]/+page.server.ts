import { createApiClient } from '$lib/api';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_CS_API_URL } from '$env/static/public';
import { CS_API_KEY } from '$env/static/private';



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


export const load: PageServerLoad = async ({ params, fetch, locals }) => {
    const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

    try {
        const [postRes, tagsRes] = await Promise.all([
            client.GET('/posts/{id}', { params: { path: { id: params.id } } }),
            client.GET('/tags', { params: { query: { limit: 100 } } })
        ]);

        if (postRes.error || !postRes.data?.success || !postRes.data?.data) {
            throw error(404, 'Post not found');
        }

        return { 
            post: {
                ...postRes.data.data,
                coverImage: postRes.data.data.coverImage?.url || ''
            },
            tags: tagsRes.data?.data?.items ?? []
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
		const excerpt = (formData.get('excerpt') as string) || undefined;
		const content = (formData.get('content') as string) || undefined;
		const isFeatured = formData.get('isFeatured') === 'on';
		const type = formData.get('type') as string;
		const eventDateStr = formData.get('eventDate') as string;
		const eventDate = eventDateStr ? new Date(eventDateStr).toISOString() : null;
		const externalLink = formData.get('externalLink') as string || null;

        const tagsStr = formData.get('tags') as string;
        const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        
        const coverImageFile = formData.get('coverImage') as File | null;
        const removeCoverImage = formData.get('remove_coverImage') === 'true';
        let coverImageId: string | null | undefined = undefined;

		if (!title || !slug || !section) {
			return fail(400, { missing: true, message: 'Title, Slug and Section are required.' });
		}

		try {
            if (coverImageFile && coverImageFile.size > 0) {
                const uploadedAsset = await uploadAsset(fetch, coverImageFile, locals.user?.accessToken || '');
                coverImageId = uploadedAsset?.id ?? undefined;
            } else if (removeCoverImage) {
                coverImageId = null;
            }

            // Using PATCH usually for updates
            const { data, error } = await (client as any).PATCH('/posts/{id}', {
                params: { path: { id: params.id } },
                body: {
					title,
					slug,
					section,
					type,
					status: status || 'draft',
					isFeatured,
					eventDate,
					externalLink,
                    tags,
                    coverImageId,
                    ...(excerpt ? { excerpt } : {}),
                    ...(content ? { content } : {})
                }
            });

            if (error || !data?.success) {
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
			await (client as any).DELETE('/posts/{id}', {
                params: { path: { id: params.id } }
            });
		} catch (error) {
			console.error('Error deleting post:', error);
			return fail(500, { message: 'Failed to delete post.' });
		}
		throw redirect(303, '/posts');
	}
} satisfies Actions;
