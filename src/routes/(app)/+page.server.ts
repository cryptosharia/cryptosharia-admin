import { db } from '$lib/server/db';
import { tokens, users, messages, tags } from '$lib/server/db/schema';
import { count } from 'drizzle-orm';

export const load = async () => {
	try {
		const [tokenCount] = await db.select({ count: count() }).from(tokens);
		const [userCount] = await db.select({ count: count() }).from(users);
		const [messageCount] = await db.select({ count: count() }).from(messages);
		const [tagCount] = await db.select({ count: count() }).from(tags);
		
		return {
			tokenCount: tokenCount.count,
			adminCount: userCount.count, // Using total users as admin count for now
			contributorCount: 0, // Placeholder until roles are properly implemented
			messageCount: messageCount.count,
			tagCount: tagCount.count
		};
	} catch (error) {
		console.error('Database connection failed:', error);
		return {
			tokenCount: 0,
			adminCount: 0,
			contributorCount: 0,
			messageCount: 0,
			tagCount: 0,
			error: 'Database connection failed'
		};
	}
};
