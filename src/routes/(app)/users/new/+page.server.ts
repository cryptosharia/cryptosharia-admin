import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, roles } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { logActivity } from '$lib/server/db/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allRoles = await db.select().from(roles);
	return {
		roles: allRoles
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const roleId = data.get('roleId') as string; // Can be empty string if default
		const isActive = data.get('status') === 'on';

		if (!name || !email || !password) {
			return fail(400, { missing: true });
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const [newUser] = await db.insert(users).values({
				name,
				email,
				hashedPassword: hashedPassword,
				roleId: roleId || null,
				status: isActive ? 'active' : 'inactive',
				isEmailVerified: true
			}).returning();

            if (locals.admin) {
				await logActivity(locals.admin.id, 'CREATE', 'users', newUser.id, { name: newUser.name });
			}

		} catch (error) {
			console.error('Error creating user:', error);
			// Check for unique constraint violation on email
			return fail(500, { message: 'Failed to create user. Email might already be in use.' });
		}

		throw redirect(303, '/users');
	}
} satisfies Actions;
