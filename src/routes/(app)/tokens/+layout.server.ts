import { error } from '@sveltejs/kit';
import { canManageCryptoassets } from '$lib/permissions';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!canManageCryptoassets(locals.user?.role)) {
		throw error(403, 'You do not have permission to manage cryptoassets.');
	}

	return {};
};
