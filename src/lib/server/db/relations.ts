import { relations } from 'drizzle-orm';
import {
	users,
	roles,
	permissions,
	rolePermissions,
	activityLogs,
	refreshTokens,
	tokens,
	assets,
	tokenTags,
	tags,
	posts,
	postTags
} from './tables';

/**
 * Relations for the Users table.
 */
export const usersRelations = relations(users, ({ one, many }) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
	avatar: one(assets, {
		fields: [users.avatarId],
		references: [assets.id]
	}),
	updatedBy: one(users, {
		fields: [users.updatedBy],
		references: [users.id],
		relationName: 'user_updated_by'
	}),
	activityLogs: many(activityLogs),
	refreshTokens: many(refreshTokens)
}));

/**
 * Relations for the Roles table.
 */
export const rolesRelations = relations(roles, ({ many }) => ({
	permissions: many(rolePermissions)
}));

/**
 * Relations for the Permissions table.
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
	roles: many(rolePermissions)
}));

/**
 * Relations for the Role-Permissions junction table.
 */
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	})
}));

/**
 * Relations for the Activity Logs table.
 */
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	})
}));

/**
 * Relations for the Refresh Tokens table.
 */
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	})
}));

/**
 * Relations for the Tokens table.
 */
export const tokensRelations = relations(tokens, ({ one, many }) => ({
	logo: one(assets, {
		fields: [tokens.logoId],
		references: [assets.id]
	}),
	createdBy: one(users, {
		fields: [tokens.createdBy],
		references: [users.id]
	}),
	updatedBy: one(users, {
		fields: [tokens.updatedBy],
		references: [users.id]
	}),
	tags: many(tokenTags)
}));

/**
 * Relations for the Posts table.
 */
export const postsRelations = relations(posts, ({ one, many }) => ({
	coverImage: one(assets, {
		fields: [posts.coverImageId],
		references: [assets.id]
	}),
	createdBy: one(users, {
		fields: [posts.createdBy],
		references: [users.id]
	}),
	updatedBy: one(users, {
		fields: [posts.updatedBy],
		references: [users.id]
	}),
	tags: many(postTags)
}));

/**
 * Relations for the Tags table.
 */
export const tagsRelations = relations(tags, ({ many }) => ({
	tokenTags: many(tokenTags),
	postTags: many(postTags)
}));

/**
 * Relations for the Token-Tags junction table.
 */
export const tokenTagsRelations = relations(tokenTags, ({ one }) => ({
	token: one(tokens, {
		fields: [tokenTags.tokenId],
		references: [tokens.id]
	}),
	tag: one(tags, {
		fields: [tokenTags.tagId],
		references: [tags.id]
	})
}));

/**
 * Relations for the Post-Tags junction table.
 */
export const postTagsRelations = relations(postTags, ({ one }) => ({
	post: one(posts, {
		fields: [postTags.postId],
		references: [posts.id]
	}),
	tag: one(tags, {
		fields: [postTags.tagId],
		references: [tags.id]
	})
}));

/**
 * Relations for the Assets table.
 */
export const assetsRelations = relations(assets, ({ one }) => ({
	createdBy: one(users, {
		fields: [assets.createdBy],
		references: [users.id]
	})
}));
