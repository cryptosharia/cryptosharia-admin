import { fail } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'referrer-policy': 'no-referrer' });
};

export const actions = {
	submitNewPassword: async ({ request, params, fetch }) => {
		const data = await request.formData();
		const passwordValue = data.get('password');
		const confirmValue = data.get('confirmPassword');
		const password = typeof passwordValue === 'string' ? passwordValue : '';
		const confirmPassword = typeof confirmValue === 'string' ? confirmValue : '';
		if (password.length < 12 || password.length > 128) {
			return fail(400, { message: 'Kata sandi harus terdiri dari 12 sampai 128 karakter.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { message: 'Konfirmasi kata sandi tidak cocok.' });
		}

		const client = createApiClient({ fetch });
		const { error } = await client.POST('/auth/password/reset', {
			body: { token: params.token, newPassword: password }
		});
		if (error) {
			return fail(400, {
				message: 'Tautan reset tidak valid atau telah kedaluwarsa. Minta tautan baru.'
			});
		}
		return { success: true };
	}
} satisfies Actions;
