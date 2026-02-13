import { db } from '$lib/server/db';
import { users, roles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const admin = await db.query.users.findFirst({
		where: eq(users.id, params.id)
	});

	if (!admin) throw error(404, 'Admin not found');

	const allRoles = await db.select().from(roles);

	return { admin, roles: allRoles };
};

export const actions = {
	update: async ({ request, params, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const roleId = data.get('roleId') as string;
		const isActive = data.get('isActive') === 'on';

		if (!name || !email || !roleId) {
			return fail(400, { missing: true });
		}

		try {
			const updateData: any = {
				name,
				email,
				roleId,
				status: isActive ? 'active' : 'inactive',
				updatedAt: new Date()
			};

			if (password) {
				updateData.hashedPassword = await bcrypt.hash(password, 10);
			}

			await db.update(users)
				.set(updateData)
				.where(eq(users.id, params.id));

			if (locals.admin) {
				await logActivity(locals.admin.id, 'UPDATE', 'users', params.id, { name });
			}
		} catch (err) {
			console.error('Error updating admin:', err);
			return fail(500, { message: 'Failed to update admin' });
		}

		throw redirect(303, '/admins');
	},

	delete: async ({ params, locals }) => {
		// Prevent self-deletion
		if (locals.admin?.id === params.id) {
			return fail(400, { message: 'You cannot delete your own account.' });
		}

		try {
			const [deleted] = await db.delete(users)
				.where(eq(users.id, params.id))
				.returning();

			if (locals.admin && deleted) {
				await logActivity(locals.admin.id, 'DELETE', 'users', params.id, { name: deleted.name });
			}
		} catch (err) {
			console.error('Error deleting admin:', err);
			return fail(500, { message: 'Failed to delete admin' });
		}

		throw redirect(303, '/admins');
	}
} satisfies Actions;
