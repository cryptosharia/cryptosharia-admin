import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allUsers = await db.query.users.findMany({
		orderBy: [desc(users.createdAt)],
		with: {
			role: true
		}
	});
	return { users: allUsers };
};
	export const actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('id') as string;

		if (!userId) {
			return { error: 'User ID is required' };
		}

		try {
			await db.delete(users).where(eq(users.id, userId));
			return { success: true };
		} catch (err) {
			console.error('Failed to delete user:', err);
			return { error: 'Failed to delete user' };
		}
	}
};
