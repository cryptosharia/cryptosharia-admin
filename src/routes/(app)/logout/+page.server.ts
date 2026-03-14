import { redirect } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { Actions } from './$types';

export const actions = {
	default: async ({ cookies, fetch }) => {
		// Call signout API to revoke refresh token
		const refreshToken = cookies.get('refresh_token');
		if (refreshToken) {
			try {
				const client = createApiClient({ fetch });
				await client.POST('/auth/signout', { body: { refreshToken } });
			} catch {
				// Best-effort, continue to clear cookies even if API call fails
			}
		}

		// Clear all session cookies
		cookies.delete('access_token', { path: '/' });
		cookies.delete('refresh_token', { path: '/' });
		cookies.delete('user_session', { path: '/' });

		throw redirect(303, '/login');
	}
} satisfies Actions;
