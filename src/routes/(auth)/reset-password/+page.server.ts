import { fail } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { Actions } from './$types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions = {
	requestReset: async ({ request, fetch }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
		if (!EMAIL_PATTERN.test(email) || email.length > 255) {
			return fail(400, { email, message: 'Masukkan alamat email yang valid.' });
		}

		const client = createApiClient({ fetch });
		const { error } = await client.POST('/auth/password/forgot', {
			body: { email, application: 'admin' }
		});
		if (error) {
			return fail(503, { email, message: 'Permintaan belum dapat diproses. Coba lagi nanti.' });
		}

		return { success: true };
	}
} satisfies Actions;
