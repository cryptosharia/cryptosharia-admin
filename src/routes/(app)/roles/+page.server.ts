import { db } from '$lib/server/db';
import { roles, permissions, rolePermissions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const allRoles = await db.select().from(roles);
	const allPermissions = await db.select().from(permissions);
	const allRolePermissions = await db.select().from(rolePermissions);

	return {
		roles: allRoles,
		permissions: allPermissions,
		rolePermissions: allRolePermissions
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;

		if (!name || !slug) {
			return fail(400, { message: 'Name and slug are required' });
		}

		try {
			await db.insert(roles).values({ name, slug });
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to create role' });
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'ID is required' });
		}

		try {
			await db.delete(roles).where(eq(roles.id, id));
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to delete role' });
		}
	},
	toggle: async ({ request }) => {
		const formData = await request.formData();
		const roleId = Number(formData.get('roleId'));
		const permissionId = Number(formData.get('permissionId'));

		if (!roleId || !permissionId) {
			return fail(400, { message: 'Role ID and Permission ID are required' });
		}

		try {
			const existing = await db.select().from(rolePermissions)
				.where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
				.limit(1);

			if (existing.length > 0) {
				await db.delete(rolePermissions)
					.where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
			} else {
				await db.insert(rolePermissions).values({ roleId, permissionId });
			}
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to toggle permission' });
		}
	}
};
