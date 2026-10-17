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
import type {
	AdminStatsDto,
	ScopeDto,
	AdminContentDto,
	AdminGrantDto,
	MediaDto
} from '../src/lib/academyDtos.ts';

test('BFF Contract: AdminStatsDto contract adheres to backend schema', () => {
	const sampleStats: AdminStatsDto = {
		totalLessons: 42,
		publishedLessons: 35,
		draftContent: 4,
		reviewContent: 3,
		totalScopes: 4,
		totalGrants: 120
	};

	assert.strictEqual(typeof sampleStats.totalLessons, 'number');
	assert.strictEqual(typeof sampleStats.publishedLessons, 'number');
	assert.strictEqual(typeof sampleStats.draftContent, 'number');
	assert.strictEqual(typeof sampleStats.reviewContent, 'number');
	assert.strictEqual(typeof sampleStats.totalScopes, 'number');
	assert.strictEqual(typeof sampleStats.totalGrants, 'number');
});

test('BFF Contract: ScopeDto and Create/Update payload validation', () => {
	const validCreate = {
		id: 'vip-investor',
		name: 'VIP Investor Access',
		description: 'Exclusive access to advanced institutional modules',
		isActive: true
	};

	const parsed = createScopeSchema.safeParse(validCreate);
	assert.strictEqual(parsed.success, true);
	if (parsed.success) {
		assert.strictEqual(parsed.data.id, 'vip-investor');
		assert.strictEqual(parsed.data.name, 'VIP Investor Access');
		assert.strictEqual(parsed.data.isActive, true);
	}

	// Update payload
	const validUpdate = {
		name: 'VIP Investor Tier 1',
		isActive: false
	};
	const parsedUpdate = updateScopeSchema.safeParse(validUpdate);
	assert.strictEqual(parsedUpdate.success, true);
});

test('BFF Contract: Content hierarchy and validation rules', () => {
	const lessonPayload = {
		id: 'lesson-akad-murabahah',
		kind: 'lesson' as const,
		parentId: 'chap-muamalah-1',
		subjectId: 'muamalah' as const,
		level: 2,
		chapterNumber: 3,
		order: 1,
		scopeId: 'pro-member',
		title: 'Penerapan Akad Murabahah dalam DeFi',
		description: 'Kajian komprehensif struktur murabahah pada decentralized finance',
		thumbnail: '/images/lessons/murabahah.jpg',
		durationSeconds: 1800,
		instructor: 'Ustadz Dr. Sharia Finance',
		syariahRequired: true
	};

	const parsed = createContentSchema.safeParse(lessonPayload);
	assert.strictEqual(parsed.success, true);

	// Invalid level (> 6)
	const invalidLevel = createContentSchema.safeParse({
		...lessonPayload,
		level: 7
	});
	assert.strictEqual(invalidLevel.success, false);

	// Invalid chapterNumber (> 7)
	const invalidChapter = createContentSchema.safeParse({
		...lessonPayload,
		chapterNumber: 8
	});
	assert.strictEqual(invalidChapter.success, false);
});

test('BFF Contract: Editorial status transition validation', () => {
	// Transition to review
	const toReview = contentTransitionSchema.safeParse({
		targetStatus: 'review'
	});
	assert.strictEqual(toReview.success, true);
	if (toReview.success) {
		assert.strictEqual(toReview.data.rightsConfirmed, false);
	}

	// Transition to publish with rights confirmed
	const toPublish = contentTransitionSchema.safeParse({
		targetStatus: 'published',
		rightsConfirmed: true
	});
	assert.strictEqual(toPublish.success, true);
	if (toPublish.success) {
		assert.strictEqual(toPublish.data.rightsConfirmed, true);
	}
});

test('BFF Contract: Media payload strict validation', () => {
	const mediaPayload = {
		videoId: 'b943hkd019a', // exactly 11 characters
		readingRefs: ['https://journal.cryptosharia.id/article-01.pdf'],
		slideRefs: ['https://slides.cryptosharia.id/deck-01.pdf'],
		subtitleRefs: ['https://subs.cryptosharia.id/id.vtt'],
		attachmentRefs: ['https://files.cryptosharia.id/sample.xlsx'],
		internalNote: 'Telah diverifikasi oleh tim syariah'
	};

	const parsed = setLessonMediaSchema.safeParse(mediaPayload);
	assert.strictEqual(parsed.success, true);
	if (parsed.success) {
		assert.strictEqual(parsed.data.videoId, 'b943hkd019a');
		assert.strictEqual(parsed.data.readingRefs.length, 1);
		assert.strictEqual(parsed.data.internalNote, 'Telah diverifikasi oleh tim syariah');
	}
});

test('BFF Contract: Grant entitlement creation validation', () => {
	const grantPayload = {
		userId: 'a0000000-0000-4000-8000-000000000001',
		scopeId: 'crypto-pro',
		state: 'active' as const,
		startsAt: '2026-10-17T00:00:00.000Z',
		expiresAt: '2027-10-17T00:00:00.000Z',
		source: 'manual',
		auditId: 'audit-grant-001'
	};

	const parsed = createGrantSchema.safeParse(grantPayload);
	assert.strictEqual(parsed.success, true);
	if (parsed.success) {
		assert.strictEqual(parsed.data.userId, 'a0000000-0000-4000-8000-000000000001');
		assert.strictEqual(parsed.data.scopeId, 'crypto-pro');
	}
});

test('BFF Authorization Matrix: Granular verification across all roles', () => {
	const roles = [
		{ role: 'super_admin', expected: true },
		{ role: 'admin', expected: true },
		{ role: 'posts_manager', expected: false },
		{ role: 'cryptoassets_manager', expected: false },
		{ role: 'member', expected: false }
	];

	for (const { role, expected } of roles) {
		const locals: App.Locals = {
			accessToken: 'token-' + role,
			user: {
				id: 'u-' + role,
				name: 'User ' + role,
				email: `${role}@cryptosharia.id`,
				role,
				permissions: [],
				accessToken: 'token-' + role
			}
		};

		const auth = requireAdminAcademyAuth(locals);
		assert.strictEqual(
			auth.ok,
			expected,
			`Role ${role} authorization must be ${expected ? 'ALLOWED' : 'DENIED'}`
		);
	}
});
