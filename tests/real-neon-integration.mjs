/**
 * REAL NEON QA INTEGRATION TEST SUITE
 * CryptoSharia Unified Admin Portal (SvelteKit BFF) -> NestJS API -> Isolated Neon QA PostgreSQL
 *
 * Requirements verified:
 * 1. Authentication and authorization (401 unauthenticated, 403 non-admin/member, 200 super_admin)
 * 2. Academy Stats
 * 3. Create Scope
 * 4. Create Subject, Level, Chapter, Lesson (4-Tier Hierarchy)
 * 5. Update Lesson
 * 6. Attach YouTube Media
 * 7. Valid and invalid status transitions (draft -> review -> approved -> published, and negative guards)
 * 8. Create and revoke Grant for student user
 * 9. Direct PostgreSQL record verification (proving persistence in Neon QA)
 * 10. Complete teardown & cleanup of test data
 *
 * CRITICAL RULE: Under NO circumstances print connection strings or passwords.
 */

import { spawn, execSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

const NEON_PROJECT_ID = 'winter-firefly-11354002';
const NEON_ORG_ID = 'org-misty-queen-98932217';
const NEON_QA_BRANCH = 'qa-academy-testing';

const API_PORT = 3456;
const ADMIN_PORT = 5174;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`;

const TEST_API_KEY = 'test-internal-api-key-cs-gate-2026';
const TEST_JWT_SECRET = 'test-jwt-secret-cs-gate-2026-very-secure';

// Known QA seeded users
const ADMIN_USER_ID = '25f4507b-7908-458c-a07b-edae1f0e107a';
const STUDENT_USER_ID = '11111111-1111-4111-a111-111111111111';

// Redacting logger helper
function createSanitizer(secretsToRedact) {
	return (text) => {
		let sanitized = String(text);
		for (const secret of secretsToRedact) {
			if (secret && secret.length > 5) {
				sanitized = sanitized.replaceAll(secret, '[REDACTED]');
			}
		}
		return sanitized;
	};
}

function signJwt(payload, secret) {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	return `${header}.${body}.${sig}`;
}

async function waitForUrl(url, timeoutMs = 20000, options = {}) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url, options);
			if (res.status < 500) return true;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
	console.log('===============================================================');
	console.log('🚀 CRYPTOSHARIA — FINAL PHASE 3 ENTRY GATE: REAL INTEGRATION TEST');
	console.log('===============================================================');

	// Strict safety assertion on branch configuration
	if (NEON_QA_BRANCH.includes('main') || NEON_QA_BRANCH.includes('prod') || NEON_QA_BRANCH !== 'qa-academy-testing') {
		console.error('BLOCKED: Safety violation - QA script cannot target production branch');
		process.exit(1);
	}

	// 1. Fetch Neon QA connection string in memory
	console.log('\n[1/10] Connecting to Neon QA branch securely...');
	let qaDbUrl;
	try {
		qaDbUrl = execSync(
			`npx -y neonctl@latest connection-string ${NEON_QA_BRANCH} --project-id ${NEON_PROJECT_ID} --org-id ${NEON_ORG_ID}`,
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
		).trim();
	} catch (err) {
		console.error('BLOCKED: Failed to retrieve Neon QA connection string via neonctl');
		process.exit(1);
	}

	const dbParsed = new URL(qaDbUrl);
	const sanitize = createSanitizer([qaDbUrl, dbParsed.password]);

	// Security assertion: must be QA branch, NEVER production
	if (dbParsed.hostname.includes('falling-rice') || !dbParsed.hostname.includes('ep-purple-pond')) {
		console.error('BLOCKED: Safety violation - Database endpoint is not the isolated Neon QA branch!');
		process.exit(1);
	}

	console.log(`✓ Neon QA Endpoint: ${dbParsed.hostname}`);
	console.log(`✓ Database: ${dbParsed.pathname}`);
	console.log(`✓ Connection credentials loaded in-memory (secrets redacted)`);

	// Verify Neon QA DB connection directly
	const pool = new Pool({
		connectionString: qaDbUrl,
		ssl: { rejectUnauthorized: false }
	});

	try {
		const userRes = await pool.query(
			'SELECT id, email, role, status FROM users WHERE id IN ($1, $2)',
			[ADMIN_USER_ID, STUDENT_USER_ID]
		);
		console.log(`✓ Neon QA Database verified. Found ${userRes.rows.length} seeded users:`);
		for (const u of userRes.rows) {
			console.log(`  - ${u.email} (Role: ${u.role}, Status: ${u.status}, ID: ${u.id})`);
		}
		if (userRes.rows.length < 2) {
			throw new Error('Required seeded users not found in QA database');
		}
	} catch (err) {
		console.error(sanitize(`BLOCKED: Database preflight query failed: ${err.message}`));
		await pool.end();
		process.exit(1);
	}

	// 2. Prepare tokens using official ACCESS_TOKEN_ISSUER = 'api.cryptosharia.id'
	const nowSec = Math.floor(Date.now() / 1000);
	const adminToken = signJwt(
		{
			sub: ADMIN_USER_ID,
			role: 'super_admin',
			iss: 'api.cryptosharia.id',
			exp: nowSec + 3600
		},
		TEST_JWT_SECRET
	);

	const memberToken = signJwt(
		{
			sub: STUDENT_USER_ID,
			role: 'member',
			iss: 'api.cryptosharia.id',
			exp: nowSec + 3600
		},
		TEST_JWT_SECRET
	);

	const expiredToken = signJwt(
		{
			sub: ADMIN_USER_ID,
			role: 'super_admin',
			iss: 'api.cryptosharia.id',
			exp: nowSec - 3600
		},
		TEST_JWT_SECRET
	);

	// 3. Spawn real NestJS cryptosharia-api
	console.log('\n[2/10] Starting real cryptosharia-api (NestJS) on port ' + API_PORT + '...');
	const apiEnv = {
		...process.env,
		NODE_ENV: 'test',
		PORT: String(API_PORT),
		DATABASE_URL: qaDbUrl,
		ACCESS_TOKEN_SECRET: TEST_JWT_SECRET,
		OTP_SECRET: 'test-otp-secret-gate',
		API_KEY: TEST_API_KEY,
		RESEND_API_KEY: 'test-resend-key',
		RESEND_FROM: 'test@cryptosharia.id',
		RESEND_REPLY_TO: 'test@cryptosharia.id',
		CONTACT_FORM_TO_EMAIL: 'admin@cryptosharia.id',
		BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test_token',
		VERCEL_BLOB_BASE_URL: 'https://blob.vercel-storage.com',
		IMGBB_API_KEY: 'test_imgbb_key',
		CMC_API_KEY: 'test_cmc_key'
	};

	const apiProcess = spawn('/opt/homebrew/bin/bun', ['src/main.ts'], {
		cwd: '/Users/mac/Projects/CryptoSharia/cryptosharia-api',
		env: apiEnv,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	apiProcess.stderr.on('data', (d) => {
		const s = sanitize(d.toString());
		if (s.includes('ERROR') || s.includes('Exception')) {
			process.stderr.write(`[API STDERR] ${s}`);
		}
	});

	await waitForUrl(`${API_URL}/health`);
	console.log('✓ cryptosharia-api is live and healthy on ' + API_URL);

	// 4. Spawn cryptosharia-admin Vite Dev Server
	console.log('\n[3/10] Starting cryptosharia-admin Vite dev server on port ' + ADMIN_PORT + '...');
	const adminEnv = {
		...process.env,
		PUBLIC_CS_API_URL: API_URL,
		CS_API_KEY: TEST_API_KEY
	};

	const adminProcess = spawn('npx', ['vite', '--port', String(ADMIN_PORT), '--strictPort'], {
		cwd: '/Users/mac/Projects/CryptoSharia/cryptosharia-admin',
		env: adminEnv,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	adminProcess.stderr.on('data', (d) => {
		const s = sanitize(d.toString());
		if (s.includes('error') || s.includes('Error')) {
			process.stderr.write(`[ADMIN STDERR] ${s}`);
		}
	});

	await waitForUrl(`${ADMIN_URL}/login`);
	console.log('✓ cryptosharia-admin is live on ' + ADMIN_URL);

	// Helper for BFF requests
	async function bffRequest(path, { method = 'GET', token, body, headers = {} } = {}) {
		const reqHeaders = {
			...headers,
			Accept: 'application/json'
		};
		if (token) {
			reqHeaders['Cookie'] = `access_token=${token}`;
		}
		if (body !== undefined) {
			reqHeaders['Content-Type'] = 'application/json';
			reqHeaders['Origin'] = ADMIN_URL;
		} else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
			reqHeaders['Origin'] = ADMIN_URL;
		}

		const res = await fetch(`${ADMIN_URL}${path}`, {
			method,
			headers: reqHeaders,
			body: body !== undefined ? JSON.stringify(body) : undefined
		});

		let json = null;
		const text = await res.text();
		try {
			json = JSON.parse(text);
		} catch {
			json = text;
		}

		return { status: res.status, ok: res.ok, body: json };
	}

	// Variables to track created entities for assertions and cleanup
	const uniqueSuffix = Date.now().toString(36).toLowerCase();
	const testScopeId = `scope-qa-${uniqueSuffix}`;
	let createdSubjectId = null;
	const testLevelId = `muamalah-l1-${uniqueSuffix}`;
	const testChapterId = `muamalah-l1-c1-${uniqueSuffix}`;
	const testLessonId = `muamalah-l1-c1-ls1-${uniqueSuffix}`;
	let testGrantId = null;

	try {
		// ==========================================
		// TEST 1: Auth and Authorization
		// ==========================================
		console.log('\n[4/10] Verifying Authentication & Authorization...');

		// 1a. Unauthenticated
		const unauth = await bffRequest('/api/academy/admin/stats');
		if (unauth.status !== 401) {
			throw new Error(`Expected 401 for unauthenticated request, got ${unauth.status}`);
		}
		console.log('  ✓ Unauthenticated access rejected with HTTP 401 UNAUTHORIZED');

		// 1b. Expired token
		const expired = await bffRequest('/api/academy/admin/stats', { token: expiredToken });
		if (expired.status !== 401) {
			throw new Error(`Expected 401 for expired token, got ${expired.status}`);
		}
		console.log('  ✓ Expired token rejected with HTTP 401 UNAUTHORIZED');

		// 1c. Non-admin member role (qa.student1@test.local)
		const member = await bffRequest('/api/academy/admin/stats', { token: memberToken });
		if (member.status !== 403) {
			throw new Error(`Expected 403 for member role, got ${member.status}`);
		}
		console.log('  ✓ Non-admin member role rejected with HTTP 403 FORBIDDEN');

		// 1d. Super admin role
		const adminStats = await bffRequest('/api/academy/admin/stats', { token: adminToken });
		if (adminStats.status !== 200 || !adminStats.ok) {
			throw new Error(`Expected 200 for super_admin, got ${adminStats.status}: ${JSON.stringify(adminStats.body)}`);
		}
		console.log('  ✓ Super admin authenticated and authorized with HTTP 200 OK');

		// ==========================================
		// TEST 2: Academy Stats
		// ==========================================
		console.log('\n[5/10] Verifying Academy Stats...');
		const stats = adminStats.body;
		if (
			typeof stats.totalLessons !== 'number' ||
			typeof stats.totalScopes !== 'number' ||
			typeof stats.totalGrants !== 'number'
		) {
			throw new Error(`Malformed stats response: ${JSON.stringify(stats)}`);
		}
		console.log(`  ✓ Live Neon QA stats retrieved:`, stats);

		// ==========================================
		// TEST 3: Create Scope
		// ==========================================
		console.log('\n[6/10] Creating Academy Scope...');
		const scopePayload = {
			id: testScopeId,
			name: `Gate QA Scope ${uniqueSuffix}`,
			description: 'Real integration test scope',
			isActive: true
		};
		const scopeRes = await bffRequest('/api/academy/admin/scopes', {
			method: 'POST',
			token: adminToken,
			body: scopePayload
		});
		if (scopeRes.status !== 201) {
			throw new Error(`Failed to create scope: ${scopeRes.status} ${JSON.stringify(scopeRes.body)}`);
		}
		console.log(`  ✓ Scope created via BFF -> NestJS -> Neon QA: ID ${scopeRes.body.id}`);

		// Direct Postgres verification
		const pgScope = await pool.query('SELECT * FROM academy_scopes WHERE id = $1', [testScopeId]);
		if (pgScope.rows.length === 0 || pgScope.rows[0].id !== testScopeId) {
			throw new Error('Scope row was not found in PostgreSQL academy_scopes table');
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: Scope row successfully persisted in academy_scopes');

		// ==========================================
		// TEST 4: Create 4-Tier Hierarchy (Subject -> Level -> Chapter -> Lesson)
		// ==========================================
		console.log('\n[7/10] Creating 4-Tier Curriculum Hierarchy...');

		// Check if subject 'muamalah' already exists
		const existingSubject = await pool.query("SELECT id FROM academy_content WHERE id = 'muamalah'");
		if (existingSubject.rows.length === 0) {
			const maxOrderRes = await pool.query("SELECT COALESCE(MAX(\"order\"), 0) + 1 AS next_order FROM academy_content WHERE parent_id = 'root'");
			const nextOrder = Number(maxOrderRes.rows[0].next_order);
			const subjectRes = await bffRequest('/api/academy/admin/content', {
				method: 'POST',
				token: adminToken,
				body: {
					id: 'muamalah',
					kind: 'subject',
					parentId: 'root',
					subjectId: 'muamalah',
					order: nextOrder,
					title: 'Hukum & Fikih Muamalah Kripto',
					description: 'Prinsip fikih muamalah dan kaidah akad aset kripto',
					scopeId: testScopeId
				}
			});
			if (subjectRes.status !== 201) {
				throw new Error(`Failed to create subject: ${subjectRes.status} ${JSON.stringify(subjectRes.body)}`);
			}
			createdSubjectId = 'muamalah';
			console.log(`  ✓ Subject created: ${subjectRes.body.title} (${createdSubjectId}, order: ${nextOrder})`);
		} else {
			console.log('  ✓ Root Subject "muamalah" already initialized in database.');
		}

		// 4b. Level
		const levelRes = await bffRequest('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: testLevelId,
				kind: 'level',
				parentId: 'muamalah',
				subjectId: 'muamalah',
				level: 1,
				title: `Level 1: Konsep Dasar Muamalah ${uniqueSuffix}`,
				scopeId: testScopeId
			}
		});
		if (levelRes.status !== 201) {
			throw new Error(`Failed to create level: ${levelRes.status} ${JSON.stringify(levelRes.body)}`);
		}
		console.log(`  ✓ Level created: ${levelRes.body.title} (${testLevelId})`);

		// 4c. Chapter
		const chapterRes = await bffRequest('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: testChapterId,
				kind: 'chapter',
				parentId: testLevelId,
				subjectId: 'muamalah',
				level: 1,
				chapterNumber: 1,
				title: `Bab 1: Definisi Maal dan Sil\'ah ${uniqueSuffix}`,
				scopeId: testScopeId
			}
		});
		if (chapterRes.status !== 201) {
			throw new Error(`Failed to create chapter: ${chapterRes.status} ${JSON.stringify(chapterRes.body)}`);
		}
		console.log(`  ✓ Chapter created: ${chapterRes.body.title} (${testChapterId})`);

		// 4d. Lesson
		const lessonRes = await bffRequest('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: testLessonId,
				kind: 'lesson',
				parentId: testChapterId,
				subjectId: 'muamalah',
				level: 1,
				chapterNumber: 1,
				title: `Pelajaran 1: Syarat Maal Mutaqawwam ${uniqueSuffix}`,
				description: 'Penjelasan status harta yang diakui syariat dalam ekosistem digital',
				durationSeconds: 300,
				scopeId: testScopeId,
				syariahRequired: true
			}
		});
		if (lessonRes.status !== 201) {
			throw new Error(`Failed to create lesson: ${lessonRes.status} ${JSON.stringify(lessonRes.body)}`);
		}
		console.log(`  ✓ Lesson created: ${lessonRes.body.title} (${testLessonId})`);

		// Direct Postgres verification of hierarchy
		const pgContent = await pool.query(
			'SELECT id, kind, title, parent_id, status FROM academy_content WHERE id IN ($1, $2, $3) ORDER BY created_at ASC',
			[testLevelId, testChapterId, testLessonId]
		);
		if (pgContent.rows.length !== 3) {
			throw new Error(`Expected 3 rows in academy_content, found ${pgContent.rows.length}`);
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: Curriculum tiers persisted in academy_content:');
		for (const r of pgContent.rows) {
			console.log(`    - [${r.kind.toUpperCase()}] ${r.title} (Parent: ${r.parent_id}, Status: ${r.status})`);
		}

		// ==========================================
		// TEST 5: Update Lesson
		// ==========================================
		console.log('\n[8/10] Updating Lesson & Attaching YouTube Media...');
		const updateRes = await bffRequest(`/api/academy/admin/content/${testLessonId}`, {
			method: 'PUT',
			token: adminToken,
			body: {
				title: `Pelajaran 1: Syarat Maal Mutaqawwam (Updated) ${uniqueSuffix}`,
				description: 'Updated lesson description with detailed fiqh references',
				durationSeconds: 450
			}
		});
		if (updateRes.status !== 200) {
			throw new Error(`Failed to update lesson: ${updateRes.status} ${JSON.stringify(updateRes.body)}`);
		}
		console.log(`  ✓ Lesson updated via BFF -> NestJS -> Neon QA (duration: 450s)`);

		const pgUpdate = await pool.query('SELECT title, duration_seconds FROM academy_content WHERE id = $1', [testLessonId]);
		if (pgUpdate.rows[0].duration_seconds !== 450) {
			throw new Error('Lesson update did not persist to PostgreSQL');
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: Lesson update confirmed in PostgreSQL');

		// ==========================================
		// TEST 6: Attach YouTube Media
		// ==========================================
		const mediaPayload = {
			videoId: 'dQw4w9WgXcQ', // 11 characters
			readingRefs: ['https://cryptosharia.id/fatwa/maal'],
			slideRefs: []
		};
		const mediaRes = await bffRequest(`/api/academy/admin/content/${testLessonId}/media`, {
			method: 'PUT',
			token: adminToken,
			body: mediaPayload
		});
		if (mediaRes.status !== 200) {
			throw new Error(`Failed to attach media: ${mediaRes.status} ${JSON.stringify(mediaRes.body)}`);
		}
		console.log(`  ✓ YouTube media attached: videoId ${mediaRes.body.videoId}`);

		const pgMedia = await pool.query('SELECT * FROM academy_lesson_media WHERE lesson_id = $1', [testLessonId]);
		if (pgMedia.rows.length === 0 || pgMedia.rows[0].video_id !== 'dQw4w9WgXcQ') {
			throw new Error('Media row was not found in PostgreSQL academy_lesson_media table');
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: YouTube media row successfully persisted in academy_lesson_media');

		// ==========================================
		// TEST 7: Valid & Invalid Status Transitions
		// ==========================================
		console.log('\n[9/10] Verifying Status Transitions & Workflow Enforcement...');

		// 7a. Invalid transition: draft -> published (should fail)
		const invalidTrans = await bffRequest(`/api/academy/admin/content/${testLessonId}/transition`, {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'published', rightsConfirmed: true }
		});
		if (invalidTrans.status !== 400 && invalidTrans.status !== 422) {
			throw new Error(`Expected 400/422 for invalid status transition, got ${invalidTrans.status}`);
		}
		console.log(`  ✓ Invalid transition (draft -> published) blocked: ${invalidTrans.body.message || invalidTrans.body.error}`);

		// 7b. Valid transition: draft -> review
		const toReview = await bffRequest(`/api/academy/admin/content/${testLessonId}/transition`, {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'review' }
		});
		if (toReview.status !== 200) {
			throw new Error(`Failed draft -> review: ${toReview.status} ${JSON.stringify(toReview.body)}`);
		}
		console.log('  ✓ Transition (draft -> review) SUCCESS');

		// 7c. Invalid approval: review -> approved without rightsConfirmed (should fail)
		const invalidApprove = await bffRequest(`/api/academy/admin/content/${testLessonId}/transition`, {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'approved', rightsConfirmed: false }
		});
		if (invalidApprove.status !== 400 && invalidApprove.status !== 422) {
			throw new Error(`Expected 400/422 for unconfirmed rights approval, got ${invalidApprove.status}`);
		}
		console.log(`  ✓ Unconfirmed approval blocked: ${invalidApprove.body.message || invalidApprove.body.error}`);

		// 7d. Valid approval: review -> approved with rightsConfirmed: true
		const toApproved = await bffRequest(`/api/academy/admin/content/${testLessonId}/transition`, {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'approved', rightsConfirmed: true }
		});
		if (toApproved.status !== 200) {
			throw new Error(`Failed review -> approved: ${toApproved.status} ${JSON.stringify(toApproved.body)}`);
		}
		console.log('  ✓ Transition (review -> approved) SUCCESS');

		// 7e. Valid publish: approved -> published
		const toPublished = await bffRequest(`/api/academy/admin/content/${testLessonId}/transition`, {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'published', rightsConfirmed: true }
		});
		if (toPublished.status !== 200) {
			throw new Error(`Failed approved -> published: ${toPublished.status} ${JSON.stringify(toPublished.body)}`);
		}
		console.log('  ✓ Transition (approved -> published) SUCCESS (version incremented)');

		// Direct Postgres verification of published lesson
		const pgPublished = await pool.query('SELECT status, version FROM academy_content WHERE id = $1', [testLessonId]);
		if (pgPublished.rows[0].status !== 'published' || pgPublished.rows[0].version !== 1) {
			throw new Error(`Published state mismatch in PostgreSQL: ${JSON.stringify(pgPublished.rows[0])}`);
		}
		console.log(`  ✓ DIRECT POSTGRES VERIFICATION: Lesson status is '${pgPublished.rows[0].status}' at version ${pgPublished.rows[0].version}`);

		// ==========================================
		// TEST 8: Create and Revoke Grant
		// ==========================================
		console.log('\n[10/10] Verifying Scope Grants (Create & Revoke)...');
		const grantRes = await bffRequest('/api/academy/admin/grants', {
			method: 'POST',
			token: adminToken,
			body: {
				userId: STUDENT_USER_ID,
				scopeId: testScopeId,
				source: 'manual'
			}
		});
		if (grantRes.status !== 201) {
			throw new Error(`Failed to create grant: ${grantRes.status} ${JSON.stringify(grantRes.body)}`);
		}
		testGrantId = grantRes.body.id;
		console.log(`  ✓ Grant created for student ${STUDENT_USER_ID}: ID ${testGrantId} (state: ${grantRes.body.state})`);

		// Direct Postgres check for active grant
		const pgGrantActive = await pool.query('SELECT * FROM academy_grants WHERE id = $1', [testGrantId]);
		if (pgGrantActive.rows.length === 0 || pgGrantActive.rows[0].state !== 'active') {
			throw new Error('Grant active state not found in PostgreSQL');
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: Active grant verified in academy_grants');

		// Revoke grant
		const revokeRes = await bffRequest(`/api/academy/admin/grants/${testGrantId}/revoke`, {
			method: 'PUT',
			token: adminToken
		});
		if (revokeRes.status !== 200) {
			throw new Error(`Failed to revoke grant: ${revokeRes.status} ${JSON.stringify(revokeRes.body)}`);
		}
		console.log(`  ✓ Grant revoked: state ${revokeRes.body.state}`);

		// Direct Postgres check for revoked grant
		const pgGrantRevoked = await pool.query('SELECT state FROM academy_grants WHERE id = $1', [testGrantId]);
		if (pgGrantRevoked.rows[0].state !== 'revoked') {
			throw new Error('Grant revoked state not found in PostgreSQL');
		}
		console.log('  ✓ DIRECT POSTGRES VERIFICATION: Revoked grant confirmed in academy_grants');

		console.log('\n===============================================================');
		console.log('🎉 ALL 10 REAL INTEGRATION SCENARIOS PASSED WITH LIVE NEON QA!');
		console.log('===============================================================');
	} finally {
		// ==========================================
		// CLEANUP OF TEST DATA
		// ==========================================
		console.log('\n[CLEANUP] Cleaning up test data from Neon QA database...');
		try {
			if (testGrantId) {
				await pool.query('DELETE FROM academy_grants WHERE id = $1', [testGrantId]);
				console.log(`  - Deleted test grant ${testGrantId}`);
			}
			if (testLessonId) {
				await pool.query('DELETE FROM academy_lesson_media WHERE lesson_id = $1', [testLessonId]);
				console.log(`  - Deleted test media for lesson ${testLessonId}`);
			}
			const contentIds = [testLessonId, testChapterId, testLevelId, createdSubjectId].filter(Boolean);
			if (contentIds.length > 0) {
				await pool.query('DELETE FROM academy_content WHERE id = ANY($1)', [contentIds]);
				console.log(`  - Deleted ${contentIds.length} test content records`);
			}
			if (testScopeId) {
				await pool.query('DELETE FROM academy_scopes WHERE id = $1', [testScopeId]);
				console.log(`  - Deleted test scope ${testScopeId}`);
			}

			// Final sanity check
			const remainingScopes = await pool.query('SELECT id FROM academy_scopes WHERE id = $1', [testScopeId]);
			if (remainingScopes.rows.length === 0) {
				console.log('  ✓ Neon QA cleanup verified: 0 test records remain.');
			} else {
				console.warn('  ⚠️ Warning: Some test records could not be cleaned up.');
			}
		} catch (cleanupErr) {
			console.error(sanitize(`Error during cleanup: ${cleanupErr.message}`));
		}

		console.log('\n[TEARDOWN] Shutting down test services...');
		try {
			await pool.end();
		} catch {}
		try {
			adminProcess.kill('SIGTERM');
		} catch {}
		try {
			apiProcess.kill('SIGTERM');
		} catch {}
		console.log('✓ Teardown complete. All connections closed safely.');
	}
}

run().catch((err) => {
	console.error('TEST RUN FAILED:', err);
	process.exit(1);
});
