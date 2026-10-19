/**
 * Visual QA Screenshot Capture Script for Curriculum Builder & First Lesson Creation Flow
 * CryptoSharia Unified Admin Portal
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const playwright = await import('/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const { chromium } = playwright;

const API_PORT = 4890;
const ADMIN_PORT = 4891;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`;

const ARTIFACT_DIR = '/Users/mac/.gemini/antigravity-ide/brain/0a2e685b-b91e-455b-92e1-b760e9c51e7d/screenshots';
const DESKTOP_DIR = '/Users/mac/Desktop/cryptosharia-actual-ui';

mkdirSync(ARTIFACT_DIR, { recursive: true });
mkdirSync(DESKTOP_DIR, { recursive: true });

function signJwt(payload) {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	return `${header}.${body}.mock-signature`;
}

const adminToken = signJwt({
	sub: '25f4507b-7908-458c-a07b-edae1f0e107a',
	email: 'admin@cryptosharia.id',
	role: 'super_admin',
	permissions: [
		'users.view', 'users.manage', 'users.roles', 'posts.manage', 'posts.publish',
		'cryptoassets.manage', 'academy.view', 'academy.manage', 'academy.review',
		'academy.publish', 'grants.manage', 'system.audit', 'system.settings'
	],
	exp: Math.floor(Date.now() / 1000) + 7200
});

// Dynamic backend in-memory state
const contents = [];
const scopes = [
	{ id: 'free', name: 'Free Tier', description: 'Materi pengantar publik', isActive: true },
	{ id: 'pro', name: 'Pro Member', description: 'Materi eksklusif pro', isActive: true }
];

const mockApi = createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const pathname = url.pathname;

	const json = (status, data) => {
		res.writeHead(status, { 'content-type': 'application/json' });
		res.end(JSON.stringify(data));
	};

	let rawBody = '';
	for await (const chunk of req) rawBody += chunk;
	const body = rawBody ? JSON.parse(rawBody) : {};

	if (pathname === '/auth/me') {
		return json(200, {
			id: '25f4507b-7908-458c-a07b-edae1f0e107a',
			name: 'Super Admin CryptoSharia',
			email: 'admin@cryptosharia.id',
			role: 'super_admin',
			permissions: [
				'users.view', 'users.manage', 'users.roles', 'posts.manage', 'posts.publish',
				'cryptoassets.manage', 'academy.view', 'academy.manage', 'academy.review',
				'academy.publish', 'grants.manage', 'system.audit', 'system.settings'
			]
		});
	}

	if (pathname === '/academy/admin/stats') {
		const totalLessons = contents.filter((c) => c.kind === 'lesson').length;
		const publishedLessons = contents.filter((c) => c.kind === 'lesson' && c.status === 'published').length;
		const draftContent = contents.filter((c) => c.status === 'draft').length;
		const reviewContent = contents.filter((c) => c.status === 'review').length;
		return json(200, {
			totalLessons,
			publishedLessons,
			draftContent,
			reviewContent,
			totalScopes: scopes.length,
			totalGrants: 5
		});
	}

	if (pathname === '/academy/admin/scopes') {
		return json(200, scopes);
	}

	if (pathname === '/academy/admin/content') {
		if (req.method === 'GET') {
			return json(200, contents);
		}
		if (req.method === 'POST') {
			const item = {
				id: body.id,
				kind: body.kind,
				parentId: body.parentId,
				subjectId: body.subjectId,
				title: body.title,
				description: body.description || '',
				content: body.content || '',
				level: body.level || 1,
				chapterNumber: body.chapterNumber || 1,
				order: body.order || 1,
				scopeId: body.scopeId || null,
				durationSeconds: body.durationSeconds || 900,
				instructor: body.instructor || 'Tim Edukasi CryptoSharia',
				syariahRequired: body.syariahRequired || false,
				status: 'draft',
				version: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				media: []
			};
			contents.push(item);
			return json(201, item);
		}
	}

	if (pathname.startsWith('/academy/admin/content/') && req.method === 'PUT') {
		const id = pathname.split('/')[4];
		const item = contents.find((c) => c.id === id);
		if (item) {
			Object.assign(item, body, { updatedAt: new Date().toISOString() });
			return json(200, item);
		}
		return json(404, { error: 'NOT_FOUND' });
	}

	if (['/cryptoassets', '/users', '/posts', '/messages', '/tags'].includes(pathname)) {
		res.writeHead(200, { 'content-type': 'application/json', 'total-items': '25' });
		res.end(JSON.stringify([]));
		return;
	}

	json(404, { error: 'ROUTE_NOT_FOUND' });
});

async function waitForUrl(url, timeoutMs = 20000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.status < 500) return true;
		} catch {}
		await new Promise((r) => setTimeout(r, 300));
	}
	throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
	console.log('1. Starting mock API server...');
	await new Promise((res) => mockApi.listen(API_PORT, '127.0.0.1', res));
	console.log(`✓ Mock API running on ${API_URL}`);

	console.log('2. Starting Vite admin dev server...');
	const adminProcess = spawn(
		'npx',
		['vite', '--host', '127.0.0.1', '--port', String(ADMIN_PORT), '--strictPort'],
		{
			cwd: '/Users/mac/Projects/CryptoSharia/cryptosharia-admin',
			env: {
				...process.env,
				PUBLIC_CS_API_URL: API_URL,
				CS_API_KEY: 'test-api-key'
			},
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

	await waitForUrl(`${ADMIN_URL}/login`);
	console.log(`✓ Vite admin running on ${ADMIN_URL}`);

	console.log('3. Launching Chromium via Playwright...');
	const browser = await chromium.launch({
		headless: true,
		executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	});
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 }
	});

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
	page.on('console', (msg) => console.log('[BROWSER CONSOLE]', msg.text()));
	page.on('pageerror', (err) => console.error('[BROWSER ERROR]', err));

	async function saveSnap(name, desc) {
		const f1 = join(ARTIFACT_DIR, `${name}.png`);
		const f2 = join(DESKTOP_DIR, `${name}.png`);
		await page.screenshot({ path: f1, fullPage: false });
		await page.screenshot({ path: f2, fullPage: false });
		console.log(`📸 [Screenshot] ${name}.png saved: ${desc}`);
	}

	// ----------------------------------------------------
	// SCENARIO 1: Truly Empty Database (Curriculum Masih Kosong)
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 1: Truly Empty Database ---');
	await page.goto(`${ADMIN_URL}/academy/courses`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	await saveSnap('01_empty_curriculum_database', 'Halaman Curriculum Builder saat database masih kosong');

	// ----------------------------------------------------
	// SCENARIO 2: Open Modal from "Buat Materi Pertama" button
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 2: Modal Step 1 - Subject Creation ---');
	// Click "Buat Materi Pertama" button
	await page.click('button:has-text("Buat Materi Pertama")');
	await page.waitForTimeout(500);
	await saveSnap('02_create_modal_step1_subject', 'Modal Pembuatan Entitas: Pilihan Subjek Tingkat 1');

	// Submit Subject 'muamalah'
	await page.selectOption('#create-subject-select', 'muamalah');
	await page.waitForTimeout(300);
	await page.click('button:has-text("Simpan SUBJECT")');
	await page.waitForTimeout(1000);

	// ----------------------------------------------------
	// SCENARIO 3: Create Level under Subject
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 3: Modal Step 2 - Level Creation ---');
	// Click header "Tambah Materi"
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForTimeout(500);
	// Switch tab to Level
	await page.click('button:has-text("2. Level")');
	await page.waitForTimeout(500);
	await saveSnap('03_create_modal_step2_level', 'Modal Pembuatan Entitas: Level di bawah Subjek Muamalah');

	// Fill Level details & submit
	await page.fill('#create-title-lvl', 'Level 1: Fondasi Maal & Sil\'ah');
	await page.fill('#create-desc-lvl', 'Memahami konsep dasar harta dan komoditas dalam Islam');
	await page.click('button:has-text("Simpan LEVEL")');
	await page.waitForTimeout(1000);

	// ----------------------------------------------------
	// SCENARIO 4: Create Chapter under Level
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 4: Modal Step 3 - Chapter Creation ---');
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForTimeout(500);
	// Switch tab to Chapter
	await page.click('button:has-text("3. Bab")');
	await page.waitForTimeout(500);
	await saveSnap('04_create_modal_step3_chapter', 'Modal Pembuatan Entitas: Bab di bawah Level 1');

	await page.fill('#create-title-ch', 'Bab 1: Definisi Maal Mutaqawwam');
	await page.fill('#create-desc-ch', 'Syarat-syarat harta yang diakui syariat dan status aset digital');
	await page.click('button:has-text("Simpan CHAPTER")');
	await page.waitForTimeout(1000);

	// ----------------------------------------------------
	// SCENARIO 5: Create Lesson under Chapter
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 5: Modal Step 4 - Lesson Creation ---');
	await page.click('button:has-text("Tambah Materi")');
	await page.waitForTimeout(500);
	// Switch tab to Lesson
	await page.click('button:has-text("4. Pelajaran")');
	await page.waitForTimeout(500);
	await saveSnap('05_create_modal_step4_lesson', 'Modal Pembuatan Entitas: Pelajaran dengan Durasi & Syariah Check');

	await page.fill('#create-title-ls', 'Pelajaran 1: Hakikat Uang dalam Fikih Klasik');
	await page.fill('#create-desc-ls', 'Analisis komparatif tsaman, sil\'ah, dan mata uang kripto');
	await page.click('button:has-text("Simpan LESSON")');
	await page.waitForTimeout(1200);

	// ----------------------------------------------------
	// SCENARIO 6: Populated Curriculum Tree with Draft Lesson Selected
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 6: Populated Curriculum Tree ---');
	await saveSnap('06_populated_curriculum_tree_draft_selected', 'Pohon Kurikulum Lengkap & Editor Pelajaran Baru (Status Draft)');

	// ----------------------------------------------------
	// SCENARIO 7: Filter Mismatch State
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 7: Filter Mismatch State ---');
	await page.fill('input[placeholder*="Cari materi"]', 'bitcoin-arbitrage-xyz-notfound');
	await page.waitForTimeout(500);
	await saveSnap('07_filter_mismatch_empty_state', 'Empty state filter tidak cocok dengan tombol Reset Filter');

	// Reset filter
	await page.click('button:has-text("Reset Filter & Pencarian")');
	await page.waitForTimeout(500);

	// ----------------------------------------------------
	// SCENARIO 8: Dashboard Quick Action Navigation
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 8: Dashboard Quick Action ---');
	await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	await saveSnap('08_dashboard_quick_action', 'Dashboard Unified Admin dengan Quick Action Tambah Materi');

	// Click "Tambah Materi" from Dashboard Quick Action
	await page.click('a:has-text("Tambah Materi")');
	await page.waitForTimeout(1200);
	await saveSnap('09_quick_action_modal_auto_opened', 'Modal Tambah Materi otomatis terbuka saat navigasi dari dashboard');

	// ----------------------------------------------------
	// SCENARIO 9: Responsive Mobile View (390x844 iPhone)
	// ----------------------------------------------------
	console.log('\n--- SCENARIO 9: Mobile Responsive View ---');
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${ADMIN_URL}/academy/courses`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	await saveSnap('10_mobile_curriculum_builder', 'Tampilan responsif mobile halaman Pohon Kurikulum & Editor');

	// Cleanup
	await browser.close();
	adminProcess.kill();
	mockApi.close();
	console.log('\n✅ All screenshots captured and saved successfully!');
}

run().catch((err) => {
	console.error('Test run failed:', err);
	process.exit(1);
});
