import { createApiClient } from '$lib/api';
import { loadAllTags } from '$lib/server/tags';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	const client = createApiClient({
		fetch,
		accessToken: locals.user?.accessToken
	});

	try {
		const [tokenRes, tags] = await Promise.all([
			client.GET('/cryptoassets/{identifier}', { params: { path: { identifier: params.slug } } }),
			loadAllTags(fetch, locals.user?.accessToken)
		]);

		if (tokenRes.error || !tokenRes.data) {
			throw error(404, 'Token not found');
		}

		return {
			token: {
				...tokenRes.data,
				logoUrl: tokenRes.data.logo?.url
			},
			tags
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
	const apiUrl = publicEnv.PUBLIC_CS_API_URL.replace(/\/$/, '');

	const res = await fetchFn(`${apiUrl}/assets`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Api-Key': privateEnv.CS_API_KEY
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
		});

		const name = formData.get('name') as string;
		const ticker = formData.get('ticker') as string;
		const shariaStatus = formData.get('shariaStatus') as string;
		const status = formData.get('status') as string;
		const slug = formData.get('slug') as string;
		const id = formData.get('id') as string;
		const website = formData.get('website') as string;
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;

		const tradingviewSymbolStr = formData.get('tradingviewSymbol') as string;
		const tradingviewSymbol = tradingviewSymbolStr ? tradingviewSymbolStr : null;

		const tagsStr = formData.get('tags') as string;
		const tags = tagsStr
			? tagsStr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const logoFile = formData.get('logoImage') as File | null;
		let logoId: string | undefined;

		if (!id || !name || !ticker || !slug || !website || !excerpt || !content) {
			return fail(400, { success: false, message: 'Required cryptoasset fields are missing.' });
		}

		try {
			if (logoFile && logoFile.size > 0) {
				const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken || '');
				logoId = uploadedAsset.id;
			}

			const body = {
				name,
				ticker,
				slug,
				website,
				shariaStatus: shariaStatus as 'halal' | 'haram' | 'syubhat',
				status: status as 'draft' | 'published' | 'archived',
				tradingviewSymbol,
				tags,
				excerpt,
				content,
				...(logoId ? { logoId } : {})
			};

			const { data, error } = await client.PATCH('/cryptoassets/{id}', {
				params: { path: { id } },
				body: {
					...body
				}
			});

			if (error || !data) {
				console.error('Update token error:', error || data);
				return fail(400, { success: false, message: error?.message || 'Failed to update token.' });
			}

			return { success: true, message: 'Token updated successfully!' };
		} catch (err: any) {
			console.error('Update token exception:', err);
			return fail(500, { success: false, message: err.message || 'Internal server error' });
		}
	},
	delete: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string' || !id) {
			return fail(400, { success: false, message: 'Cryptoasset ID is missing.' });
		}
		const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
		try {
			const { error, data } = await client.DELETE('/cryptoassets/{id}', {
				params: { path: { id } }
			});

			if (error) {
				return fail(400, { success: false, message: error?.message || 'Failed to delete token.' });
			}
		} catch (err) {
			console.error('Delete token exception:', err);
			return fail(500, { success: false, message: 'Internal server error' });
		}

		throw redirect(303, '/tokens');
	}
} satisfies Actions;
