import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const userId = cookies.get('2fa_session');
	if (!userId) {
		throw redirect(303, '/login');
	}

	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const userId = cookies.get('2fa_session');
		if (!userId) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const token = data.get('token') as string;

		if (!token) {
			return fail(400, { missing: true });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!user || user.status !== 'active' || !user.twoFactorSecret) {
			throw redirect(303, '/login');
		}

		const isValid = authenticator.verify({
			token,
			secret: user.twoFactorSecret
		});

		if (!isValid) {
			return fail(400, { invalid: true });
		}

		// Clear 2FA session and set main session
		cookies.delete('2fa_session', { path: '/' });
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
