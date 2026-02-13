import { db } from '$lib/server/db';
import { icons } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allIcons = await db.select().from(icons).orderBy(desc(icons.createdAt));
	return { icons: allIcons };
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const type = data.get('type') as 'lucide' | 'simple_icons' | 'svg';
		const icon = data.get('icon') as string;

		if (!type || !icon) {
			return fail(400, { missing: true });
		}

		try {
			await db.insert(icons).values({ type, icon });
			return { success: true };
		} catch (error) {
			console.error('Error creating icon:', error);
			return fail(500, { message: 'Failed to create icon' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);

		if (isNaN(id)) return fail(400, { missing: true });

		try {
			await db.delete(icons).where(eq(icons.id, id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting icon:', error);
			return fail(500, { message: 'Failed to delete icon' });
		}
	}
} satisfies Actions;
