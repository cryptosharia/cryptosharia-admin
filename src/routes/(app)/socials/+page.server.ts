import { db } from '$lib/server/db';
import { socials, icons } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allSocials = await db.select({
		id: socials.id,
		label: socials.label,
		href: socials.href,
		displayOrder: socials.displayOrder,
		icon: icons.icon
	})
	.from(socials)
	.leftJoin(icons, eq(socials.iconId, icons.id))
	.orderBy(socials.displayOrder);

	const allIcons = await db.select().from(icons);

	return { socials: allSocials, icons: allIcons };
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const label = data.get('label') as string;
		const href = data.get('href') as string;
		const iconId = parseInt(data.get('iconId') as string);
		const displayOrder = parseInt(data.get('displayOrder') as string);
		
		if (!label || !href || isNaN(iconId)) return fail(400, { missing: true });

		try {
			await db.insert(socials).values({ label, href, iconId, displayOrder });
			return { success: true };
		} catch (error) {
			console.error('Error creating social:', error);
			return fail(500, { message: 'Failed to create social' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		
		if (!id) return fail(400, { missing: true });

		try {
			await db.delete(socials).where(eq(socials.id, id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting social:', error);
			return fail(500, { message: 'Failed to delete social' });
		}
	}
} satisfies Actions;
