import { db } from '$lib/server/db';
import { posts, users } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPosts = await db.select({
		id: posts.id,
		title: posts.title,
		slug: posts.slug,
		status: posts.status,
		section: posts.section,
		publishedAt: posts.publishedAt,
		updatedAt: posts.updatedAt,
		authorName: users.name
	})
	.from(posts)
	.leftJoin(users, eq(posts.createdBy, users.id))
	.orderBy(desc(posts.updatedAt));

	return { posts: allPosts };
};
