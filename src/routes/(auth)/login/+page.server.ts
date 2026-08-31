import { fail, redirect } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { Actions } from './$types';

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'posts_manager', 'cryptoassets_manager']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions = {
	requestOtp: async ({ request, fetch }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const email = typeof emailValue === 'string' ? emailValue.trim() : '';

		if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
			return fail(400, { email, error: 'Masukkan alamat email yang valid.' });
		}

		const client = createApiClient({ fetch });
		const { error } = await client.POST('/auth/otp/request', {
			body: { email }
		});

		if (error) {
			return fail(400, { email, error: 'Kode OTP gagal dikirim.' });
		}

		return { email, otpRequested: true, message: 'Kode OTP telah dikirim ke email Anda.' };
	},

	verifyOtp: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const codeValue = data.get('code');
		const email = typeof emailValue === 'string' ? emailValue.trim() : '';
		const code = typeof codeValue === 'string' ? codeValue.trim() : '';

		if (!email || !EMAIL_PATTERN.test(email) || !/^[0-9]{6}$/.test(code)) {
			return fail(400, { email, otpRequested: true, error: 'Masukkan kode OTP 6 digit.' });
		}

		const client = createApiClient({ fetch });
		const { data: res, error } = await client.POST('/auth/otp/verify', {
			body: { email, code }
		});

		if (error || !res) {
			return fail(401, {
				email,
				otpRequested: true,
				error: 'Kode OTP tidak valid atau kedaluwarsa.'
			});
		}

		const meClient = createApiClient({ fetch, accessToken: res.accessToken });
		const { data: meRes, error: meError } = await meClient.GET('/auth/me');
		if (meError || !meRes) {
			return fail(502, { email, otpRequested: true, error: 'Profil akun tidak dapat dimuat.' });
		}

		if (!ADMIN_ROLES.has(meRes.role)) {
			await client.POST('/auth/signout', { body: { refreshToken: res.refreshToken } });
			return fail(403, {
				email,
				otpRequested: true,
				error: 'Akun ini tidak memiliki akses ke panel admin.'
			});
		}

		const cookieOptions = {
			path: '/',
			httpOnly: true,
			sameSite: 'strict' as const,
			secure: process.env.NODE_ENV === 'production'
		};

		cookies.set('access_token', res.accessToken, {
			...cookieOptions,
			maxAge: 60 * 15
		});
		cookies.set('refresh_token', res.refreshToken, {
			...cookieOptions,
			maxAge: 60 * 60 * 24 * 30
		});

		const userData = {
			id: meRes.id,
			name: meRes.name,
			email: meRes.email,
			role: meRes.role,
			permissions: []
		};
		cookies.set('user_session', JSON.stringify(userData), {
			...cookieOptions,
			maxAge: 60 * 15
		});

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
