import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tokens, tags, tokenTags, assets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const token = await db.query.tokens.findFirst({
		where: eq(tokens.slug, params.slug)
	});

	if (!token) {
		throw error(404, 'Token not found');
	}

	const allTags = await db.select().from(tags);
	const currentTags = await db.select({ tagId: tokenTags.tagId })
		.from(tokenTags)
		.where(eq(tokenTags.tokenId, token.id));

	return {
		token,
		tags: allTags,
		currentTagIds: currentTags.map(t => t.tagId)
	};
};

export const actions = {
	update: async ({ request, params, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const ticker = data.get('ticker') as string;
		const shariaStatus = data.get('shariaStatus') as 'halal' | 'haram' | 'syubhat';
		// const contentUrl = data.get('contentUrl') as string; // Removed in schema
		const selectedTags = data.getAll('tags').map(id => id as string); // UUIDs
		
		// Fields
		const website = data.get('website') as string || '#';
		const logoUrl = data.get('logoUrl') as string || '';
		// const brandColorHex = data.get('brandColorHex') as string || null; // Removed
		const tradingviewSymbol = data.get('tradingviewSymbol') as string || null;
        const excerpt = data.get('excerpt') as string || '';
        const content = data.get('content') as string || '';
        const status = (data.get('status') as any) || 'draft';
        const rank = parseInt(data.get('rank') as string) || 999;

		if (!name || !ticker || !shariaStatus) {
			return fail(400, { missing: true });
		}

		try {
             // Handle Logo (URL to Asset ID)
            let logoId: string | undefined;
            if (logoUrl) {
                const existingAsset = await db.query.assets.findFirst({
                    where: eq(assets.pathname, logoUrl)
                });
                if (existingAsset) {
                    logoId = existingAsset.id;
                } else {
                    const [newAsset] = await db.insert(assets).values({
                        pathname: logoUrl,
                        filename: 'external_logo',
                        size: 0,
                        mimeType: 'image/png',
                        provider: 'picsum',
                        createdBy: locals.admin?.id
                    }).returning();
                    logoId = newAsset.id;
                }
            }

            const updateData: any = {
					name,
					ticker,
					shariaStatus,
                    status,
                    rank,
                    excerpt,
                    content,
					website,
					tradingviewSymbol,
					updatedBy: locals.admin?.id,
					updatedAt: new Date()
			};

            if (logoId) updateData.logoId = logoId;

			const [updatedToken] = await db.update(tokens)
				.set(updateData)
				.where(eq(tokens.slug, params.slug))
				.returning();

			// Sync tags
			await db.delete(tokenTags).where(eq(tokenTags.tokenId, updatedToken.id));
			if (selectedTags.length > 0) {
				await db.insert(tokenTags).values(
					selectedTags.map(tagId => ({
						tokenId: updatedToken.id,
						tagId
					}))
				);
			}

			if (locals.admin) {
				await logActivity(locals.admin.id, 'UPDATE', 'tokens', updatedToken.id, { name: updatedToken.name });
			}
		} catch (err) {
			console.error('Error updating token:', err);
			return fail(500, { message: 'Failed to update token' });
		}

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		try {
			const [deletedToken] = await db.delete(tokens)
				.where(eq(tokens.slug, params.slug))
				.returning();

			if (locals.admin && deletedToken) {
				await logActivity(locals.admin.id, 'DELETE', 'tokens', deletedToken.id, { name: deletedToken.name });
			}
		} catch (err) {
			console.error('Error deleting token:', err);
			return fail(500, { message: 'Failed to delete token' });
		}

		throw redirect(303, '/tokens');
	}
} satisfies Actions;
