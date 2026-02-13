import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    // Disabled
	throw error(404, 'Contributor not found');
};

export const actions = {
	update: async ({ request, params, locals }) => {
		throw redirect(303, '/contributors');
	},

	delete: async ({ params, locals }) => {
		throw redirect(303, '/contributors');
	}
} satisfies Actions;
