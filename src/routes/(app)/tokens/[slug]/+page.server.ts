import { createApiClient } from '$lib/api';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_CS_API_URL } from '$env/static/public';
import { CS_API_KEY } from '$env/static/private';


export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });

	try {
		const [tokenRes, tagsRes] = await Promise.all([
			client.GET('/tokens/{id}', { params: { path: { id: params.slug } } }),
			client.GET('/tags', { params: { query: { limit: 100 } } })
		]);

		if (tokenRes.error || !tokenRes.data?.success || !tokenRes.data?.data) {
			throw error(404, 'Token not found');
		}

		return {
			token: {
                ...tokenRes.data.data,
                logoUrl: tokenRes.data.data.logo?.url
            },
			tags: tagsRes.data?.data?.items ?? []
		};
	} catch (err) {
        if ((err as any)?.status && (err as any)?.body) throw err; 
		console.error('API connection failed:', err);
		throw error(500, 'API connection failed');
	}
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
        const removeLogo = formData.get('remove_logoImage') === 'true';
        let logoId: string | null | undefined = undefined;

        try {
            if (logoFile && logoFile.size > 0) {
                const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken || '');
                logoId = uploadedAsset.id;
            } else if (removeLogo) {
                logoId = null;
            }

            const { data, error } = await client.PATCH(`/tokens/${params.slug}`, {
                body: {
                    name,
                    ticker,
                    slug,
                    rank,
                    website,
                    shariaStatus,
                    status,
                    tradingviewSymbol,
                    tags,
                    logoId,
                    ...(excerpt ? { excerpt } : {}),
                    ...(content ? { content } : {})
                }
            });

            if (error || !data?.success) {
                console.error('Update token error:', error || data);
                return fail(400, { success: false, message: error?.message || 'Failed to update token.' });
            }

            return { success: true, message: 'Token updated successfully!' };
        } catch (err: any) {
            console.error('Update token exception:', err);
            return fail(500, { success: false, message: err.message || 'Internal server error' });
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
