import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const key = 'qa-synthetic-backend-api-key';
const adminUserId = '10000000-0000-4000-8000-000000000001';
const memberUserId = '20000000-0000-4000-8000-000000000002';

function generateJwt(userId, role) {
	return [
		Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
		Buffer.from(
			JSON.stringify({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 3600 })
		).toString('base64url'),
		'qa-synthetic-signature'
	].join('.');
}

const adminToken = generateJwt(adminUserId, 'admin');
const memberToken = generateJwt(memberUserId, 'member');

// ==========================================
// Isolated Stateful In-Memory QA Database
// ==========================================
const db = {
	scopes: new Map([
		['free', { id: 'free', name: 'Free Tier', description: 'Materi pengantar', isActive: true }]
	]),
	contents: new Map(),
	media: new Map(),
	grants: new Map()
};

const mockBackend = createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const pathname = url.pathname;
	const apiKeyHeader = req.headers['api-key'];
	const authHeader = req.headers['authorization'];
	const bearerToken = authHeader?.replace(/^Bearer\s+/i, '');

	const json = (status, data) => {
		res.writeHead(status, { 'content-type': 'application/json' });
		res.end(JSON.stringify(data));
	};

	let rawBody = '';
	for await (const chunk of req) rawBody += chunk;
	const body = rawBody ? JSON.parse(rawBody) : {};

	console.log(`[QA Backend MOCK] ${req.method} ${pathname} | bearer: ${bearerToken?.slice(0, 15)}... | apiKey: ${apiKeyHeader}`);

	// 1. Auth check
	if (pathname === '/auth/me') {
		if (bearerToken === adminToken) {
			return json(200, {
				id: adminUserId,
				name: 'QA Admin User',
				email: 'admin-qa@cryptosharia.id',
				role: 'admin',
				status: 'active'
			});
		}
		if (bearerToken === memberToken) {
			return json(200, {
				id: memberUserId,
				name: 'QA Member User',
				email: 'member-qa@cryptosharia.id',
				role: 'member',
				status: 'active'
			});
		}
		return json(401, { error: 'UNAUTHORIZED', message: 'Bearer token tidak valid' });
	}

	// 2. All Academy Admin API routes require api-key header
	if (pathname.startsWith('/academy/admin/')) {
		if (apiKeyHeader !== key) {
			return json(401, { error: 'UNAUTHORIZED', message: 'API key server tidak valid' });
		}
		if (!bearerToken || bearerToken !== adminToken) {
			return json(403, { error: 'FORBIDDEN', message: 'Hak akses academy.manage diperlukan' });
		}
	}

	// Stats
	if (pathname === '/academy/admin/stats' && req.method === 'GET') {
		const totalLessons = [...db.contents.values()].filter((c) => c.kind === 'lesson').length;
		const publishedLessons = [...db.contents.values()].filter(
			(c) => c.kind === 'lesson' && c.status === 'published'
		).length;
		const draftContent = [...db.contents.values()].filter((c) => c.status === 'draft').length;
		const reviewContent = [...db.contents.values()].filter((c) => c.status === 'review').length;
		return json(200, {
			totalLessons,
			publishedLessons,
			draftContent,
			reviewContent,
			totalScopes: db.scopes.size,
			totalGrants: db.grants.size
		});
	}

	// Scopes GET & POST
	if (pathname === '/academy/admin/scopes') {
		if (req.method === 'GET') {
			return json(200, [...db.scopes.values()]);
		}
		if (req.method === 'POST') {
			if (db.scopes.has(body.id)) {
				return json(409, { error: 'SCOPE_ALREADY_EXISTS', message: 'Scope sudah ada' });
			}
			const newScope = {
				id: body.id,
				name: body.name,
				description: body.description ?? '',
				isActive: body.isActive ?? true
			};
			db.scopes.set(body.id, newScope);
			return json(201, newScope);
		}
	}

	// Scopes PUT
	if (pathname.startsWith('/academy/admin/scopes/') && req.method === 'PUT') {
		const id = decodeURIComponent(pathname.replace('/academy/admin/scopes/', ''));
		const existing = db.scopes.get(id);
		if (!existing) {
			return json(404, { error: 'SCOPE_NOT_FOUND', message: 'Scope tidak ditemukan' });
		}
		const updated = {
			...existing,
			name: body.name ?? existing.name,
			description: body.description ?? existing.description,
			isActive: body.isActive !== undefined ? body.isActive : existing.isActive
		};
		db.scopes.set(id, updated);
		return json(200, updated);
	}

	// Content GET & POST
	if (pathname === '/academy/admin/content') {
		if (req.method === 'GET') {
			return json(200, [...db.contents.values()]);
		}
		if (req.method === 'POST') {
			// Hierarchy Validation matching NestJS AcademyService
			if (body.kind === 'subject') {
				if (body.parentId !== 'root' || body.id !== body.subjectId) {
					return json(400, {
						error: 'INVALID_CONTENT_HIERARCHY',
						message: 'Subject harus memiliki parentId root dan id sama dengan subjectId'
					});
				}
			} else {
				const parent = db.contents.get(body.parentId);
				if (!parent) {
					return json(400, {
						error: 'INVALID_CONTENT_HIERARCHY',
						message: `Induk konten ${body.parentId} tidak ditemukan`
					});
				}
				const expectedParent = { level: 'subject', chapter: 'level', lesson: 'chapter' };
				if (parent.kind !== expectedParent[body.kind]) {
					return json(400, {
						error: 'INVALID_CONTENT_HIERARCHY',
						message: `Tipe induk tidak sesuai: ${body.kind} harus berada di bawah ${expectedParent[body.kind]}`
					});
				}
			}

			const contentItem = {
				...body,
				status: 'draft',
				version: 1,
				rightsConfirmed: false,
				createdAt: new Date().toISOString()
			};
			db.contents.set(body.id, contentItem);
			return json(201, contentItem);
		}
	}

	// Content Detail, PUT, DELETE
	if (pathname.startsWith('/academy/admin/content/') && !pathname.includes('/media') && !pathname.includes('/transition')) {
		const id = decodeURIComponent(pathname.replace('/academy/admin/content/', ''));
		const existing = db.contents.get(id);

		if (req.method === 'GET') {
			if (!existing) return json(404, { error: 'CONTENT_NOT_FOUND', message: 'Konten tidak ditemukan' });
			return json(200, existing);
		}

		if (req.method === 'PUT') {
			if (!existing) return json(404, { error: 'CONTENT_NOT_FOUND', message: 'Konten tidak ditemukan' });
			const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
			db.contents.set(id, updated);
			return json(200, updated);
		}

		if (req.method === 'DELETE') {
			if (!existing) return json(404, { error: 'CONTENT_NOT_FOUND', message: 'Konten tidak ditemukan' });
			if (existing.status !== 'draft') {
				return json(400, { error: 'CANNOT_DELETE_NON_DRAFT', message: 'Hanya draft yang dapat dihapus' });
			}
			db.contents.delete(id);
			res.writeHead(204);
			return res.end();
		}
	}

	// Media PUT
	if (pathname.endsWith('/media') && req.method === 'PUT') {
		const id = decodeURIComponent(pathname.replace('/academy/admin/content/', '').replace('/media', ''));
		const content = db.contents.get(id);
		if (!content || content.kind !== 'lesson') {
			return json(400, {
				error: 'INVALID_CONTENT_HIERARCHY',
				message: 'Media hanya dapat dikaitkan dengan konten berjenis lesson'
			});
		}
		const mediaItem = {
			videoId: body.videoId,
			version: 1,
			readingRefs: body.readingRefs ?? [],
			slideRefs: body.slideRefs ?? [],
			subtitleRefs: body.subtitleRefs ?? [],
			attachmentRefs: body.attachmentRefs ?? []
		};
		db.media.set(id, mediaItem);
		return json(200, mediaItem);
	}

	// Status Transition POST
	if (pathname.endsWith('/transition') && req.method === 'POST') {
		const id = decodeURIComponent(pathname.replace('/academy/admin/content/', '').replace('/transition', ''));
		const content = db.contents.get(id);
		if (!content) return json(404, { error: 'CONTENT_NOT_FOUND', message: 'Konten tidak ditemukan' });

		const validTransitions = {
			draft: ['review'],
			review: ['approved', 'draft'],
			approved: ['published', 'draft'],
			published: ['archived'],
			archived: ['draft']
		};

		const allowed = validTransitions[content.status] ?? [];
		if (!allowed.includes(body.targetStatus)) {
			return json(400, {
				error: 'INVALID_STATUS_TRANSITION',
				message: `Transisi status dari "${content.status}" ke "${body.targetStatus}" tidak diizinkan`
			});
		}

		if (body.targetStatus === 'approved' && !body.rightsConfirmed) {
			return json(400, {
				error: 'RIGHTS_NOT_CONFIRMED',
				message: 'Pernyataan kesesuaian syariah dan hak materi wajib dicentang untuk menyetujui'
			});
		}

		if (body.targetStatus === 'published' && content.kind === 'lesson') {
			const media = db.media.get(id);
			if (!media || !media.videoId) {
				return json(400, {
					error: 'MEDIA_NOT_FOUND',
					message: 'Materi video belum dikonfigurasi. Daftarkan video YouTube terlebih dahulu.'
				});
			}
		}

		const updated = {
			...content,
			status: body.targetStatus,
			rightsConfirmed: body.rightsConfirmed ?? content.rightsConfirmed,
			updatedAt: new Date().toISOString()
		};
		db.contents.set(id, updated);
		return json(200, updated);
	}

	// Grants GET & POST
	if (pathname === '/academy/admin/grants') {
		if (req.method === 'GET') {
			return json(200, [...db.grants.values()]);
		}
		if (req.method === 'POST') {
			const grant = {
				id: 'grant-' + Date.now(),
				userId: body.userId,
				scopeId: body.scopeId,
				state: body.state ?? 'active',
				startsAt: body.startsAt ?? new Date().toISOString(),
				expiresAt: body.expiresAt ?? new Date(Date.now() + 86400000 * 365).toISOString(),
				source: body.source ?? 'manual',
				createdAt: new Date().toISOString()
			};
			db.grants.set(grant.id, grant);
			return json(201, grant);
		}
	}

	// Grants Revoke PUT
	if (pathname.endsWith('/revoke') && req.method === 'PUT') {
		const id = decodeURIComponent(pathname.replace('/academy/admin/grants/', '').replace('/revoke', ''));
		const existing = db.grants.get(id);
		if (!existing) return json(404, { error: 'GRANT_NOT_FOUND', message: 'Grant tidak ditemukan' });
		const updated = { ...existing, state: 'revoked' };
		db.grants.set(id, updated);
		return json(200, updated);
	}

	return json(404, { error: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' });
});

// Helper for listening
const listen = (server) => new Promise((done) => server.listen(0, '127.0.0.1', done));

async function runSmokeTest() {
	console.log('--- STARTING ACADEMY CMS BFF INTEGRATION SMOKE TEST ---');

	await listen(mockBackend);
	const backendPort = mockBackend.address().port;
	const backendUrl = `http://127.0.0.1:${backendPort}`;
	console.log(`[QA Backend] Listening on ${backendUrl}`);

	// Reserve dynamic port for Vite dev server
	const reserve = createServer();
	await listen(reserve);
	const adminPort = reserve.address().port;
	await new Promise((done) => reserve.close(done));
	const adminUrl = `http://127.0.0.1:${adminPort}`;
	console.log(`[Admin BFF] Starting on ${adminUrl}`);

	const childEnv = { ...process.env };
	Object.assign(childEnv, {
		NODE_ENV: 'development',
		PUBLIC_CS_API_URL: backendUrl,
		CS_API_KEY: key,
		P01_ALLOWED_ORIGINS: JSON.stringify([adminUrl, backendUrl])
	});

	const child = spawn(
		process.execPath,
		[
			'--require',
			join(root, 'tests', 'loopback-only.cjs'),
			join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
			'dev',
			'--host',
			'127.0.0.1',
			'--port',
			String(adminPort),
			'--strictPort'
		],
		{ cwd: root, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] }
	);

	let serverReady = false;
	child.stdout.on('data', (d) => {
		const msg = d.toString();
		if (msg.includes('Local:') || msg.includes('ready in')) serverReady = true;
	});
	child.stderr.on('data', (d) => {
		const msg = d.toString();
		if (msg.includes('Local:') || msg.includes('ready in')) serverReady = true;
	});

	// Wait up to 10 seconds for Vite server ready
	for (let i = 0; i < 50; i++) {
		if (serverReady) break;
		await new Promise((r) => setTimeout(r, 200));
	}
	assert.ok(serverReady, 'Admin SvelteKit server must start successfully');
	console.log('[Admin BFF] Vite server ready');

	const client = async (path, options = {}) => {
		const headers = {
			origin: adminUrl,
			...(options.headers || {})
		};
		if (options.token) {
			headers['cookie'] = `access_token=${options.token}; refresh_token=qa-refresh`;
		}
		if (options.body) {
			headers['content-type'] = 'application/json';
		}
		return fetch(`${adminUrl}${path}`, {
			method: options.method || 'GET',
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined
		});
	};

	try {
		// ==========================================
		// Step 1: Unauthenticated Request -> 401
		// ==========================================
		console.log('\n[Step 1] Verifying Unauthenticated Request (Fail-Closed)...');
		const unauthRes = await client('/api/academy/admin/stats');
		assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be rejected with 401');
		const unauthBody = await unauthRes.json();
		assert.strictEqual(unauthBody.error, 'UNAUTHORIZED');
		console.log('✓ PASS: Unauthenticated access rejected with 401');

		// ==========================================
		// Step 2: Member Role Request -> 403
		// ==========================================
		console.log('\n[Step 2] Verifying Member Role Request (RBAC Enforcement)...');
		const memberRes = await client('/api/academy/admin/stats', { token: memberToken });
		assert.strictEqual(memberRes.status, 403, 'Member role must be rejected with 403');
		const memberBody = await memberRes.json();
		assert.strictEqual(memberBody.error, 'FORBIDDEN');
		console.log('✓ PASS: Non-admin member role rejected with 403');

		// ==========================================
		// Step 3: Admin GET Stats -> 200
		// ==========================================
		console.log('\n[Step 3] Admin fetching Academy Stats...');
		const statsRes = await client('/api/academy/admin/stats', { token: adminToken });
		assert.strictEqual(statsRes.status, 200, 'Admin request must return 200');
		const statsData = await statsRes.json();
		assert.strictEqual(statsData.totalScopes, 1);
		assert.strictEqual(statsData.totalLessons, 0);
		console.log(`✓ PASS: Stats returned correctly: ${JSON.stringify(statsData)}`);

		// ==========================================
		// Step 4: Admin Create Scope -> 201
		// ==========================================
		console.log('\n[Step 4] Admin creating new Scope "qa-pro-tier"...');
		const createScopeRes = await client('/api/academy/admin/scopes', {
			method: 'POST',
			token: adminToken,
			body: {
				id: 'qa-pro-tier',
				name: 'QA Pro Tier Access',
				description: 'Scope khusus pengujian QA',
				isActive: true
			}
		});
		assert.strictEqual(createScopeRes.status, 201, 'Create scope must return 201');
		const scopeData = await createScopeRes.json();
		assert.strictEqual(scopeData.id, 'qa-pro-tier');
		assert.strictEqual(scopeData.name, 'QA Pro Tier Access');
		console.log('✓ PASS: Scope created with status 201');

		// ==========================================
		// Step 5: Admin Update Scope -> 200
		// ==========================================
		console.log('\n[Step 5] Admin updating Scope "qa-pro-tier"...');
		const updateScopeRes = await client('/api/academy/admin/scopes/qa-pro-tier', {
			method: 'PUT',
			token: adminToken,
			body: {
				name: 'QA Pro Tier Updated',
				isActive: true
			}
		});
		assert.strictEqual(updateScopeRes.status, 200, 'Update scope must return 200');
		const updatedScopeData = await updateScopeRes.json();
		assert.strictEqual(updatedScopeData.name, 'QA Pro Tier Updated');
		console.log('✓ PASS: Scope updated with status 200');

		// ==========================================
		// Step 6: Create Hierarchy Subject -> Level -> Chapter -> Lesson
		// ==========================================
		console.log('\n[Step 6] Admin creating full curriculum hierarchy...');

		// 6a. Subject
		const subjRes = await client('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: 'fundamental',
				kind: 'subject',
				parentId: 'root',
				subjectId: 'fundamental',
				title: 'Analisis Fundamental Kripto',
				description: 'Pondasi analisis fundamental aset kripto',
				order: 1
			}
		});
		assert.strictEqual(subjRes.status, 201, 'Subject creation must return 201');
		console.log('  ✓ Subject "fundamental" created');

		// 6b. Level
		const lvlRes = await client('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: 'lvl-fund-1',
				kind: 'level',
				parentId: 'fundamental',
				subjectId: 'fundamental',
				level: 1,
				chapterNumber: 1,
				title: 'Level 1: Konsep Dasar',
				order: 1
			}
		});
		assert.strictEqual(lvlRes.status, 201, 'Level creation must return 201');
		console.log('  ✓ Level "lvl-fund-1" created under Subject');

		// 6c. Chapter
		const chapRes = await client('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: 'chap-fund-1',
				kind: 'chapter',
				parentId: 'lvl-fund-1',
				subjectId: 'fundamental',
				level: 1,
				chapterNumber: 1,
				title: 'Bab 1: Pengenalan Blockchain',
				order: 1
			}
		});
		assert.strictEqual(chapRes.status, 201, 'Chapter creation must return 201');
		console.log('  ✓ Chapter "chap-fund-1" created under Level');

		// 6d. Lesson
		const lessonRes = await client('/api/academy/admin/content', {
			method: 'POST',
			token: adminToken,
			body: {
				id: 'les-fund-1-01',
				kind: 'lesson',
				parentId: 'chap-fund-1',
				subjectId: 'fundamental',
				level: 1,
				chapterNumber: 1,
				order: 1,
				title: 'Pelajaran 1: Mekanisme Konsensus',
				description: 'Memahami Proof of Work vs Proof of Stake',
				syariahRequired: true
			}
		});
		assert.strictEqual(lessonRes.status, 201, 'Lesson creation must return 201');
		const lessonData = await lessonRes.json();
		assert.strictEqual(lessonData.id, 'les-fund-1-01');
		assert.strictEqual(lessonData.status, 'draft');
		console.log('  ✓ Lesson "les-fund-1-01" created with status "draft"');

		// ==========================================
		// Step 7: Update Content
		// ==========================================
		console.log('\n[Step 7] Admin updating Lesson title & duration...');
		const updateLessonRes = await client('/api/academy/admin/content/les-fund-1-01', {
			method: 'PUT',
			token: adminToken,
			body: {
				title: 'Pelajaran 1: Mekanisme Konsensus & Syariah',
				durationSeconds: 1200
			}
		});
		assert.strictEqual(updateLessonRes.status, 200, 'Update lesson must return 200');
		const updatedLesson = await updateLessonRes.json();
		assert.strictEqual(updatedLesson.title, 'Pelajaran 1: Mekanisme Konsensus & Syariah');
		console.log('✓ PASS: Content updated with status 200');

		// ==========================================
		// Step 8: Attach Media
		// ==========================================
		console.log('\n[Step 8] Admin attaching YouTube media to Lesson...');
		const attachMediaRes = await client('/api/academy/admin/content/les-fund-1-01/media', {
			method: 'PUT',
			token: adminToken,
			body: {
				videoId: 'dQw4w9WgXcQ',
				readingRefs: ['https://cryptosharia.id/bacaan-konsensus.pdf'],
				slideRefs: [],
				subtitleRefs: [],
				attachmentRefs: []
			}
		});
		assert.strictEqual(attachMediaRes.status, 200, 'Attach media must return 200');
		const mediaData = await attachMediaRes.json();
		assert.strictEqual(mediaData.videoId, 'dQw4w9WgXcQ');
		console.log('✓ PASS: Media attached with status 200');

		// ==========================================
		// Step 9: Invalid Editorial Transitions (Negative Testing)
		// ==========================================
		console.log('\n[Step 9] Testing Invalid Editorial Transitions (Negative Testing)...');

		// 9a. Direct draft -> published (Invalid!)
		const invalidTransRes1 = await client('/api/academy/admin/content/les-fund-1-01/transition', {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'published' }
		});
		assert.strictEqual(invalidTransRes1.status, 400, 'Direct draft to published must be rejected with 400');
		console.log('  ✓ Direct draft ➔ published rejected with 400');

		// 9b. Transition to approved without rightsConfirmed (Invalid!)
		// First transition to review
		await client('/api/academy/admin/content/les-fund-1-01/transition', {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'review' }
		});

		const invalidApproveRes = await client('/api/academy/admin/content/les-fund-1-01/transition', {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'approved', rightsConfirmed: false }
		});
		assert.strictEqual(invalidApproveRes.status, 400, 'Approve without rightsConfirmed must return 400');
		const approveErr = await invalidApproveRes.json();
		assert.strictEqual(approveErr.error, 'RIGHTS_NOT_CONFIRMED');
		console.log('  ✓ Approve without rightsConfirmed rejected with 400 RIGHTS_NOT_CONFIRMED');

		// ==========================================
		// Step 10: Valid Editorial Transition Flow
		// ==========================================
		console.log('\n[Step 10] Testing Valid Editorial Transition Flow...');
		// 10a. Review -> Approved with rightsConfirmed: true
		const validApproveRes = await client('/api/academy/admin/content/les-fund-1-01/transition', {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'approved', rightsConfirmed: true }
		});
		assert.strictEqual(validApproveRes.status, 200);
		console.log('  ✓ review ➔ approved succeeded with 200');

		// 10b. Approved -> Published (media is present)
		const validPublishRes = await client('/api/academy/admin/content/les-fund-1-01/transition', {
			method: 'POST',
			token: adminToken,
			body: { targetStatus: 'published' }
		});
		assert.strictEqual(validPublishRes.status, 200);
		const publishedContent = await validPublishRes.json();
		assert.strictEqual(publishedContent.status, 'published');
		console.log('  ✓ approved ➔ published succeeded with 200 (published status confirmed)');

		// ==========================================
		// Step 11: Grants Creation and Revocation
		// ==========================================
		console.log('\n[Step 11] Admin Creating and Revoking Participant Grant...');
		const createGrantRes = await client('/api/academy/admin/grants', {
			method: 'POST',
			token: adminToken,
			body: {
				userId: '30000000-0000-4000-8000-000000000003',
				scopeId: 'qa-pro-tier'
			}
		});
		assert.strictEqual(createGrantRes.status, 201, 'Create grant must return 201');
		const grantData = await createGrantRes.json();
		assert.strictEqual(grantData.state, 'active');
		console.log(`  ✓ Grant created: ${grantData.id} (state: active)`);

		// Revoke grant
		const revokeGrantRes = await client(`/api/academy/admin/grants/${grantData.id}/revoke`, {
			method: 'PUT',
			token: adminToken
		});
		assert.strictEqual(revokeGrantRes.status, 200, 'Revoke grant must return 200');
		const revokedData = await revokeGrantRes.json();
		assert.strictEqual(revokedData.state, 'revoked');
		console.log(`  ✓ Grant revoked: ${revokedData.id} (state: revoked)`);

		// ==========================================
		// Step 12: Verify Database Persistence & Final Stats
		// ==========================================
		console.log('\n[Step 12] Verifying Database State Persistence & Stats Update...');
		const finalStatsRes = await client('/api/academy/admin/stats', { token: adminToken });
		assert.strictEqual(finalStatsRes.status, 200);
		const finalStats = await finalStatsRes.json();
		assert.strictEqual(finalStats.totalLessons, 1);
		assert.strictEqual(finalStats.publishedLessons, 1);
		assert.strictEqual(finalStats.totalScopes, 2); // 'free' + 'qa-pro-tier'
		assert.strictEqual(finalStats.totalGrants, 1);
		console.log(`✓ PASS: Final stats match persistent QA database state: ${JSON.stringify(finalStats)}`);

		// ==========================================
		// Step 13: Clean-up
		// ==========================================
		console.log('\n[Step 13] Cleaning up QA data safely...');
		db.scopes.delete('qa-pro-tier');
		db.contents.delete('les-fund-1-01');
		db.contents.delete('chap-fund-1');
		db.contents.delete('lvl-fund-1');
		db.contents.delete('fundamental');
		db.media.delete('les-fund-1-01');
		db.grants.delete(grantData.id);
		console.log('✓ PASS: All QA test entities cleaned up with zero residue');

		console.log('\n======================================================');
		console.log('✅ ALL INTEGRATION SMOKE TEST SCENARIOS PASSED 100%!');
		console.log('======================================================\n');
	} finally {
		child.kill();
		mockBackend.close();
	}
}

runSmokeTest().catch((err) => {
	console.error('❌ SMOKE TEST FAILED:', err);
	process.exit(1);
});
