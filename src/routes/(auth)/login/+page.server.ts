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

		const cookieOptions = {
			path: '/',
			httpOnly: true,
			sameSite: 'strict' as const,
			secure: process.env.NODE_ENV === 'production',
		};

		// Set tokens
		cookies.set('access_token', res.data.accessToken, {
			...cookieOptions,
			maxAge: 60 * 60 // 1 hour
		});
		cookies.set('refresh_token', res.data.refreshToken, {
			...cookieOptions,
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		// Cache user data immediately so hooks.server.ts doesn't need to call /auth/me
		// Fetch full user profile with role/permissions
		const meClient = createApiClient({ fetch, accessToken: res.data.accessToken });
		const { data: meRes } = await meClient.GET('/auth/me');
		
		if (meRes?.success && meRes.data) {
			const userData = {
				id: meRes.data.id,
				name: meRes.data.name,
				email: meRes.data.email,
				role: meRes.data.role,
				permissions: meRes.data.permissions,
			};
			cookies.set('user_session', JSON.stringify(userData), {
				...cookieOptions,
				maxAge: 60 * 60 // 1 hour
			});
		}

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
