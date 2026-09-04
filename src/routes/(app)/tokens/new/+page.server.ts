import { createApiClient } from '$lib/api';
import { uploadAsset } from '$lib/server/assets';
import { loadAllTags } from '$lib/server/tags';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	return { tags: await loadAllTags(fetch, locals.user?.accessToken) };
};

export const actions = {
	create: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = formData.get('name') as string;
		const ticker = formData.get('ticker') as string;
		const shariaStatus = formData.get('shariaStatus') as 'halal' | 'haram' | 'syubhat';
		const status = formData.get('status') as 'draft' | 'published' | 'archived';

		const slug = formData.get('slug') as string;
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;
		const website = formData.get('website') as string;
		const tradingviewSymbol = (formData.get('tradingviewSymbol') as string) || null;
		const tagsStr = formData.get('tags') as string;
		const tags = tagsStr
			? tagsStr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const logoFile = formData.get('logoImage') as File | null;

		if (!name || !ticker || !slug || !excerpt || !content) {
			return fail(400, {
				missing: true,
				message: 'Name, ticker, slug, excerpt, and content are required.'
			});
		}

		if (!website) {
			return fail(400, { missing: true, message: 'Website is required.' });
		}
		let logoId: string;

		try {
			if (!logoFile || logoFile.size === 0) {
				return fail(400, { message: 'Logo Image is required' });
			}

			const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken);
			logoId = uploadedAsset.id;

			const { data, error } = await client.POST('/cryptoassets', {
				body: {
					name,
					ticker,
					slug,
					shariaStatus,
					status,
					website,
					tradingviewSymbol,
					tags,
					logoId,
					excerpt,
					content
				}
			});

			if (error || !data) {
				return fail(400, { message: 'Failed to create cryptoasset via API' });
			}

			throw redirect(303, `/tokens/${data.slug}`);
		} catch (err: any) {
			if (err instanceof Response) throw err; // re-throw redirect
			console.error('Create token error:', err);
			return fail(500, { message: err.message || 'Internal server error' });
		}
	}
} satisfies Actions;
