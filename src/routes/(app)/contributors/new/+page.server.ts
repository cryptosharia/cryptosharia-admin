import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
        // Disabled
		throw redirect(303, '/contributors');
	}
} satisfies Actions;
