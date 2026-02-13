import { db } from '$lib/server/db';
import { tags } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allTags = await db.select().from(tags).orderBy(desc(tags.createdAt));
	return { tags: allTags };
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		
		if (!name) return fail(400, { missing: true });

		try {
			await db.insert(tags).values({ name });
			return { success: true };
		} catch (error) {
			console.error('Error creating tag:', error);
			return fail(500, { message: 'Failed to create tag' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		
		if (isNaN(id)) return fail(400, { missing: true });

		try {
			await db.delete(tags).where(eq(tags.id, id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting tag:', error);
			return fail(500, { message: 'Failed to delete tag' });
		}
	}
} satisfies Actions;
