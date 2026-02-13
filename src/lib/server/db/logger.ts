import { db } from './index';
import { activityLogs } from './schema';

export async function logActivity(adminId: string, action: string, subjectType: string, subjectId?: string, description?: any, ipAddress?: string) {
	try {
		await db.insert(activityLogs).values({
			adminId,
			action,
			subjectType,
			subjectId,
			description,
			ipAddress
		});
	} catch (error) {
		console.error('Failed to log activity:', error);
	}
}
