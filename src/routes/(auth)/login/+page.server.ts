import { fail, redirect } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { missing: true });
		}

		const client = createApiClient({ fetch });
		const { data: res, error } = await client.POST('/auth/signin', {
			body: { email, password }
		});

		if (error || !res?.success || !res.data) {
			return fail(401, { invalid: true, message: res?.message || 'Invalid credentials' });
		}

		// Set cookies
		cookies.set('access_token', res.data.accessToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 // 1 hour
		});
		cookies.set('refresh_token', res.data.refreshToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
