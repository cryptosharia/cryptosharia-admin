import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allMessages = await db.select().from(messages).orderBy(desc(messages.createdAt));
	return { messages: allMessages };
};

export const actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		
		if (!id) return fail(400, { missing: true });

		try {
			await db.delete(messages).where(eq(messages.id, id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting message:', error);
			return fail(500, { message: 'Failed to delete message' });
		}
	}
} satisfies Actions;
