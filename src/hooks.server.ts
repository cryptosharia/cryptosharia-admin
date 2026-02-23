import { redirect, type Handle } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');

	if (accessToken) {
		const client = createApiClient({ fetch: event.fetch, accessToken });
		const { data, error } = await client.GET('/auth/me');

		if (data?.success && data.data) {
			event.locals.user = {
				id: data.data.id,
				name: data.data.name,
				email: data.data.email,
				role: data.data.role,
				permissions: data.data.permissions,
				accessToken: accessToken
			};
		} else {
			// Invalidate session if token is invalid
			event.cookies.delete('access_token', { path: '/' });
			event.cookies.delete('refresh_token', { path: '/' });
		}
	}

	const isAuthRoute = 
		event.url.pathname.startsWith('/login') || 
		event.url.pathname.startsWith('/signup') || 
		event.url.pathname.startsWith('/reset-password') || 
		event.url.pathname.startsWith('/request-access');
	
	// Protect app routes
	if (!event.locals.user && !isAuthRoute) {
		// Allow API routes to pass through if needed, or secure them too? 
		// Usually API routes are protected by the same mechanism or token check.
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
