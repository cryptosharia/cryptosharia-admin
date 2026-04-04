import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// If a token is in the URL, we're in "reset" mode, otherwise "forgot" mode
	const token = url.searchParams.get('token') || '';
	return { token };
};

export const actions = {
	// Step 1: Request reset email (forgot password)
	forgot: async ({ request, fetch }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { mode: 'forgot', message: 'Email is required.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/password/forgot', {
				query: { notify: true },
				body: { email }
			});

			if (error || !data?.success) {
				return fail(400, { mode: 'forgot', message: data?.message || 'Failed to send reset email.' });
			}

			return { success: true, mode: 'forgot' };
		} catch (err: any) {
			return fail(500, { mode: 'forgot', message: 'Internal server error.' });
		}
	},

	// Step 2: Submit new password with token
	reset: async ({ request, fetch }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token || !password) {
			return fail(400, { mode: 'reset', message: 'Token and password are required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { mode: 'reset', message: 'Passwords do not match.' });
		}

		if (password.length < 12) {
			return fail(400, { mode: 'reset', message: 'Password must be at least 12 characters.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/password/reset', {
				body: { token, password }
			});

			if (error || !data?.success) {
				return fail(400, { mode: 'reset', message: data?.message || error?.message || 'Invalid or expired reset token.' });
			}

			return { success: true, mode: 'reset' };
		} catch (err: any) {
			return fail(500, { mode: 'reset', message: 'Internal server error.' });
		}
	}
} satisfies Actions;
