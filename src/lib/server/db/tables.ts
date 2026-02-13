import {
	pgTable,
	uuid,
	timestamp,
	text,
	integer,
	pgEnum,
	varchar,
	boolean,
	bigint,
	primaryKey,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';
// --- Helpers ---

/**
 * Standard Primary Key for UUID-based tables.
 */
const PK_UUID = {
	id: uuid('id').primaryKey().defaultRandom()
};

/**
 * Audit field for creation timestamp.
 */
const CREATED_AT = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
};

/**
 * Audit field for update timestamp.
 * Logically nullable to represent an 'unmodified' state.
 */
const UPDATED_AT = {
	updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date())
};

/**
 * Content field for publication timestamp.
 */
const PUBLISHED_AT = {
	publishedAt: timestamp('published_at', { withTimezone: true })
};

/**
 * Standard audit field for the creator.
 */
const CREATED_BY = {
	createdBy: uuid('created_by').references(() => users.id)
};

/**
 * Standard audit field for the updater.
 */
const UPDATED_BY = {
	updatedBy: uuid('updated_by').references(() => users.id)
};

/**
 * Specialized audit helpers specifically for tables that have circular dependencies (users, roles).
 * Uses AnyPgColumn to break the TypeScript recursion loop while keeping SQL Foreign Keys.
 */
const UPDATED_BY_CIR = {
	updatedBy: uuid('updated_by').references((): AnyPgColumn => users.id)
};

// --- Enums ---

/**
 * Practical Sharia status for crypto assets.
 */
export const shariaStatusEnum = pgEnum('sharia_status', ['halal', 'haram', 'syubhat']);

/**
 * Publication lifecycle status for CMS content.
 */
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);

/**
 * Storage provider for assets.
 */
export const assetProviderEnum = pgEnum('asset_provider', ['picsum', 'vercel_blob']);

/**
 * Post section categories.
 */
export const postSectionEnum = pgEnum('post_section', [
	'news',
	'education',
	'research',
	'activity'
]);

/**
 * Post content types.
 */
export const postTypeEnum = pgEnum('post_type', ['article', 'webinar', 'video', 'headline']);

/**
 * Password hashing algorithm used for user passwords.
 */
export const hashingAlgorithmEnum = pgEnum('hashing_algorithm', ['argon2id']);

/**
 * Administrative status for user accounts.
 */
export const userStatusEnum = pgEnum('user_status', [
	'active', // Active user
	'inactive', // Soft-deleted/Deactivated
	'suspended', // Temporary block (investigation, payment, etc)
	'banned' // Permanent block (policy violation)
]);

// --- Tables ---

/**
 * Stores permissions per module.
 */
export const permissions = pgTable('permissions', {
	...PK_UUID,
	/** Programmatic identifier for code-level permission checks (e.g. 'tokens.manage') */
	permission: varchar('permission', { length: 100 }).notNull().unique()
});

/**
 * Stores roles for users.
 */
export const roles = pgTable('roles', {
	...PK_UUID,
	/** Programmatic identifier (e.g. 'super_admin', 'content_editor') */
	role: varchar('role', { length: 50 }).notNull().unique()
});

/**
 * Stores users (both regular users and staff).
 */
export const users = pgTable('users', {
	...PK_UUID,
	/** Full name of the user */
	name: varchar('name', { length: 120 }).notNull(),
	/** Unique email address for login and notifications */
	email: varchar('email', { length: 255 }).notNull().unique(),
	/** Argon2 or Bcrypted password hash */
	hashedPassword: text('hashed_password').notNull(),
	/** Algorithm used for password hashing */
	passwordHashingAlgorithm: hashingAlgorithmEnum('password_hashing_algorithm')
		.notNull()
		.default('argon2id'),
	/** Reference to the user's profile image (optional) */
	avatarId: uuid('avatar_id').references((): AnyPgColumn => assets.id),
	/** Reference to the assigned role (NULL = regular user, set = staff/admin) */
	roleId: uuid('role_id').references(() => roles.id),
	/** Administrative account lifecycle status */
	status: userStatusEnum('status').notNull().default('active'),
	/** TOTP or secondary authentication secret */
	twoFactorSecret: text('two_factor_secret'),
	/** Timestamp of the most recent successful login */
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
	/** Email verification status */
	isEmailVerified: boolean('is_email_verified').notNull().default(false),
	...CREATED_AT,
	...UPDATED_AT,
	...UPDATED_BY_CIR
});

/**
 * Stores role-permission many-to-many relationships.
 */
export const rolePermissions = pgTable(
	'role_permissions',
	{
		/** Reference to the role */
		roleId: uuid('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade' }),
		/** Reference to the permission */
		permissionId: uuid('permission_id')
			.notNull()
			.references(() => permissions.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

/**
 * Stores audit logs for user activities.
 */
export const activityLogs = pgTable('activity_logs', {
	...PK_UUID,
	/** ID of the user who performed the action */
	userId: uuid('user_id').references(() => users.id),
	/** Description of the action (e.g. 'create', 'update', 'delete') */
	action: varchar('action', { length: 50 }).notNull(),
	/** Type of entity the action was performed on (e.g. 'tokens', 'posts') */
	subjectType: varchar('subject_type', { length: 50 }).notNull(),
	/** ID of the specific entity associated with the log */
	subjectId: uuid('subject_id'),
	/** Detailed human-readable description of the event */
	description: text('description'),
	/** IP address of the user at the time of the action */
	ipAddress: varchar('ip_address', { length: 45 }),
	...CREATED_AT
});

/**
 * Stores refresh tokens for session management and revocation.
 */
export const refreshTokens = pgTable('refresh_tokens', {
	...PK_UUID,
	/** ID of the user this token belongs to */
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	/** The actual refresh token (random string) */
	token: varchar('token', { length: 64 }).notNull().unique(),
	/** When this token expires */
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	/** When this token was revoked (NULL = active) */
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	...CREATED_AT
});

/**
 * Stores temporary tokens for email verification workflows.
 */
export const emailVerifications = pgTable('email_verifications', {
	...PK_UUID,
	/** ID of the user to be verified */
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	/** Secure random verification token */
	token: varchar('token', { length: 255 }).notNull().unique(),
	/** When this token expires (e.g. 24h from creation) */
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	/** When this token was used or invalidated */
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	...CREATED_AT,
	...UPDATED_AT
});

/**
 * Stores tokens data.
 */
export const tokens = pgTable('tokens', {
	...PK_UUID,
	/** Unique URL-friendly identifier for the token */
	slug: varchar('slug', { length: 100 }).notNull().unique(),
	/** Global market capitalization rank (optional) */
	rank: integer('rank').notNull(),
	/** Full display name of the cryptocurrency (e.g. 'Bitcoin') */
	name: varchar('name', { length: 100 }).notNull(),
	/** Short symbol (e.g. 'BTC') */
	ticker: varchar('ticker', { length: 20 }).notNull().unique(),
	/** Sharia compliance rating */
	shariaStatus: shariaStatusEnum('sharia_status').notNull(),
	/** Current editorial status of the token metadata */
	status: contentStatusEnum('status').notNull().default('draft'),
	/** Brief summary of the token */
	excerpt: text('excerpt').notNull(),
	/** TradingView symbol for technical charts (e.g. 'BINANCE:BTCUSDT') */
	tradingviewSymbol: varchar('tradingview_symbol', { length: 64 }),
	/** Official project website URL */
	website: text('website').notNull(),
	/** Reference to the token's logo asset */
	logoId: uuid('logo_id')
		.references(() => assets.id)
		.notNull(),
	/** Detailed Sharia analysis or project description (Markdown) */
	content: text('content').notNull(),
	...PUBLISHED_AT,
	...CREATED_AT,
	...UPDATED_AT,
	...CREATED_BY,
	...UPDATED_BY
});

/**
 * Stores blog posts, articles, and other content types.
 */
export const posts = pgTable('posts', {
	...PK_UUID,
	/** Main title of the post or article */
	title: varchar('title', { length: 255 }).notNull(),
	/** Unique URL-friendly slug */
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	/** Brief summary of the content for listings */
	excerpt: text('excerpt').notNull(),
	/** Main content of the post (HTML or Markdown) */
	content: text('content').notNull(),
	/** Reference to the main cover image asset */
	coverImageId: uuid('cover_image_id')
		.references(() => assets.id)
		.notNull(),
	/** Logical section or category */
	section: postSectionEnum('section').notNull(),
	/** Document type */
	type: postTypeEnum('type').notNull(),
	/** Publication workflow status */
	status: contentStatusEnum('status').notNull().default('draft'),
	/** If true, this post will be highlighted in the UI */
	isFeatured: boolean('is_featured').notNull().default(false),
	/** Scheduled or historical date associated with the event */
	eventDate: timestamp('event_date', { withTimezone: true }),
	/** Link to external source or full article */
	externalLink: text('external_link'),
	...PUBLISHED_AT,
	...CREATED_AT,
	...UPDATED_AT,
	...CREATED_BY,
	...UPDATED_BY
});

/**
 * Stores tags for posts & tokens.
 */
export const tags = pgTable('tags', {
	...PK_UUID,
	/** Human-readable name of the tag (e.g. 'Halal Crypto') */
	name: varchar('name', { length: 50 }).notNull().unique(),
	/** URL-friendly identifier (e.g. 'halal-crypto') for SEO and routing */
	slug: varchar('slug', { length: 50 }).notNull().unique(),
	/** Detailed context about this tag */
	description: text('description'),
	...CREATED_AT,
	...UPDATED_AT,
	...CREATED_BY,
	...UPDATED_BY
});

/**
 * Junction table for the Many-to-Many relationship between Tokens and Tags.
 */
export const tokenTags = pgTable(
	'token_tags',
	{
		/** Reference to the associated Token */
		tokenId: uuid('token_id')
			.notNull()
			.references(() => tokens.id, { onDelete: 'cascade' }),
		/** Reference to the associated Tag */
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		/**
		 * Logical display order. Nullable to represent 'unprioritized' items.
		 */
		displayOrder: integer('display_order')
	},
	(t) => [primaryKey({ columns: [t.tokenId, t.tagId] })]
);

/**
 * Junction table for the Many-to-Many relationship between Posts and Tags.
 */
export const postTags = pgTable(
	'post_tags',
	{
		/** Reference to the associated Post */
		postId: uuid('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		/** Reference to the associated Tag */
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		/**
		 * Logical display order. Nullable to represent 'unprioritized' items.
		 */
		displayOrder: integer('display_order')
	},
	(t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

/**
 * Stores messages sent via the Contact Form.
 */
export const messages = pgTable('messages', {
	...PK_UUID,
	/** Name of the contact form sender */
	name: varchar('name', { length: 120 }).notNull(),
	/** Email address for response */
	email: varchar('email', { length: 255 }).notNull(),
	/** Full message content */
	message: text('message').notNull(),
	...CREATED_AT
});

/**
 * Stores metadata for all digital assets uploaded to files storage (Images, Markdowns, etc).
 */
export const assets = pgTable('assets', {
	...PK_UUID,
	/** Internal pathname in the storage provider */
	pathname: text('pathname').notNull().unique(),
	/** Original or generated filename */
	filename: varchar('filename', { length: 255 }).notNull(),
	/** File size in bytes (bigint for scale) */
	size: bigint('size', { mode: 'number' }).notNull(),
	/** MIME type (e.g. 'image/png') */
	mimeType: varchar('mime_type', { length: 100 }),
	/** Pixel width (for images) */
	width: integer('width'),
	/** Pixel height (for images) */
	height: integer('height'),
	/** Storage provider used for this asset */
	provider: assetProviderEnum('provider').notNull(),
	...CREATED_AT,
	...CREATED_BY
});

export const imgbbImages = pgTable('imgbb_images', {
	...PK_UUID,
	/** The unique ID for this asset on ImgBB */
	imgbbId: varchar('imgbb_id', { length: 255 }).notNull().unique(),
	/** The title of the asset */
	title: varchar('title', { length: 255 }).notNull(),
	/** Direct link to the original asset */
	url: text('url').notNull(),
	/** Image width in pixels */
	width: integer('width').notNull(),
	/** Image height in pixels */
	height: integer('height').notNull(),
	/** File size in bytes (bigint for scale) */
	size: bigint('size', { mode: 'number' }).notNull(),
	/** File name */
	fileName: varchar('file_name', { length: 255 }).notNull(),
	/** MIME type */
	mimeType: varchar('mime_type', { length: 100 }).notNull(),
	/** URL to delete this asset */
	deleteUrl: text('delete_url').notNull(),
	...CREATED_AT,
	...CREATED_BY
});
