import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, roles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { missing: true });
		}

		// Ensure Super Admin Role exists
		let adminRole = await db.query.roles.findFirst({
			where: eq(roles.role, 'super_admin')
		});

		if (!adminRole) {
			const [newRole] = await db.insert(roles).values({
				role: 'super_admin'
			}).returning();
			adminRole = newRole;
		}

		// Check if any user exists, if not create default admin
		const allUsers = await db.select().from(users).limit(1);
		if (allUsers.length === 0) {
			const hashedPassword = await bcrypt.hash('password', 10);
			await db.insert(users).values({
				name: 'Super Admin',
				email: 'admin@cryptosharia.com',
				hashedPassword: hashedPassword,
				roleId: adminRole?.id,
				status: 'active',
				isEmailVerified: true
			});
			console.log('Created default admin: admin@cryptosharia.com / password');
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user || user.status !== 'active') {
			return fail(400, { invalid: true });
		}

		const validPassword = await bcrypt.compare(password, user.hashedPassword);

		if (!validPassword) {
			return fail(400, { invalid: true });
		}

		// 2FA Handling (Placeholder or if secret exists)
		if (user.twoFactorSecret) {
			// Redirect to 2FA page
			cookies.set('2fa_session', user.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 10 // 10 minutes
			});
			throw redirect(303, '/login/2fa');
		}

		// Set session cookie
		cookies.set('admin_session', user.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/');
	}
} satisfies Actions;
