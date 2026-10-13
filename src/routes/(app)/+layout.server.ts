import type { LayoutServerLoad } from './$types';
import { toPublicUser } from '$lib/server/public-user';

export const load = (({ locals }) => {
	return {
		user: toPublicUser(locals.user)
	};
}) satisfies LayoutServerLoad;
