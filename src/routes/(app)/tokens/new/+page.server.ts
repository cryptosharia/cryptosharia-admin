import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async () => {
    return {};
};

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
	return json.data;
}

export const actions = {
    create: async ({ request, fetch, locals }) => {
        const formData = await request.formData();
        const client = createApiClient({ 
            fetch,
            accessToken: locals.user?.accessToken
        }) as any;

        const name = formData.get('name') as string;
        const ticker = formData.get('ticker') as string;
        const shariaStatus = formData.get('shariaStatus') as "halal" | "haram" | "syubhat";
        const status = formData.get('status') as "draft" | "published" | "archived";
        
        const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
        const rank = 0; // Default rank for new token
        const excerpt = '';
        const content = '';
        const website = '';
        
        const logoFile = formData.get('logoImage') as File | null;

        if (!name || !ticker) {
            return fail(400, { missing: true, message: 'Name and Ticker are required.' });
        }

        let logoId: string;

        try {
            if (!logoFile || logoFile.size === 0) {
                return fail(400, { message: 'Logo Image is required' });
            }

            const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken || '');
			logoId = uploadedAsset.id;

            const { data, error } = await client.POST('/tokens', {
                body: {
                    name,
                    ticker,
                    slug,
                    rank,
                    shariaStatus,
                    status,
                    excerpt,
                    content,
                    website,
                    logoId
                }
            });

            if (error || !data?.success) {
                return fail(400, { message: data?.message || 'Failed to create token via API' });
            }

            throw redirect(303, `/tokens/${data.data.slug}`);
        } catch (err: any) {
            if (err instanceof Response) throw err; // re-throw redirect
            console.error('Create token error:', err);
            return fail(500, { message: err.message || 'Internal server error' });
        }
    }
};
