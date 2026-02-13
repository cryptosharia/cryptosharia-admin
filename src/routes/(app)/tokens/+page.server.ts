import { db } from '$lib/server/db';
import { tokens } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load = async () => {
	try {
		const allTokens = await db.query.tokens.findMany({
			orderBy: [desc(tokens.createdAt)],
			with: {
				logo: true
			}
		});

		return {
			tokens: allTokens.map(t => ({
				...t,
				logoUrl: t.logo?.pathname // Assuming pathname is the URL or part of it
			}))
		};
	} catch (error) {
		console.error('Database connection failed:', error);
		return {
			tokens: [],
			error: 'Database connection failed'
		};
	}
};
