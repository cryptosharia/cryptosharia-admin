import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { message: 'Email is required.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/password/forgot', {
				query: { notify: true },
				body: { email }
			});

			if (error || !data?.success) {
				return fail(400, { message: data?.message || 'Failed to send reset email.' });
			}

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: 'Internal server error.' });
		}
	}
} satisfies Actions;
