import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!name || !email || !password || !confirmPassword) {
			return fail(400, { message: 'All fields are required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		if (password.length < 12) {
			return fail(400, { message: 'Password must be at least 12 characters.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/signup', {
				query: { notify: true },
				body: { name, email, password }
			});

			if (error || !data?.success) {
				const msg = error?.message || data?.message || 'Registration failed.';
				return fail(400, { message: msg });
			}

			return { success: true };
		} catch (err: any) {
			console.error('Signup error:', err);
			return fail(500, { message: 'Internal server error. Please try again.' });
		}
	}
} satisfies Actions;
