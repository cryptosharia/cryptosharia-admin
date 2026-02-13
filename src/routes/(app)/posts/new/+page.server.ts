import { db } from '$lib/server/db';
import { posts, assets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		
		const title = data.get('title') as string;
		const slug = data.get('slug') as string;
		const section = data.get('section') as string;
		const status = data.get('status') as 'draft' | 'published' | 'archived';
		const excerpt = data.get('excerpt') as string;
		const content = data.get('content') as string;
		const coverImageUrl = data.get('coverImage') as string;
		const isFeatured = data.get('isFeatured') === 'on';
		const publishedAt = data.get('publishedAt') ? new Date(data.get('publishedAt') as string) : null;
		const eventDate = data.get('eventDate') ? new Date(data.get('eventDate') as string) : null;

		if (!title || !slug || !section) {
			return fail(400, { missing: true, message: 'Title, Slug and Section are required.' });
		}

		try {
            // Handle Cover Image (URL to Asset ID)
            let coverImageId: string;
            // Default to a placeholder if no image provided (or handle error)
            // For now, let's assume we create a dummy asset or find one if URL provided
            if (coverImageUrl) {
                const existingAsset = await db.query.assets.findFirst({
                    where: eq(assets.pathname, coverImageUrl)
                });
                if (existingAsset) {
                    coverImageId = existingAsset.id;
                } else {
                    const [newAsset] = await db.insert(assets).values({
                        pathname: coverImageUrl,
                        filename: 'external_image',
                        size: 0,
                        mimeType: 'image/jpeg',
                        provider: 'picsum', // Default provider
                        createdBy: locals.admin?.id
                    }).returning();
                    coverImageId = newAsset.id;
                }
            } else {
                 // Fallback or error? specific schema requires Not Null.
                 // Let's create a placeholder asset
                 const placeholderUrl = `https://placehold.co/600x400?text=${encodeURIComponent(title)}`;
                 const [newAsset] = await db.insert(assets).values({
                    pathname: placeholderUrl,
                    filename: 'placeholder',
                    size: 0,
                    mimeType: 'image/png',
                    provider: 'picsum',
                    createdBy: locals.admin?.id
                 }).returning();
                 coverImageId = newAsset.id;
            }

			await db.insert(posts).values({
				title,
				slug,
				section: section as any,
				type: 'article', // Default type
				status: status || 'draft',
				excerpt,
				content,
				coverImageId, // Use the ID
				isFeatured,
				publishedAt,
				eventDate,
				createdBy: locals.admin?.id,
				updatedBy: locals.admin?.id
			});
		} catch (error: any) {
			console.error('Error creating post:', error);
			if (error.code === '23505') { // Unique constraint violation
				return fail(400, { error: 'Slug already exists.' });
			}
			return fail(500, { message: 'Failed to create post.' });
		}

		throw redirect(303, '/posts');
	}
} satisfies Actions;
