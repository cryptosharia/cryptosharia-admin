import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tokens, tags, tokenTags, assets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allTags = await db.select().from(tags);
	return { tags: allTags };
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const ticker = data.get('ticker') as string;
		const shariaStatus = data.get('shariaStatus') as 'halal' | 'haram' | 'syubhat';
        
        // New/Mapped fields
        const website = data.get('website') as string || '#';
        const excerpt = data.get('excerpt') as string || '';
        const content = data.get('content') as string || '';
        const status = (data.get('status') as any) || 'draft';
        const rank = parseInt(data.get('rank') as string) || 999;
        const tradingviewSymbol = data.get('tradingviewSymbol') as string;
        
        // Logo URL from input (was contentUrl or logoUrl?)
        // The old code had contentUrl, let's assume UI might send logoUrl or we map contentUrl to it?
        // Old code: const contentUrl = data.get('contentUrl') as string;
		const logoUrl = (data.get('logoUrl') as string) || (data.get('contentUrl') as string);
		
        const selectedTags = data.getAll('tags').map(id => id as string); // UUIDs
		
		// Generate slug from name
		const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

		if (!name || !ticker || !shariaStatus) {
			return fail(400, { missing: true });
		}

		try {
             // Handle Logo (URL to Asset ID)
            let logoId: string;
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
                        provider: 'picsum', // Default
                        createdBy: locals.admin?.id
                    }).returning();
                    logoId = newAsset.id;
                }
            } else {
                 // Placeholder
                 const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
                 const [newAsset] = await db.insert(assets).values({
                    pathname: placeholderUrl,
                    filename: 'placeholder_logo',
                    size: 0,
                    mimeType: 'image/png',
                    provider: 'picsum',
                    createdBy: locals.admin?.id
                 }).returning();
                 logoId = newAsset.id;
            }

			const [newToken] = await db.insert(tokens).values({
				name,
				ticker,
				shariaStatus,
                status,
                rank,
                excerpt,
                content,
                website,
                tradingviewSymbol,
                logoId,
				slug,
				createdBy: locals.admin?.id,
				updatedBy: locals.admin?.id
			}).returning();

			// Insert tags
			if (selectedTags.length > 0) {
				await db.insert(tokenTags).values(
					selectedTags.map(tagId => ({
						tokenId: newToken.id,
						tagId
					}))
				);
			}

			if (locals.admin) {
				await logActivity(locals.admin.id, 'CREATE', 'tokens', newToken.id, { name: newToken.name });
			}
		} catch (error) {
			console.error('Error creating token:', error);
			return fail(500, { message: 'Failed to create token' });
		}

		throw redirect(303, '/tokens');
	}
} satisfies Actions;
