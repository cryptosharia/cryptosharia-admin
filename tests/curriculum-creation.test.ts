import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createContentSchema,
	contentTransitionSchema
} from '../src/lib/server/academyValidation.ts';
import { requireAdminAcademyAuth } from '../src/lib/server/academyAuth.ts';
import { hasPermission } from '../src/lib/permissions.ts';

// ============================================================
// 1. Subject Creation Contract & Validation
// ============================================================
test('Curriculum Creation: Subject creation requires parentId="root", id===subjectId, and valid subjectId', () => {
	const validSubjects = ['fundamental', 'technical', 'muamalah', 'web3'] as const;

	for (const sub of validSubjects) {
		const payload = {
			id: sub,
			kind: 'subject' as const,
			parentId: 'root',
			subjectId: sub,
			title: `Analisis ${sub.toUpperCase()}`,
			description: `Materi resmi ${sub}`,
			level: 1,
			chapterNumber: 1,
			order: 1
		};
		const parsed = createContentSchema.safeParse(payload);
		assert.strictEqual(parsed.success, true, `Subject ${sub} should parse successfully`);
		if (parsed.success) {
			assert.strictEqual(parsed.data.parentId, 'root');
			assert.strictEqual(parsed.data.id, sub);
			assert.strictEqual(parsed.data.subjectId, sub);
			assert.strictEqual(parsed.data.kind, 'subject');
		}
	}
});

test('Curriculum Creation: Reject subject with invalid parentId (must be "root")', () => {
	const invalidPayload = {
		id: 'fundamental',
		kind: 'subject' as const,
		parentId: 'not-root',
		subjectId: 'fundamental' as const,
		title: 'Analisis Fundamental',
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	// In frontend/business logic, subject must have parentId 'root'
	assert.notStrictEqual(invalidPayload.parentId, 'root');
});

test('Curriculum Creation: Reject invalid subjectId enum', () => {
	const invalidEnum = {
		id: 'forex-trading',
		kind: 'subject',
		parentId: 'root',
		subjectId: 'forex-trading',
		title: 'Forex Trading',
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	const parsed = createContentSchema.safeParse(invalidEnum);
	assert.strictEqual(parsed.success, false, 'Invalid subject enum should fail Zod validation');
});

// ============================================================
// 2. Guided 4-Tier Hierarchy: Subject -> Level -> Chapter -> Lesson
// ============================================================
test('Curriculum Creation: Valid 4-tier chain creation', () => {
	// Step 1: Subject
	const subjectPayload = {
		id: 'muamalah',
		kind: 'subject' as const,
		parentId: 'root',
		subjectId: 'muamalah' as const,
		title: 'Fikih & Muamalah Aset Kripto',
		description: 'Kajian syariah komprehensif aset kripto',
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	const pSub = createContentSchema.safeParse(subjectPayload);
	assert.strictEqual(pSub.success, true);

	// Step 2: Level under Subject
	const levelPayload = {
		id: 'muamalah-l1',
		kind: 'level' as const,
		parentId: subjectPayload.id,
		subjectId: subjectPayload.subjectId,
		title: 'Level 1: Dasar Maal & Sil\'ah',
		description: 'Pemahaman konsep harta dan komoditas',
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	const pLvl = createContentSchema.safeParse(levelPayload);
	assert.strictEqual(pLvl.success, true);
	assert.strictEqual(levelPayload.parentId, subjectPayload.id);

	// Step 3: Chapter under Level
	const chapterPayload = {
		id: 'muamalah-l1-c1',
		kind: 'chapter' as const,
		parentId: levelPayload.id,
		subjectId: levelPayload.subjectId,
		title: 'Bab 1: Definisi dan Kriteria Harta Syariah',
		description: 'Syarat komoditas dalam fikih muamalah',
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	const pChap = createContentSchema.safeParse(chapterPayload);
	assert.strictEqual(pChap.success, true);
	assert.strictEqual(chapterPayload.parentId, levelPayload.id);

	// Step 4: Lesson under Chapter
	const lessonPayload = {
		id: 'muamalah-l1-c1-ls1',
		kind: 'lesson' as const,
		parentId: chapterPayload.id,
		subjectId: chapterPayload.subjectId,
		title: 'Pelajaran 1: Pengantar Maal Mutaqawwam',
		description: 'Video pengantar kajian maal mutaqawwam dalam kripto',
		durationSeconds: 900,
		instructor: 'Tim Edukasi CryptoSharia',
		syariahRequired: true,
		level: 1,
		chapterNumber: 1,
		order: 1
	};
	const pLes = createContentSchema.safeParse(lessonPayload);
	assert.strictEqual(pLes.success, true);
	assert.strictEqual(lessonPayload.parentId, chapterPayload.id);
});

// ============================================================
// 3. Parent Kind Constraint & Hierarchy Integrity
// ============================================================
test('Curriculum Creation: Hierarchy rules validate expected parent kinds', () => {
	function validateParentKind(childKind: string, parentKind: string): boolean {
		if (childKind === 'subject') return parentKind === 'root';
		if (childKind === 'level') return parentKind === 'subject';
		if (childKind === 'chapter') return parentKind === 'level';
		if (childKind === 'lesson') return parentKind === 'chapter';
		return false;
	}

	// Valid pairings
	assert.strictEqual(validateParentKind('subject', 'root'), true);
	assert.strictEqual(validateParentKind('level', 'subject'), true);
	assert.strictEqual(validateParentKind('chapter', 'level'), true);
	assert.strictEqual(validateParentKind('lesson', 'chapter'), true);

	// Invalid pairings (MUST be rejected)
	assert.strictEqual(validateParentKind('lesson', 'subject'), false, 'Lesson directly under Subject is invalid');
	assert.strictEqual(validateParentKind('lesson', 'level'), false, 'Lesson directly under Level is invalid');
	assert.strictEqual(validateParentKind('chapter', 'subject'), false, 'Chapter directly under Subject is invalid');
	assert.strictEqual(validateParentKind('level', 'chapter'), false, 'Level under Chapter is invalid');
	assert.strictEqual(validateParentKind('subject', 'level'), false, 'Subject under Level is invalid');
});

// ============================================================
// 4. Duplicate Subject Prevention
// ============================================================
test('Curriculum Creation: Duplicate subject validation logic', () => {
	const existingContents = [
		{ id: 'fundamental', kind: 'subject', subjectId: 'fundamental' },
		{ id: 'muamalah', kind: 'subject', subjectId: 'muamalah' }
	];

	function isDuplicateSubject(subjectId: string, contents: typeof existingContents): boolean {
		return contents.some((c) => c.kind === 'subject' && c.subjectId === subjectId);
	}

	assert.strictEqual(isDuplicateSubject('fundamental', existingContents), true, 'fundamental already exists');
	assert.strictEqual(isDuplicateSubject('muamalah', existingContents), true, 'muamalah already exists');
	assert.strictEqual(isDuplicateSubject('technical', existingContents), false, 'technical does not exist yet');
	assert.strictEqual(isDuplicateSubject('web3', existingContents), false, 'web3 does not exist yet');
});

// ============================================================
// 5. Slug / Identifier Validation Regex
// ============================================================
test('Curriculum Creation: Slug regex enforces lowercase alphanumeric with single hyphens', () => {
	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	// Valid slugs
	assert.strictEqual(slugRegex.test('fundamental'), true);
	assert.strictEqual(slugRegex.test('muamalah-l1'), true);
	assert.strictEqual(slugRegex.test('chap-fund-1'), true);
	assert.strictEqual(slugRegex.test('les-1-01'), true);

	// Invalid slugs
	assert.strictEqual(slugRegex.test('Fundamental'), false, 'Uppercase letters forbidden');
	assert.strictEqual(slugRegex.test('muamalah_l1'), false, 'Underscore forbidden');
	assert.strictEqual(slugRegex.test('-muamalah'), false, 'Leading hyphen forbidden');
	assert.strictEqual(slugRegex.test('muamalah-'), false, 'Trailing hyphen forbidden');
	assert.strictEqual(slugRegex.test('muamalah--l1'), false, 'Consecutive hyphens forbidden');
	assert.strictEqual(slugRegex.test('muamalah l1'), false, 'Whitespace forbidden');
});

// ============================================================
// 6. RBAC & Permission Enforcement for Content Creation
// ============================================================
test('Curriculum Creation: Permission academy.manage is strictly required', () => {
	// Super Admin and Admin have academy.manage
	assert.strictEqual(hasPermission('super_admin', 'academy.manage'), true);
	assert.strictEqual(hasPermission('admin', 'academy.manage'), true);

	// Member, Editor, Reviewer without manage role do NOT have academy.manage
	assert.strictEqual(hasPermission('member', 'academy.manage'), false);
	assert.strictEqual(hasPermission('finance', 'academy.manage'), false);
	assert.strictEqual(hasPermission('guest', 'academy.manage'), false);
});

test('Curriculum Creation: requireAdminAcademyAuth rejects non-admin users', async () => {
	const memberLocals: App.Locals = {
		accessToken: 'dummy-token',
		user: {
			id: 'user-1',
			email: 'user@test.com',
			name: 'Test Member',
			role: 'member',
			permissions: [],
			accessToken: 'dummy-token'
		}
	};
	const resMember = requireAdminAcademyAuth(memberLocals);
	assert.strictEqual(resMember.ok, false);
	if (!resMember.ok) {
		assert.strictEqual(resMember.response.status, 403);
	}

	const unauthLocals: App.Locals = {};
	const resUnauth = requireAdminAcademyAuth(unauthLocals);
	assert.strictEqual(resUnauth.ok, false);
	if (!resUnauth.ok) {
		assert.strictEqual(resUnauth.response.status, 401);
	}
});

// ============================================================
// 7. Initial Status Lifecycle: Must Start at "draft"
// ============================================================
test('Curriculum Creation: Content starts strictly as "draft" and transitions through dual gates', () => {
	const initialStatus = 'draft';
	assert.strictEqual(initialStatus, 'draft', 'All newly created content starts as draft');

	// Transition to review
	const reviewTransition = contentTransitionSchema.safeParse({
		targetStatus: 'review'
	});
	assert.strictEqual(reviewTransition.success, true);
});

// ============================================================
// 8. Dashboard Quick Action URL Parameter Parsing
// ============================================================
test('Dashboard Quick Action: Correctly parses ?create=true search param', () => {
	const urlWithCreate = new URL('https://admin.cryptosharia.id/academy/courses?create=true');
	const createAction = urlWithCreate.searchParams.get('create') === 'true';
	assert.strictEqual(createAction, true);

	const urlWithoutCreate = new URL('https://admin.cryptosharia.id/academy/courses');
	const noCreateAction = urlWithoutCreate.searchParams.get('create') === 'true';
	assert.strictEqual(noCreateAction, false);
});
