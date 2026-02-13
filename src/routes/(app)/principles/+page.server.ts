import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Schema missing
	return {
		principles: []
	};
};
