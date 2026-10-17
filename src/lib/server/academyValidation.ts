import { z } from 'zod';

export const createScopeSchema = z.object({
	id: z
		.string()
		.min(2, 'ID scope minimal 2 karakter')
		.max(50, 'ID scope maksimal 50 karakter')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
	name: z.string().min(2, 'Nama scope minimal 2 karakter').max(150),
	description: z.string().optional().default(''),
	isActive: z.boolean().optional().default(true)
});

export const updateScopeSchema = z.object({
	name: z.string().min(2, 'Nama scope minimal 2 karakter').max(150).optional(),
	description: z.string().optional(),
	isActive: z.boolean().optional()
});

export const createContentSchema = z.object({
	id: z
		.string()
		.min(2, 'ID konten minimal 2 karakter')
		.max(100, 'ID konten maksimal 100 karakter')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
	kind: z.enum(['subject', 'level', 'chapter', 'lesson']),
	parentId: z.string().min(1, 'parentId wajib diisi').max(100),
	subjectId: z.enum(['fundamental', 'technical', 'muamalah', 'web3']),
	level: z.number().int().min(1).max(6).default(1),
	chapterNumber: z.number().int().min(1).max(7).default(1),
	order: z.number().int().min(0).default(0),
	scopeId: z.string().max(50).nullable().optional(),
	title: z.string().min(2, 'Judul minimal 2 karakter').max(255),
	description: z.string().optional().default(''),
	thumbnail: z.string().optional().default('/favicon.png'),
	durationSeconds: z.number().int().min(0).optional().default(0),
	instructor: z.string().max(150).optional().default(''),
	syariahRequired: z.boolean().optional().default(false)
});

export const updateContentSchema = z.object({
	title: z.string().min(2, 'Judul minimal 2 karakter').max(255).optional(),
	description: z.string().optional(),
	thumbnail: z.string().optional(),
	durationSeconds: z.number().int().min(0).optional(),
	instructor: z.string().max(150).optional(),
	order: z.number().int().min(0).optional(),
	scopeId: z.string().max(50).nullable().optional(),
	syariahRequired: z.boolean().optional()
});

export const contentTransitionSchema = z.object({
	targetStatus: z.enum(['draft', 'review', 'approved', 'published', 'archived']),
	rightsConfirmed: z.boolean().optional().default(false)
});

export const setLessonMediaSchema = z.object({
	videoId: z.string().length(11, 'YouTube Video ID harus berupa 11 karakter'),
	readingRefs: z.array(z.string()).optional().default([]),
	slideRefs: z.array(z.string()).optional().default([]),
	subtitleRefs: z.array(z.string()).optional().default([]),
	attachmentRefs: z.array(z.string()).optional().default([]),
	internalNote: z.string().nullable().optional()
});

export const createGrantSchema = z.object({
	userId: z.string().uuid('ID pengguna harus berupa format UUID yang valid'),
	scopeId: z.string().min(1, 'scopeId wajib diisi').max(50),
	state: z.enum(['active', 'revoked']).optional().default('active'),
	startsAt: z.string().datetime().optional(),
	expiresAt: z.string().datetime().optional(),
	source: z.string().max(50).optional().default('manual'),
	auditId: z.string().max(100).optional()
});
