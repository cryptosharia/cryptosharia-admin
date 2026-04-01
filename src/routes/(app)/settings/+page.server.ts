import { createApiClient } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		twoFactorEnabled: false,
		qrCodeUrl: undefined as string | undefined,
		twoFactorSecret: undefined as string | undefined
	};
};

export const actions = {
	update: async () => {
		// General settings are UI-only (no API endpoint for site config)
		return { success: true, message: 'Settings saved.' };
	},

	changePassword: async ({ fetch, locals }) => {
		const email = locals.user?.email;

		if (!email) {
			return fail(401, { message: 'Not authenticated.' });
		}

		const client = createApiClient({ fetch }) as any;

		try {
			const { data, error } = await client.POST('/auth/password/forgot', {
				query: { notify: true },
				body: { email }
			});

			if (error || !data?.success) {
				return fail(400, { message: data?.message || 'Failed to send reset email.' });
			}

			return { success: true, message: `A password reset link has been sent to ${email}.` };
		} catch (err: any) {
			return fail(500, { message: 'Internal server error.' });
		}
	},

	enable2FA: async () => {
		return fail(501, { message: '2FA is not yet supported.' });
	},

	disable2FA: async () => {
		return fail(501, { message: '2FA is not yet supported.' });
	}
} satisfies Actions;
