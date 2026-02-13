import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, roles } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allRoles = await db.select().from(roles);
	return {
		roles: allRoles
	};
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const roleId = data.get('roleId') as string;
		const isActive = data.get('isActive') === 'on';

		if (!name || !email || !password || !roleId) {
			return fail(400, { missing: true });
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			await db.insert(users).values({
				name,
				email,
				hashedPassword: hashedPassword,
				roleId,
				status: isActive ? 'active' : 'inactive',
				isEmailVerified: true
			});
		} catch (error) {
			console.error('Error creating admin:', error);
			return fail(500, { message: 'Failed to create admin. Email might already be in use.' });
		}

		throw redirect(303, '/admins');
	}
} satisfies Actions;
