import { createApiClient } from '$lib/api';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') || '';
	return { token };
};

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;

		if (!token) {
			return fail(400, { message: 'Verification token is required.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/verify', {
				body: { token }
			});

			if (error || !data?.success) {
				return fail(400, { message: data?.message || error?.message || 'Invalid or expired verification token.' });
			}

			return { success: true };
		} catch (err: any) {
			console.error('Verify error:', err);
			return fail(500, { message: 'Verification failed. Please try again.' });
		}
	}
} satisfies Actions;
