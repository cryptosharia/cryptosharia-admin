import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const message = data.get('message') as string;

		if (!name || !email || !message) {
			return fail(400, { success: false, message: 'All fields are required.' });
		}

		const client = createApiClient({ fetch });

		try {
			const { data: res, error } = await client.POST('/messages', {
				body: { name, email, message }
			});

			if (error || !res) {
				return fail(400, { success: false, message: 'Failed to send message.' });
			}

			return { success: true };
		} catch (err: any) {
			console.error('Error sending message:', err);
			return fail(500, { success: false, message: 'Failed to send message. Please try again.' });
		}
	}
} satisfies Actions;
