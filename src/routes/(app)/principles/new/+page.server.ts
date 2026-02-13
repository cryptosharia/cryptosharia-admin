import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { principles, icons } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allIcons = await db.select().from(icons);
	return { icons: allIcons };
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const colorHex = data.get('colorHex') as string;
		const iconId = parseInt(data.get('iconId') as string);
		const displayOrder = parseInt(data.get('displayOrder') as string);

		if (!title || !description || !colorHex || isNaN(iconId)) {
			return fail(400, { missing: true });
		}

		try {
			const [newPrinciple] = await db.insert(principles).values({
				title,
				description,
				colorHex,
				iconId,
				displayOrder,
				createdBy: locals.admin?.id,
				updatedBy: locals.admin?.id
			}).returning();

			if (locals.admin) {
				await logActivity(locals.admin.id, 'CREATE', 'principles', newPrinciple.id, { title: newPrinciple.title });
			}
		} catch (error) {
			console.error('Error creating principle:', error);
			return fail(500, { message: 'Failed to create principle' });
		}

		throw redirect(303, '/principles');
	}
} satisfies Actions;
