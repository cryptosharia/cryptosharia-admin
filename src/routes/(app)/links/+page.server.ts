import { db } from '$lib/server/db';
import { links, icons } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allLinks = await db.select({
		id: links.id,
		label: links.label,
		href: links.href,
		colorHex: links.colorHex,
		displayOrder: links.displayOrder,
		icon: icons.icon
	})
	.from(links)
	.leftJoin(icons, eq(links.iconId, icons.id))
	.orderBy(links.displayOrder);

	const allIcons = await db.select().from(icons);

	return { links: allLinks, icons: allIcons };
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const label = data.get('label') as string;
		const href = data.get('href') as string;
		const iconId = parseInt(data.get('iconId') as string);
		const colorHex = data.get('colorHex') as string;
		const displayOrder = parseInt(data.get('displayOrder') as string);
		
		if (!label || !href || isNaN(iconId)) return fail(400, { missing: true });

		try {
			await db.insert(links).values({ label, href, iconId, colorHex, displayOrder });
			return { success: true };
		} catch (error) {
			console.error('Error creating link:', error);
			return fail(500, { message: 'Failed to create link' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		
		if (!id) return fail(400, { missing: true });

		try {
			await db.delete(links).where(eq(links.id, id));
			return { success: true };
		} catch (error) {
			console.error('Error deleting link:', error);
			return fail(500, { message: 'Failed to delete link' });
		}
	}
} satisfies Actions;
