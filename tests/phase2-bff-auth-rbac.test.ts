import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAdminAcademyAuth } from '../src/lib/server/academyAuth.ts';
import {
	createScopeSchema,
	updateScopeSchema,
	createContentSchema,
	updateContentSchema,
	contentTransitionSchema,
	setLessonMediaSchema,
	createGrantSchema
} from '../src/lib/server/academyValidation.ts';

test('requireAdminAcademyAuth rejects unauthenticated requests with 401', async () => {
	const guestLocals: App.Locals = {};
	const result = requireAdminAcademyAuth(guestLocals);
	assert.strictEqual(result.ok, false);
	if (!result.ok) {
		assert.strictEqual(result.response.status, 401);
		const body = await result.response.json();
		assert.strictEqual(body.error, 'UNAUTHORIZED');
	}
});

test('requireAdminAcademyAuth rejects non-admin roles with 403', async () => {
	const nonAdminRoles = ['member', 'posts_manager', 'cryptoassets_manager', 'unknown_role'];

	for (const role of nonAdminRoles) {
		const locals: App.Locals = {
			accessToken: 'dummy-token',
			user: {
				id: 'u-1',
				name: 'Non Admin User',
				email: 'user@cryptosharia.id',
				role,
				permissions: [],
				accessToken: 'dummy-token'
			}
		};

		const result = requireAdminAcademyAuth(locals);
		assert.strictEqual(result.ok, false, `Role ${role} should be rejected`);
		if (!result.ok) {
			assert.strictEqual(result.response.status, 403);
			const body = await result.response.json();
			assert.strictEqual(body.error, 'FORBIDDEN');
		}
	}
});

test('requireAdminAcademyAuth authorizes admin and super_admin', () => {
	const adminRoles = ['admin', 'super_admin'];

	for (const role of adminRoles) {
		const locals: App.Locals = {
			accessToken: 'valid-admin-token',
			user: {
				id: 'u-admin',
				name: 'Admin User',
				email: 'admin@cryptosharia.id',
				role,
				permissions: ['academy.manage'],
				accessToken: 'valid-admin-token'
			}
		};

		const result = requireAdminAcademyAuth(locals);
		assert.strictEqual(result.ok, true, `Role ${role} should be authorized`);
		if (result.ok) {
			assert.strictEqual(result.accessToken, 'valid-admin-token');
			assert.strictEqual(result.user.role, role);
		}
	}
});

test('createScopeSchema validates slug format and length', () => {
	const valid = createScopeSchema.safeParse({
		id: 'crypto-pro',
		name: 'Pro Level Access',
		description: 'Access to pro courses',
		isActive: true
	});
	assert.strictEqual(valid.success, true);

	const invalidSlug = createScopeSchema.safeParse({
		id: 'Crypto_PRO!',
		name: 'Pro Level Access'
	});
	assert.strictEqual(invalidSlug.success, false);

	const tooShortId = createScopeSchema.safeParse({
		id: 'c',
		name: 'Pro Level Access'
	});
	assert.strictEqual(tooShortId.success, false);
});

test('createContentSchema validates hierarchy, kind, and subjectId constraints', () => {
	const valid = createContentSchema.safeParse({
		id: 'lesson-intro-bitcoin',
		kind: 'lesson',
		parentId: 'chap-1',
		subjectId: 'fundamental',
		level: 1,
		chapterNumber: 1,
		order: 1,
		title: 'Pengantar Bitcoin & Blockchain',
		description: 'Materi dasar Bitcoin',
		syariahRequired: true
	});
	assert.strictEqual(valid.success, true);

	const invalidKind = createContentSchema.safeParse({
		id: 'lesson-intro',
		kind: 'invalid_kind',
		parentId: 'chap-1',
		subjectId: 'fundamental',
		order: 1,
		title: 'Invalid'
	});
	assert.strictEqual(invalidKind.success, false);

	const invalidSubject = createContentSchema.safeParse({
		id: 'lesson-intro',
		kind: 'lesson',
		parentId: 'chap-1',
		subjectId: 'forex_trading', // Not an approved CryptoSharia subject
		order: 1,
		title: 'Invalid Subject'
	});
	assert.strictEqual(invalidSubject.success, false);
});

test('contentTransitionSchema strictly validates target status lifecycle', () => {
	const validStatuses = ['draft', 'review', 'approved', 'published', 'archived'] as const;
	for (const status of validStatuses) {
		const res = contentTransitionSchema.safeParse({
			targetStatus: status,
			rightsConfirmed: true
		});
		assert.strictEqual(res.success, true, `Status ${status} should be valid`);
	}

	const invalid = contentTransitionSchema.safeParse({
		targetStatus: 'deleted'
	});
	assert.strictEqual(invalid.success, false);
});

test('setLessonMediaSchema enforces exact 11-char YouTube ID', () => {
	const valid = setLessonMediaSchema.safeParse({
		videoId: 'dQw4w9WgXcQ',
		readingRefs: ['https://cryptosharia.id/article/btc'],
		slideRefs: [],
		subtitleRefs: [],
		attachmentRefs: []
	});
	assert.strictEqual(valid.success, true);

	const tooShort = setLessonMediaSchema.safeParse({
		videoId: 'short_id'
	});
	assert.strictEqual(tooShort.success, false);

	const tooLong = setLessonMediaSchema.safeParse({
		videoId: 'dQw4w9WgXcQ_extra'
	});
	assert.strictEqual(tooLong.success, false);
});

test('createGrantSchema enforces UUID for userId and non-empty scopeId', () => {
	const valid = createGrantSchema.safeParse({
		userId: '123e4567-e89b-12d3-a456-426614174000',
		scopeId: 'crypto-pro',
		state: 'active'
	});
	assert.strictEqual(valid.success, true);

	const invalidUser = createGrantSchema.safeParse({
		userId: 'not-a-uuid',
		scopeId: 'crypto-pro'
	});
	assert.strictEqual(invalidUser.success, false);

	const emptyScope = createGrantSchema.safeParse({
		userId: '123e4567-e89b-12d3-a456-426614174000',
		scopeId: ''
	});
	assert.strictEqual(emptyScope.success, false);
});
