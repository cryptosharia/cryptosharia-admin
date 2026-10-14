import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { toPublicUser } from '$lib/server/public-user';

export const load = (({ locals }) => {
	return {
		user: toPublicUser(locals.user),
		twoFactorEnabled: false,
		qrCodeUrl: undefined as string | undefined,
		twoFactorSecret: undefined as string | undefined
	};
}) satisfies PageServerLoad;

export const actions = {
	update: async () => {
		// General settings are UI-only (no API endpoint for site config)
		return { success: true, message: 'Settings saved.' };
	},

	changePassword: async ({ locals }) => {
		const email = locals.user?.email;

		if (!email) {
			return fail(401, { message: 'Not authenticated.' });
		}

		return fail(410, {
			message: `API v2 menggunakan OTP untuk ${email}; password tidak lagi diperlukan.`
		});
	},

	enable2FA: async () => {
		return fail(501, { message: '2FA is not yet supported.' });
	},

	disable2FA: async () => {
		return fail(501, { message: '2FA is not yet supported.' });
	}
} satisfies Actions;
