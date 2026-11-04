import { createApiClient } from '$lib/api';
import { _ROLES } from '../[id]/+page.server';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		roles: _ROLES
	};
};

export const actions = {
	default: async ({ request, fetch, locals }) => {
		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = (formData.get('name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = (formData.get('password') as string) || '';
		const role = (formData.get('role') as string)?.trim() || 'member';
		const status = (formData.get('status') as string)?.trim() || 'active';

		const values = { name, email, role, status };

		if (!name || !email || !password) {
			return fail(400, {
				success: false,
				message: 'Nama, email, dan password wajib diisi.',
				values
			});
		}

		if (name.length < 2 || name.length > 120) {
			return fail(400, {
				success: false,
				message: 'Nama harus memiliki panjang antara 2 hingga 120 karakter.',
				values
			});
		}

		if (password.length < 12) {
			return fail(400, {
				success: false,
				message: 'Password harus memiliki minimal 12 karakter.',
				values
			});
		}

		try {
			const { data, error: apiError } = await (client as any).POST('/users', {
				body: {
					name,
					email,
					password,
					role,
					status
				}
			});

			if (apiError) {
				console.error('Create user error:', apiError);
				let message = 'Gagal membuat pengguna baru.';
				if (typeof apiError === 'object' && apiError !== null) {
					if ('message' in apiError) {
						if (Array.isArray((apiError as any).message)) {
							message = (apiError as any).message.join(', ');
						} else if (typeof (apiError as any).message === 'string') {
							message = (apiError as any).message;
						}
					}
					if ((apiError as any).statusCode === 409 || (apiError as any).error === 'Conflict') {
						message = 'Email sudah terdaftar. Silakan gunakan email lain.';
					} else if ((apiError as any).statusCode === 403 || (apiError as any).error === 'Forbidden') {
						message = 'Anda tidak memiliki hak akses untuk membuat pengguna baru.';
					}
				}
				return fail(400, {
					success: false,
					message,
					values
				});
			}
		} catch (err: any) {
			if (err instanceof Response) throw err;
			console.error('Unexpected error creating user:', err);
			return fail(500, {
				success: false,
				message: err.message || 'Terjadi kesalahan internal saat membuat pengguna.',
				values
			});
		}

		throw redirect(303, '/users');
	}
} satisfies Actions;
