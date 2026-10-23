import { env } from '$env/dynamic/public';
import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import { ADMIN_ROLES, getRolePermissions } from '$lib/permissions';

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
	// 1. CSRF Protection for state-changing HTTP methods
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
		const origin = event.request.headers.get('origin');
		if (origin) {
			try {
				const originUrl = new URL(origin);
				if (originUrl.origin !== event.url.origin) {
					return new Response(
						JSON.stringify({
							error: 'CSRF_REJECTED',
							message: 'Permintaan ditolak: header origin tidak cocok dengan domain aplikasi.'
						}),
						{
							status: 403,
							headers: {
								'cache-control': 'no-store',
								'content-type': 'application/json; charset=utf-8'
							}
						}
					);
				}
			} catch {
				return new Response(
					JSON.stringify({
						error: 'CSRF_REJECTED',
						message: 'Permintaan ditolak: format origin tidak valid.'
					}),
					{
						status: 403,
						headers: {
							'cache-control': 'no-store',
							'content-type': 'application/json; charset=utf-8'
						}
					}
				);
			}
		}
	}

	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');
	const isAuthRoute =
		event.url.pathname.startsWith('/login') ||
		event.url.pathname.startsWith('/signup') ||
		event.url.pathname.startsWith('/reset-password') ||
		event.url.pathname.startsWith('/verify');

	// Applies to SSR, navigation data, actions, errors and auth redirects.
	if (accessToken || refreshToken || isAuthRoute) {
		event.setHeaders({ 'cache-control': 'private,no-store' });
	}

	const cookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: process.env.NODE_ENV === 'production'
	};

	const clearAuthCookies = () => {
		accessToken = undefined;
		event.locals.accessToken = undefined;
		event.locals.user = undefined;
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
				maxAge: 60 * 60 * 24 * 15
			});
			event.cookies.delete('user_session', { path: '/' });
			return accessToken;
		}
		clearAuthCookies();
		return null;
	};

	// 2. If access token is missing or expiring soon, but refresh token exists, refresh it
	if (refreshToken && (!accessToken || isTokenExpiring(accessToken))) {
		accessToken = (await tryRefresh()) ?? undefined;
	}

	// 3. Fetch current user if we have an access token
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
			event.locals.accessToken = accessToken;
			event.locals.user = {
				id: data.id,
				name: data.name,
				email: data.email,
				role: data.role,
				permissions: getRolePermissions(data.role),
				accessToken
			};
		} else {
			clearAuthCookies();
		}
	}

	// 4. Protect app routes
	if (!event.locals.user && !isAuthRoute) {
		if (!event.url.pathname.startsWith('/api')) {
			throw redirect(303, '/login');
		}
	}

	// 5. Only administrative roles may access the admin application
	if (event.locals.user && !ADMIN_ROLES.has(event.locals.user.role) && !isAuthRoute) {
		if (!event.url.pathname.startsWith('/api')) {
			throw redirect(303, '/login?pending=true');
		}
		return new Response(
			JSON.stringify({
				error: 'FORBIDDEN',
				message: 'Akses administrator diperlukan.'
			}),
			{
				status: 403,
				headers: {
					'cache-control': 'no-store',
					'content-type': 'application/json; charset=utf-8'
				}
			}
		);
	}

	// 6. Redirect logged-in administrative users away from auth routes
	if (event.locals.user && isAuthRoute && ADMIN_ROLES.has(event.locals.user.role)) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
