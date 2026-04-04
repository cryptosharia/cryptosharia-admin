import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
	const { data } = await client.GET('/tags', { params: { query: { limit: 100 } } });
	return { tags: data?.data?.items ?? [] };
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
        
        const slug = formData.get('slug') as string;
        const rank = parseInt(formData.get('rank') as string || '0', 10);
        const excerpt = formData.get('excerpt') as string;
        const content = formData.get('content') as string;
        const website = formData.get('website') as string;
        const tradingviewSymbol = formData.get('tradingviewSymbol') as string || null;
        const tagsStr = formData.get('tags') as string;
        const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        
        const logoFile = formData.get('logoImage') as File | null;

        if (!name || !ticker) {
            return fail(400, { missing: true, message: 'Name and Ticker are required.' });
        }

        if (!website) {
            return fail(400, { missing: true, message: 'Website is required.' });
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
                    tradingviewSymbol,
                    tags,
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
