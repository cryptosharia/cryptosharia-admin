import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const message = data.get('message') as string;

		if (!name || !email || !message) {
			return fail(400, { missing: true });
		}

		try {
			await db.insert(messages).values({
				name,
				email,
				message
			});
			return { success: true };
		} catch (error) {
			console.error('Error sending message:', error);
			return fail(500, { error: 'Failed to send message' });
		}
	}
} satisfies Actions;
