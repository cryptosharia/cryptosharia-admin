import { db } from '$lib/server/db';
import { activityLogs, users } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const logs = await db.select({
		id: activityLogs.id,
		action: activityLogs.action,
		subjectType: activityLogs.subjectType,
		description: activityLogs.description,
		createdAt: activityLogs.createdAt,
		adminName: users.name,
		adminEmail: users.email
	})
	.from(activityLogs)
	.leftJoin(users, eq(activityLogs.userId, users.id))
	.orderBy(desc(activityLogs.createdAt))
	.limit(100);

	return {
		logs
	};
};
