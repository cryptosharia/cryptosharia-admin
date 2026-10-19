/**
 * End-to-End Functional Validation Script (Phase 2)
 * Tests full flow against real NestJS API, real SvelteKit Admin, and isolated Neon QA database
 */

import { spawn, execSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const playwright = await import('/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const { chromium } = playwright;

const NEON_PROJECT_ID = 'winter-firefly-11354002';
const NEON_ORG_ID = 'org-misty-queen-98932217';
const NEON_QA_BRANCH = 'qa-academy-testing';
const PERMITTED_QA_HOST_FRAGMENT = 'ep-purple-pond';
const FORBIDDEN_PROD_HOST_FRAGMENT = 'falling-rice';

const API_PORT = 3456;
const ADMIN_PORT = 5174;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`;

const TEST_API_KEY = 'test-internal-api-key-cs-gate-2026';
const TEST_JWT_SECRET = 'test-jwt-secret-cs-gate-2026-very-secure';

const ARTIFACT_DIR = '/Users/mac/.gemini/antigravity-ide/brain/0a2e685b-b91e-455b-92e1-b760e9c51e7d/screenshots_real';
const DESKTOP_DIR = '/Users/mac/Desktop/cryptosharia-actual-ui/real';

mkdirSync(ARTIFACT_DIR, { recursive: true });
mkdirSync(DESKTOP_DIR, { recursive: true });

const ADMIN_USER_ID = '25f4507b-7908-458c-a07b-edae1f0e107a';
const MEMBER_USER_ID = '11111111-1111-4111-a111-111111111111';

function signJwt(payload, secret) {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	return `${header}.${body}.${sig}`;
}

const adminToken = signJwt(
	{
		sub: ADMIN_USER_ID,
		email: 'admin@cryptosharia.id',
		role: 'super_admin',
		iss: 'api.cryptosharia.id',
		permissions: [
			'users.view', 'users.manage', 'users.roles', 'posts.manage', 'posts.publish',
			'cryptoassets.manage', 'academy.view', 'academy.manage', 'academy.review',
			'academy.publish', 'grants.manage', 'system.audit', 'system.settings'
		],
		exp: Math.floor(Date.now() / 1000) + 7200
	},
	TEST_JWT_SECRET
);

const memberToken = signJwt(
	{
		sub: MEMBER_USER_ID,
		email: 'qa.student1@test.local',
		role: 'member',
		iss: 'api.cryptosharia.id',
		permissions: [],
		exp: Math.floor(Date.now() / 1000) + 7200
	},
	TEST_JWT_SECRET
);

async function waitForUrl(url, timeoutMs = 25000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.status < 500) return true;
		} catch {}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
	console.log('=================================================================');
	console.log('🚀 PHASE 2 — REAL FUNCTIONAL VALIDATION ON NEON QA & BROWSER');
	console.log('=================================================================');

	// 1. Get Neon QA Connection String
	console.log('\n[1/12] Connecting to isolated Neon QA branch...');
	let qaDbUrl = '';
	for (let attempt = 1; attempt <= 4; attempt++) {
		try {
			qaDbUrl = execSync(
				`npx -y neonctl@latest connection-string ${NEON_QA_BRANCH} --project-id ${NEON_PROJECT_ID} --org-id ${NEON_ORG_ID}`,
				{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
			).trim();
			if (qaDbUrl) break;
		} catch (err) {
			if (attempt === 4) throw err;
			console.log(`Neon API retry ${attempt}/4...`);
			await new Promise((r) => setTimeout(r, 2000));
		}
	}

	const parsedUrl = new URL(qaDbUrl);
	if (!parsedUrl.hostname.includes(PERMITTED_QA_HOST_FRAGMENT)) {
		throw new Error(`BLOCKED: Endpoint ${parsedUrl.hostname} is not the permitted QA host fragment!`);
	}
	if (parsedUrl.hostname.includes(FORBIDDEN_PROD_HOST_FRAGMENT)) {
		throw new Error('BLOCKED: Forbidden production hostname detected!');
	}
	console.log(`✓ Neon QA Endpoint verified: ${parsedUrl.hostname}`);

	const pool = new pg.Pool({ connectionString: qaDbUrl });
	const userCheck = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [ADMIN_USER_ID]);
	if (userCheck.rows.length === 0) {
		throw new Error('Seeded admin user not found in QA database');
	}
	console.log(`✓ Seeded Admin User verified: ${userCheck.rows[0].email} (${userCheck.rows[0].role})`);

	// Ensure test subject 'web3' is clean for the test
	await pool.query("DELETE FROM academy_content WHERE subject_id = 'web3'");
	let targetSubject = 'web3';
	console.log(`✓ Target subject for creation test: "${targetSubject}" (cleaned prior to test)`);

	// 2. Start cryptosharia-api (NestJS)
	console.log('\n[2/12] Starting cryptosharia-api (NestJS) on port 3456...');
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
		const msg = d.toString();
		if (msg.includes('Error') || msg.includes('ERROR') || msg.includes('Exception')) {
			process.stderr.write(`[API STDERR] ${msg}`);
		}
	});

	await waitForUrl(`${API_URL}/health`);
	console.log(`✓ cryptosharia-api is live and healthy on ${API_URL}`);

	// 3. Start cryptosharia-admin (Vite dev server)
	console.log('\n[3/12] Starting cryptosharia-admin on port 5174...');
	const adminEnv = {
		...process.env,
		PUBLIC_CS_API_URL: API_URL,
		CS_API_KEY: TEST_API_KEY
	};

	const adminProcess = spawn(
		'npx',
		['vite', '--host', '127.0.0.1', '--port', String(ADMIN_PORT), '--strictPort'],
		{
			cwd: '/Users/mac/Projects/CryptoSharia/cryptosharia-admin',
			env: adminEnv,
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

	await waitForUrl(`${ADMIN_URL}/login`);
	console.log(`✓ cryptosharia-admin is live on ${ADMIN_URL}`);

	// 4. Test RBAC Rejection via Real API & BFF
	console.log('\n[4/12] Testing RBAC rejection for non-admin and unauthenticated...');
	const unauthRes = await fetch(`${ADMIN_URL}/api/academy/admin/content`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Origin: ADMIN_URL },
		body: JSON.stringify({ id: 'bad', kind: 'subject', parentId: 'root', subjectId: 'web3', title: 'Bad' })
	});
	if (unauthRes.status !== 401) throw new Error(`Expected 401 for unauth, got ${unauthRes.status}`);
	console.log('✓ PASS: Unauthenticated access rejected with HTTP 401');

	const memberRes = await fetch(`${ADMIN_URL}/api/academy/admin/content`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Origin: ADMIN_URL,
			Cookie: `access_token=${memberToken}`
		},
		body: JSON.stringify({ id: 'bad', kind: 'subject', parentId: 'root', subjectId: 'web3', title: 'Bad' })
	});
	if (memberRes.status !== 403) throw new Error(`Expected 403 for member, got ${memberRes.status}`);
	console.log('✓ PASS: Non-admin member role rejected with HTTP 403');

	// 5. Launch Playwright Real Browser
	console.log('\n[5/12] Launching Chrome Browser for real UI test flow...');
	const browser = await chromium.launch({
		headless: true,
		executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	});
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

	await context.addCookies([
		{
			name: 'access_token',
			value: adminToken,
			domain: '127.0.0.1',
			path: '/',
			httpOnly: true,
			sameSite: 'Strict'
		}
	]);

	const page = await context.newPage();

	async function saveSnap(name, desc) {
		const f1 = join(ARTIFACT_DIR, `${name}.png`);
		const f2 = join(DESKTOP_DIR, `${name}.png`);
		await page.screenshot({ path: f1, fullPage: false });
		await page.screenshot({ path: f2, fullPage: false });
		console.log(`📸 [Screenshot] ${name}.png saved: ${desc}`);
	}

	// Step 1: Access Dashboard
	console.log('\n[6/12] Navigating to Dashboard and verifying Quick Action...');
	await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	await saveSnap('real_01_dashboard_quick_action', 'Dashboard dengan Quick Action Tambah Materi');

	// Step 2: Click Quick Action -> lands on /academy/courses?create=true
	console.log('\n[7/12] Clicking "Tambah Materi" from Dashboard...');
	await Promise.all([
		page.waitForURL((u) => u.pathname.includes('/academy/courses'), { timeout: 15000 }),
		page.click('a:has-text("Tambah Materi")')
	]);

	// Verify modal opened automatically
	await page.waitForSelector('h3:has-text("Tambah")', { state: 'visible', timeout: 15000 });
	console.log('✓ Modal opened automatically via ?create=true');

	// Verify URL was cleaned (no ?create=true)
	await page.waitForTimeout(500);
	const currentUrl = page.url();
	if (currentUrl.includes('create=true')) {
		throw new Error(`URL was not cleaned properly: ${currentUrl}`);
	}
	console.log('✓ URL cleaned properly via replaceState:', currentUrl);
	await saveSnap('real_02_courses_modal_auto_opened', 'Modal otomatis terbuka di /academy/courses');

	// Step 3: Create Subject
	console.log(`\n[8/12] Creating Subject "${targetSubject}" via Real App & Neon QA...`);
	await page.click('button:has-text("1. Subjek")');
	await page.selectOption('#create-subject-select', targetSubject);
	await page.waitForTimeout(300);
	await saveSnap('real_03_subject_form', `Form pembuatan subjek ${targetSubject}`);
	await page.click('button:has-text("Simpan SUBJECT")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1000);

	// Verify in PostgreSQL
	const dbSub = await pool.query('SELECT * FROM academy_content WHERE id = $1', [targetSubject]);
	if (dbSub.rows.length === 0) throw new Error(`Subject ${targetSubject} not found in PostgreSQL!`);
	console.log(`✓ DIRECT POSTGRES VERIFICATION: Subject "${targetSubject}" persisted in Neon QA`);

	// Step 4: Create Level under Subject
	console.log(`\n[9/12] Creating Level under Subject "${targetSubject}"...`);
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
	await page.click('button:has-text("2. Level")');
	await page.waitForTimeout(300);
	await page.selectOption('#create-parent-sub', targetSubject);
	await page.waitForTimeout(300);
	await page.fill('#create-title-lvl', `Level 1: Dasar ${targetSubject.toUpperCase()}`);
	await page.fill('#create-desc-lvl', `Kompetensi dasar materi ${targetSubject}`);
	await saveSnap('real_04_level_form', `Form pembuatan level di bawah ${targetSubject}`);
	await page.click('button:has-text("Simpan LEVEL")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1000);

	const levelId = `${targetSubject}-l1`;
	const dbLvl = await pool.query('SELECT * FROM academy_content WHERE id = $1', [levelId]);
	if (dbLvl.rows.length === 0) throw new Error(`Level ${levelId} not found in PostgreSQL!`);
	console.log(`✓ DIRECT POSTGRES VERIFICATION: Level "${levelId}" persisted in Neon QA`);

	// Step 5: Create Chapter under Level
	console.log(`\n[10/12] Creating Chapter under Level "${levelId}"...`);
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
	await page.click('button:has-text("3. Bab")');
	await page.waitForTimeout(300);
	await page.selectOption('#create-parent-lvl', levelId);
	await page.waitForTimeout(300);
	await page.fill('#create-title-ch', `Bab 1: Pengenalan ${targetSubject.toUpperCase()}`);
	await page.fill('#create-desc-ch', `Konsep fundamental ${targetSubject}`);
	await saveSnap('real_05_chapter_form', `Form pembuatan bab di bawah ${levelId}`);
	await page.click('button:has-text("Simpan CHAPTER")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1000);

	const chapterId = `${levelId}-c1`;
	const dbCh = await pool.query('SELECT * FROM academy_content WHERE id = $1', [chapterId]);
	if (dbCh.rows.length === 0) throw new Error(`Chapter ${chapterId} not found in PostgreSQL!`);
	console.log(`✓ DIRECT POSTGRES VERIFICATION: Chapter "${chapterId}" persisted in Neon QA`);

	// Step 6: Create Lesson under Chapter
	console.log(`\n[11/12] Creating Lesson under Chapter "${chapterId}"...`);
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
	await page.click('button:has-text("4. Pelajaran")');
	await page.waitForTimeout(300);
	await page.selectOption('#create-parent-ch', chapterId);
	await page.waitForTimeout(300);
	await page.fill('#create-title-ls', `Pelajaran 1: Memahami ${targetSubject.toUpperCase()}`);
	await page.fill('#create-duration', '25');
	await page.click('label:has-text("Wajib Review Kepatuhan Syariah")');
	await saveSnap('real_06_lesson_form', `Form pembuatan pelajaran di bawah ${chapterId}`);
	await page.click('button:has-text("Simpan LESSON")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1000);

	const lessonId = `${chapterId}-ls1`;
	const dbLs = await pool.query('SELECT * FROM academy_content WHERE id = $1', [lessonId]);
	if (dbLs.rows.length === 0) throw new Error(`Lesson ${lessonId} not found in PostgreSQL!`);
	if (dbLs.rows[0].status !== 'draft') throw new Error(`Expected initial status "draft", got "${dbLs.rows[0].status}"`);
	console.log(`✓ DIRECT POSTGRES VERIFICATION: Lesson "${lessonId}" persisted with status "draft"`);
	await saveSnap('real_07_populated_editor_draft', 'Pelajaran baru berstatus draft terpilih di editor');

	// Step 7: Refresh & Verify Persistence
	console.log('\n[12/12] Refreshing page, editing, and executing editorial lifecycle...');
	await page.reload({ waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	await saveSnap('real_08_after_reload_persisted', 'Halaman setelah reload membuktikan data tetap ada di pohon');

	// Step 8: Edit Lesson in Editor
	console.log('Expanding nodes in tree...');
	await page.click(`button:has-text("Level 1: Dasar ${targetSubject.toUpperCase()}")`);
	await page.waitForTimeout(400);
	await page.click(`button:has-text("Bab 1: Pengenalan ${targetSubject.toUpperCase()}")`);
	await page.waitForTimeout(400);
	await page.click(`button:has-text("Pelajaran 1: Memahami ${targetSubject.toUpperCase()}")`);
	await page.waitForTimeout(600);

	console.log('Editing lesson title and configuring YouTube video...');
	await page.fill('input#form-title', `Pelajaran 1: Memahami ${targetSubject.toUpperCase()} (Updated)`);

	// Switch to Media tab to configure required video before publishing
	await page.click('button:has-text("Media Video YouTube")');
	await page.waitForTimeout(300);
	await page.fill('input#media-input', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
	await page.waitForTimeout(300);

	await page.click('button:has-text("Simpan Materi")');
	await page.waitForTimeout(1500);

	const dbUpdated = await pool.query('SELECT title FROM academy_content WHERE id = $1', [lessonId]);
	if (!dbUpdated.rows[0].title.includes('(Updated)')) {
		throw new Error('Lesson edit was not saved in PostgreSQL!');
	}
	console.log('✓ DIRECT POSTGRES VERIFICATION: Lesson edit successfully persisted');

	// Verify media in database
	const dbMedia = await pool.query('SELECT video_id FROM academy_lesson_media WHERE lesson_id = $1', [lessonId]);
	if (dbMedia.rows.length === 0 || dbMedia.rows[0].video_id !== 'dQw4w9WgXcQ') {
		throw new Error('Lesson YouTube media was not saved in PostgreSQL!');
	}
	console.log('✓ DIRECT POSTGRES VERIFICATION: Lesson YouTube videoId ("dQw4w9WgXcQ") persisted');

	// Step 9: Transition draft -> review
	console.log('Transitioning draft -> review...');
	await page.click('button:has-text("Ajukan Review")');
	await page.waitForTimeout(1500);

	const dbReview = await pool.query('SELECT status FROM academy_content WHERE id = $1', [lessonId]);
	if (dbReview.rows[0].status !== 'review') throw new Error(`Expected status "review", got ${dbReview.rows[0].status}`);
	console.log('✓ DIRECT POSTGRES VERIFICATION: Lesson status changed to "review"');

	// Step 10: Transition review -> approved
	console.log('Transitioning review -> approved...');
	await page.click('button:has-text("Verifikasi Review")');
	await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
	await page.click('label:has-text("Saya menyatakan bahwa materi ini telah diverifikasi")');
	await page.click('button:has-text("Setujui Review")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1500);

	const dbApproved = await pool.query('SELECT status FROM academy_content WHERE id = $1', [lessonId]);
	if (dbApproved.rows[0].status !== 'approved') throw new Error(`Expected status "approved", got ${dbApproved.rows[0].status}`);
	console.log('✓ DIRECT POSTGRES VERIFICATION: Lesson status changed to "approved"');

	// Step 11: Transition approved -> published
	console.log('Transitioning approved -> published...');
	await page.click('button:has-text("Publikasikan")');
	await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
	await page.click('button:has-text("Rilis Publikasi")');
	await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
	await page.waitForTimeout(1500);

	const dbPublished = await pool.query('SELECT status, version FROM academy_content WHERE id = $1', [lessonId]);
	if (dbPublished.rows[0].status !== 'published') throw new Error(`Expected status "published", got ${dbPublished.rows[0].status}`);
	console.log(`✓ DIRECT POSTGRES VERIFICATION: Lesson status changed to "published" at version ${dbPublished.rows[0].version}`);
	await saveSnap('real_09_published_final', 'Pelajaran berhasil dipublikasikan melalui dual-gate syariah');

	// Clean up newly created test items from Neon QA
	console.log('\n[CLEANUP] Cleaning up test items from Neon QA...');
	await pool.query('DELETE FROM academy_content WHERE id IN ($1, $2, $3, $4)', [
		lessonId, chapterId, levelId, targetSubject
	]);
	console.log(`✓ Cleaned up test items (${targetSubject}) from Neon QA.`);

	// Teardown
	await browser.close();
	adminProcess.kill();
	apiProcess.kill();
	await pool.end();

	console.log('\n=================================================================');
	console.log('🎉 ALL 12 REAL FUNCTIONAL VALIDATION STEPS PASSED 100%!');
	console.log('=================================================================');
}

run().catch((err) => {
	console.error('FAILED:', err);
	process.exit(1);
});
