import { redirect, type Handle } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');

	if (accessToken) {
		// Try to read cached user data from cookie first (avoids API call on every request)
		const cachedUserRaw = event.cookies.get('user_session');

		if (cachedUserRaw) {
			try {
				const cachedUser = JSON.parse(cachedUserRaw);
				event.locals.user = {
					...cachedUser,
					accessToken
				};
			} catch {
				// Invalid cache, fall through to API call
			}
		}

		// Only call API if we don't have cached user data
		if (!event.locals.user) {
			const client = createApiClient({ fetch: event.fetch, accessToken });
			const { data, error } = await client.GET('/auth/me');

			if (data?.success && data.data) {
				const userData = {
					id: data.data.id,
					name: data.data.name,
					email: data.data.email,
					role: data.data.role,
					permissions: data.data.permissions
				};

				event.locals.user = { ...userData, accessToken };

				// Cache user data in a separate cookie (not httpOnly so it's readable)
				event.cookies.set('user_session', JSON.stringify(userData), {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 60 // 1 hour - matches access token expiry
				});
			} else {
				// Invalidate session if token is invalid
				event.cookies.delete('access_token', { path: '/' });
				event.cookies.delete('refresh_token', { path: '/' });
				event.cookies.delete('user_session', { path: '/' });
			}
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

	// Redirect logged in users away from auth routes
	if (event.locals.user && isAuthRoute) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
