import { env } from '$env/dynamic/public';
import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'posts_manager', 'cryptoassets_manager']);

function isTokenExpiring(token: string) {
	try {
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as {
			exp?: number;
		};
		return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 30_000;
	} catch {
		return true;
	}
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	const apiUrl = env.PUBLIC_CS_API_URL;
	if (apiUrl && request.url.startsWith(apiUrl)) {
		const headers = new Headers(request.headers);
		try {
			const clientAddress = event.getClientAddress();
			headers.set('Forwarded', `for="${clientAddress.replace(/["\\]/g, '')}"`);
		} catch {
			// Some local adapters do not expose a client address.
		}
		request = new Request(request, { headers });
	}

	return fetch(request);
};

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

	const cookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: process.env.NODE_ENV === 'production'
	};

	const clearAuthCookies = () => {
		accessToken = undefined;
		event.cookies.delete('access_token', { path: '/' });
		event.cookies.delete('refresh_token', { path: '/' });
		event.cookies.delete('user_session', { path: '/' });
	};

	const tryRefresh = async (): Promise<string | null> => {
		if (!refreshToken) return null;
		const client = createApiClient({ fetch: event.fetch });
		const { data, error } = await client.POST('/auth/refresh', { body: { refreshToken } });
		if (!error && data?.accessToken) {
			accessToken = data.accessToken;
			event.cookies.set('access_token', accessToken, {
				...cookieOptions,
				maxAge: 60 * 15
			});
			event.cookies.set('refresh_token', refreshToken, {
				...cookieOptions,
				maxAge: 60 * 60 * 24 * 30
			});
			event.cookies.delete('user_session', { path: '/' });
			return accessToken;
		}
		clearAuthCookies();
		return null;
	};

	// 1. If access token is missing or expiring soon, but refresh token exists, refresh it
	if (refreshToken && (!accessToken || isTokenExpiring(accessToken))) {
		accessToken = (await tryRefresh()) ?? undefined;
	}

	// 2. Fetch current user if we have an access token
	if (accessToken) {
		let client = createApiClient({ fetch: event.fetch, accessToken });
		let { data } = await client.GET('/auth/me');

		// Fallback: if /auth/me failed (e.g. token expired/invalid) and we have a refreshToken, try refresh once
		if (!data && refreshToken) {
			const refreshedToken = await tryRefresh();
			if (refreshedToken) {
				accessToken = refreshedToken;
				client = createApiClient({ fetch: event.fetch, accessToken });
				const retry = await client.GET('/auth/me');
				data = retry.data;
			}
		}

		if (data) {
			event.locals.user = {
				id: data.id,
				name: data.name,
				email: data.email,
				role: data.role,
				permissions: [],
				accessToken
			};
		} else {
			clearAuthCookies();
		}
	}

	const isAuthRoute =
		event.url.pathname.startsWith('/login') ||
		event.url.pathname.startsWith('/signup') ||
		event.url.pathname.startsWith('/reset-password') ||
		event.url.pathname.startsWith('/verify');

	// Protect app routes
	if (!event.locals.user && !isAuthRoute) {
		if (!event.url.pathname.startsWith('/api')) {
			throw redirect(303, '/login');
		}
	}

	// Only administrative roles may access the admin application.
	if (event.locals.user && !ADMIN_ROLES.has(event.locals.user.role) && !isAuthRoute) {
		throw redirect(303, '/login?pending=true');
	}

	// Redirect logged-in administrative users away from auth routes.
	if (event.locals.user && isAuthRoute && ADMIN_ROLES.has(event.locals.user.role)) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
