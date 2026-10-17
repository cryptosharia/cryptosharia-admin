import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canManageAcademy } from '$lib/permissions';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user || !canManageAcademy(locals.user.role)) {
		throw redirect(303, '/dashboard');
	}
	return {
		userRole: locals.user.role
	};
};
