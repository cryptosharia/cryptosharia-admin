import { createApiClient } from '$lib/api';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const client = createApiClient({ fetch });

	try {
        // params.slug is the slug from URL. API parameter is named `id` but accepts slug.
		const { data, error: apiError } = await client.GET('/tokens/{id}', {
			params: {
				path: { id: params.slug } 
			}
		});

		if (apiError || !data?.success || !data?.data) {
			throw error(404, 'Token not found');
		}

		return {
			token: {
                ...data.data,
                logoUrl: data.data.logo?.url
            }
		};
	} catch (err) {
        // re-throw redirects or SvelteKit errors
        if ((err as any)?.status && (err as any)?.body) throw err; 
        
		console.error('API connection failed:', err);
		throw error(500, 'API connection failed');
	}
};

import { env } from '$env/dynamic/public';

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
    update: async ({ request, params, fetch, locals }) => {
        const formData = await request.formData();
        const client = createApiClient({ 
            fetch,
            accessToken: locals.user?.accessToken
        }) as any;
        
        const name = formData.get('name') as string;
        const ticker = formData.get('ticker') as string;
        const shariaStatus = formData.get('shariaStatus') as string;
        const status = formData.get('status') as string;
        const slug = formData.get('slug') as string;
        const rank = parseInt(formData.get('rank') as string || '0', 10);
        const website = formData.get('website') as string;
        const excerpt = formData.get('excerpt') as string;
        const content = formData.get('content') as string;
        
        const tradingviewSymbolStr = formData.get('tradingviewSymbol') as string;
        const tradingviewSymbol = tradingviewSymbolStr ? tradingviewSymbolStr : null;

        const tagsStr = formData.get('tags') as string;
        const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        
        const logoFile = formData.get('logoImage') as File | null;
        let logoId: string | undefined = undefined;

        try {
            if (logoFile && logoFile.size > 0) {
                const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken || '');
                logoId = uploadedAsset.id;
            }

            const { data, error } = await client.PATCH(`/tokens/${params.slug}`, {
                body: {
                    name,
                    ticker,
                    slug,
                    rank,
                    website,
                    excerpt,
                    content,
                    shariaStatus,
                    status,
                    tradingviewSymbol,
                    tags,
                    logoId
                }
            });

            if (error || !data?.success) {
                console.error('Update token error:', error || data);
                return fail(400, { success: false, message: error?.message || 'Failed to update token.' });
            }

            return { success: true, message: 'Token updated successfully!' };
        } catch (err) {
            console.error('Update token exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
    },
    delete: async ({ params, fetch }) => {
        const client = createApiClient({ fetch }) as any;
        try {
            // Using DELETE method
            const { error, data } = await client.DELETE(`/tokens/${params.slug}`);
            
            if (error || (data && !data.success)) {
                return fail(400, { success: false, message: error?.message || 'Failed to delete token.' });
            }
        } catch (err) {
            console.error('Delete token exception:', err);
            return fail(500, { success: false, message: 'Internal server error' });
        }
        
        throw redirect(303, '/tokens');
    }
} satisfies Actions;
