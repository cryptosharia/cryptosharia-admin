import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, permissions, rolePermissions } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('admin_session');

	if (sessionId) {
		const admin = await db.query.users.findFirst({
			where: eq(users.id, sessionId)
		});

		if (admin && admin.status === 'active') {
			const perms = await db.select({
				slug: permissions.permission
			})
			.from(permissions)
			.innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
			.where(admin.roleId ? eq(rolePermissions.roleId, admin.roleId) : sql`FALSE`);

			event.locals.admin = {
				id: admin.id,
				name: admin.name,
				email: admin.email,
				roleId: admin.roleId,
				permissions: perms.map(p => p.slug)
			};
		} else {
			// Invalid session
			event.cookies.delete('admin_session', { path: '/' });
		}
	}

	const isAuthRoute = event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/request-access');
	
	// Protect app routes
	if (!event.locals.admin && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	// Redirect logged in users away from auth routes
	if (event.locals.admin && isAuthRoute) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
