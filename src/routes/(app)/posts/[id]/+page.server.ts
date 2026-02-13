import { db } from '$lib/server/db';
import { posts, assets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await db.query.posts.findFirst({
		where: eq(posts.id, params.id),
        with: {
            coverImage: true
        }
	});

	if (!post) throw error(404, 'Post not found');

    // Map content for UI
    const transformedPost = {
        ...post,
        coverImage: post.coverImage?.pathname || ''
    };

	return { post: transformedPost };
};

export const actions = {
	update: async ({ request, params, locals }) => {
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
            let coverImageId: string | undefined;
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
            }

            const updateData: any = {
					title,
					slug,
					section: section as any,
					status,
					excerpt,
					content,
					isFeatured,
					publishedAt,
					eventDate,
					updatedBy: locals.admin?.id,
					updatedAt: new Date()
			};

            if (coverImageId) {
                updateData.coverImageId = coverImageId;
            }

			await db.update(posts)
				.set(updateData)
				.where(eq(posts.id, params.id));
			
			return { success: true, message: 'Post updated successfully' };
		} catch (error: any) {
			console.error('Error updating post:', error);
			if (error.code === '23505') {
				return fail(400, { error: 'Slug already exists.' });
			}
			return fail(500, { message: 'Failed to update post.' });
		}
	},
	delete: async ({ params }) => {
		try {
			await db.delete(posts).where(eq(posts.id, params.id));
		} catch (error) {
			console.error('Error deleting post:', error);
			return fail(500, { message: 'Failed to delete post.' });
		}
		throw redirect(303, '/posts');
	}
} satisfies Actions;
