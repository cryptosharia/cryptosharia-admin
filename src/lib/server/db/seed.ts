import { db } from '$lib/server/db';
import { roles, permissions, rolePermissions } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export async function seedRoles() {
	const existingRoles = await db.select().from(roles);
	if (existingRoles.length > 0) return;

	console.log('Seeding roles and permissions...');

	// 1. Create Roles
	const [superAdmin, editor, viewer] = await db.insert(roles).values([
		{ name: 'Super Admin', slug: 'super_admin' },
		{ name: 'Editor', slug: 'editor' },
		{ name: 'Viewer', slug: 'viewer' }
	]).returning();

	// 2. Create Permissions
	const modules = ['tokens', 'principles', 'contributors', 'admins', 'activity', 'settings'];
	const actions = ['view', 'create', 'edit', 'delete'];
	
	const permissionValues = [];
	for (const module of modules) {
		for (const action of actions) {
			permissionValues.push({
				name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`,
				slug: `${module}.${action}`,
				module: module
			});
		}
	}

	const allPermissions = await db.insert(permissions).values(permissionValues).returning();

	// 3. Assign Permissions to Roles
	// Super Admin gets everything
	await db.insert(rolePermissions).values(
		allPermissions.map(p => ({ roleId: superAdmin.id, permissionId: p.id }))
	);

	// Editor gets everything except admins and settings management
	const editorPerms = allPermissions.filter(p => !['admins', 'settings'].includes(p.module));
	await db.insert(rolePermissions).values(
		editorPerms.map(p => ({ roleId: editor.id, permissionId: p.id }))
	);

	// Viewer gets only view permissions
	const viewerPerms = allPermissions.filter(p => p.slug.endsWith('.view'));
	await db.insert(rolePermissions).values(
		viewerPerms.map(p => ({ roleId: viewer.id, permissionId: p.id }))
	);

	console.log('Seeding completed.');
}
