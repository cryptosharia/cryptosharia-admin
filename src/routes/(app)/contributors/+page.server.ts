import { db } from '$lib/server/db';
// import { contributors } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// const allContributors = await db.select().from(contributors).orderBy(contributors.displayOrder);

	return {
		contributors: []
	};
};
