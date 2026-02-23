import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const message = data.get('message') as string;

		if (!name || !email || !message) {
			return fail(400, { success: false, message: 'All fields are required.' });
		}

		try {
			// TODO: Implement API call to submit access request/message
			// await client.POST('/messages', { body: { name, email, message } });
			
			// Simulate successful submission for now
			await new Promise(r => setTimeout(r, 500));
			
			return { success: true, message: 'Your request has been submitted successfully!' };
		} catch (error) {
			console.error('Error sending message:', error);
			return fail(500, { success: false, message: 'Failed to send message. Please try again.' });
		}
	}
} satisfies Actions;
