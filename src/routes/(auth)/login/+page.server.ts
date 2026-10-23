import { fail, redirect, type Cookies } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import { ADMIN_ROLES, getRolePermissions } from '$lib/permissions';
import type { Actions } from './$types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 15;

function hasControlCharacters(value: string): boolean {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 0x1f || code === 0x7f) return true;
	}
	return false;
}

function safeRedirect(value: string | null): string {
	if (
		!value ||
		!value.startsWith('/') ||
		value.startsWith('//') ||
		value.includes('\\') ||
		hasControlCharacters(value)
	) {
		return '/dashboard';
	}

	try {
		const target = new URL(value, 'https://admin.invalid');
		if (target.origin !== 'https://admin.invalid' || target.pathname === '/login') {
			return '/dashboard';
		}
		return `${target.pathname}${target.search}${target.hash}`;
	} catch {
		return '/dashboard';
	}
}

async function completeAdminLogin(input: {
	cookies: Cookies;
	fetch: typeof fetch;
	redirect: string | null;
	email: string;
	accessToken: string;
	refreshToken: string;
	otpRequested?: boolean;
}) {
	const apiClient = createApiClient({ fetch: input.fetch });
	const profileClient = createApiClient({
		fetch: input.fetch,
		accessToken: input.accessToken
	});
	const { data: profile, error } = await profileClient.GET('/auth/me');
	if (error || !profile) {
		return fail(502, {
			email: input.email,
			otpRequested: input.otpRequested,
			error: 'Profil akun tidak dapat dimuat.'
		});
	}

	if (!ADMIN_ROLES.has(profile.role)) {
		await apiClient.POST('/auth/signout', { body: { refreshToken: input.refreshToken } });
		return fail(403, {
			email: input.email,
			otpRequested: input.otpRequested,
			error: 'Akun ini tidak memiliki akses ke panel admin.'
		});
	}

	const cookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: process.env.NODE_ENV === 'production'
	};
	input.cookies.set('access_token', input.accessToken, {
		...cookieOptions,
		maxAge: 60 * 15
	});
	input.cookies.set('refresh_token', input.refreshToken, {
		...cookieOptions,
		maxAge: REFRESH_TOKEN_MAX_AGE
	});
	input.cookies.set(
		'user_session',
		JSON.stringify({
			id: profile.id,
			name: profile.name,
			email: profile.email,
			role: profile.role,
			permissions: getRolePermissions(profile.role)
		}),
		{ ...cookieOptions, maxAge: 60 * 15 }
	);

	throw redirect(303, safeRedirect(input.redirect));
}

export const actions = {
	loginWithPassword: async ({ request, cookies, fetch, url }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const passwordValue = data.get('password');
		const redirectValue = data.get('redirect');
		const redirectPath =
			typeof redirectValue === 'string' && redirectValue
				? redirectValue
				: url.searchParams.get('redirect');
		const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
		const password = typeof passwordValue === 'string' ? passwordValue : '';
		if (!EMAIL_PATTERN.test(email) || email.length > 255 || !password || password.length > 128) {
			return fail(400, {
				email,
				redirect: redirectPath ?? '',
				error: 'Masukkan email dan kata sandi yang valid.'
			});
		}

		const client = createApiClient({ fetch });
		const { data: tokens, error } = await client.POST('/auth/password/login', {
			body: { email, password }
		});
		if (error || !tokens) {
			return fail(error?.error === 'PASSWORD_LOGIN_RATE_LIMITED' ? 429 : 401, {
				email,
				redirect: redirectPath ?? '',
				error:
					error?.error === 'PASSWORD_LOGIN_RATE_LIMITED'
						? 'Terlalu banyak percobaan. Coba lagi nanti.'
						: 'Email atau kata sandi tidak valid.'
			});
		}

		return completeAdminLogin({
			cookies,
			fetch,
			redirect: redirectPath,
			email,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken
		});
	},
	requestOtp: async ({ request, fetch }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
		const redirectValue = data.get('redirect');
		const redirectPath = typeof redirectValue === 'string' && redirectValue ? redirectValue : '';
		if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
			return fail(400, {
				email,
				redirect: redirectPath,
				error: 'Masukkan alamat email yang valid.'
			});
		}

		const client = createApiClient({ fetch });
		const { error } = await client.POST('/auth/otp/request', { body: { email } });
		if (error)
			return fail(503, {
				email,
				redirect: redirectPath,
				error: 'Kode OTP belum dapat dikirim. Coba lagi.'
			});

		return {
			email,
			redirect: redirectPath,
			otpRequested: true,
			message: 'Jika alamat dapat menerima kode, OTP telah dikirim.'
		};
	},
	verifyOtp: async ({ request, cookies, fetch, url }) => {
		const data = await request.formData();
		const emailValue = data.get('email');
		const codeValue = data.get('code');
		const redirectValue = data.get('redirect');
		const redirectPath =
			typeof redirectValue === 'string' && redirectValue
				? redirectValue
				: url.searchParams.get('redirect');
		const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
		const code = typeof codeValue === 'string' ? codeValue.trim() : '';
		if (!EMAIL_PATTERN.test(email) || !/^[0-9]{6}$/.test(code)) {
			return fail(400, {
				email,
				redirect: redirectPath ?? '',
				otpRequested: true,
				error: 'Masukkan kode OTP 6 digit.'
			});
		}

		const client = createApiClient({ fetch });
		const { data: tokens, error } = await client.POST('/auth/otp/verify', {
			body: { email, code }
		});
		if (error || !tokens) {
			return fail(401, {
				email,
				redirect: redirectPath ?? '',
				otpRequested: true,
				error: 'Kode OTP tidak valid atau kedaluwarsa.'
			});
		}

		return completeAdminLogin({
			cookies,
			fetch,
			redirect: redirectPath,
			email,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			otpRequested: true
		});
	}
} satisfies Actions;
