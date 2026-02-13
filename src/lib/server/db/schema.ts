export * from './tables';
export * from './relations';

import * as table from './tables';
import { createSelectSchema } from 'drizzle-zod';
import z from '../../zod-openapi';

// --- Entity Schemas (OpenAPI Ready) ---

// Permissions
export const Permission = createSelectSchema(table.permissions);
export type Permission = z.infer<typeof Permission>;

// Roles
export const Role = createSelectSchema(table.roles);
export type Role = z.infer<typeof Role>;

// Users
export const User = createSelectSchema(table.users, {
	name: (s) => s.trim().min(2)
}).extend({
	email: z.email().max(255)
});
export type User = z.infer<typeof User>;

// Activity Logs
export const ActivityLog = createSelectSchema(table.activityLogs);
export type ActivityLog = z.infer<typeof ActivityLog>;

// Assets
export const Asset = createSelectSchema(table.assets);
export type Asset = z.infer<typeof Asset>;

// ImgBB Images
export const ImgbbImage = createSelectSchema(table.imgbbImages);
export type ImgbbImage = z.infer<typeof ImgbbImage>;

// Tags
export const Tag = createSelectSchema(table.tags);
export type Tag = z.infer<typeof Tag>;

// Tokens
export const Token = createSelectSchema(table.tokens);
export type Token = z.infer<typeof Token>;

// Posts
export const Post = createSelectSchema(table.posts);
export type Post = z.infer<typeof Post>;

// --- Specialized Schemas (Custom Validation) ---

// Messages (Contact Form)
export const Message = createSelectSchema(table.messages, {
	name: (s) => s.trim().min(2),
	message: (s) => s.min(10).max(5000)
}) // Use extend to fix the z.string().email() deprecation
	.extend({
		email: z.email().max(255)
	});

export type Message = z.infer<typeof Message>;
