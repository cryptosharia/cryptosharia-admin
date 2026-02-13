import { db } from '$lib/server/db';
import { users, roles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allUsers = await db.select({
		id: users.id,
		name: users.name,
		email: users.email,
		roleId: users.roleId,
		status: users.status,
		lastLoginAt: users.lastLoginAt,
		roleName: roles.role
	})
	.from(users)
	.leftJoin(roles, eq(users.roleId, roles.id));

	return {
		admins: allUsers
	};
};
