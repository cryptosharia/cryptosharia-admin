import { db } from '$lib/server/db';
import { principles, icons } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const principle = await db.query.principles.findFirst({
		where: eq(principles.id, params.id)
	});

	if (!principle) throw error(404, 'Principle not found');

	const allIcons = await db.select().from(icons);

	return { principle, icons: allIcons };
};

export const actions = {
	update: async ({ request, params, locals }) => {
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
			await db.update(principles)
				.set({
					title,
					description,
					colorHex,
					iconId,
					displayOrder,
					updatedBy: locals.admin?.id,
					updatedAt: new Date()
				})
				.where(eq(principles.id, params.id));

			if (locals.admin) {
				await logActivity(locals.admin.id, 'UPDATE', 'principles', params.id, { title });
			}
		} catch (err) {
			console.error('Error updating principle:', err);
			return fail(500, { message: 'Failed to update principle' });
		}

		throw redirect(303, '/principles');
	},

	delete: async ({ params, locals }) => {
		try {
			const [deleted] = await db.delete(principles)
				.where(eq(principles.id, params.id))
				.returning();

			if (locals.admin && deleted) {
				await logActivity(locals.admin.id, 'DELETE', 'principles', params.id, { title: deleted.title });
			}
		} catch (err) {
			console.error('Error deleting principle:', err);
			return fail(500, { message: 'Failed to delete principle' });
		}

		throw redirect(303, '/principles');
	}
} satisfies Actions;
