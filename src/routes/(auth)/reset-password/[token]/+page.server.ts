import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const token = params.token;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token) {
			return fail(400, { message: 'Reset token is required.' });
		}

		if (!password) {
			return fail(400, { message: 'Password is required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		if (password.length < 12) {
			return fail(400, { message: 'Password must be at least 12 characters.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/password/reset', {
				body: { token, password }
			});

			if (error || !data?.success) {
				return fail(400, {
					message: data?.message || error?.message || 'Invalid or expired reset token.'
				});
			}

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: 'Internal server error.' });
		}
	}
} satisfies Actions;
