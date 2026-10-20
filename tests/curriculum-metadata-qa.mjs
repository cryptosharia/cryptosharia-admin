// Real BFF -> unchanged NestJS API -> isolated Neon QA regression.
// --hold leaves the synthetic fixture available for browser testing until Enter.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = process.env.ACADEMY_QA_API_ROOT;
assert.ok(apiRoot, 'Set ACADEMY_QA_API_ROOT to a clean API checkout');
const evidence = resolve(process.env.ACADEMY_QA_EVIDENCE || resolve(root, '../evidence'));
const project = 'winter-firefly-11354002';
const branch = 'qa-academy-testing';
const branchId = 'br-wispy-dust-a1rqsd3c';
const apiOrigin = 'http://127.0.0.1:3467';
const adminOrigin = 'http://127.0.0.1:5187';
const key = 'curriculum-metadata-synthetic-api-key';
const secret = 'curriculum-metadata-synthetic-jwt-secret-2026';
const fixturePrefix = `qa-meta-${Date.now().toString(36)}`;
const ids = ['web3', `${fixturePrefix}-l1`, `${fixturePrefix}-c1`, `${fixturePrefix}-ls1`];
const actorIds = [randomUUID(), randomUUID(), randomUUID()];
const results = [];
const children = [];
let pool;
let baseline;
const createdIds = [];
let scopeCreated = false;
const scopeId = `${fixturePrefix}-scope`;
let apiOutput = '';
let adminOutput = '';

function check(name, assertion) {
	assertion();
	results.push({ name, status: 'PASS' });
	console.log(`PASS ${name}`);
}
function jwt(id, role, expired = false) {
	const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(
		JSON.stringify({
			sub: id,
			role,
			iss: 'api.cryptosharia.id',
			exp: Math.floor(Date.now() / 1000) + (expired ? -3600 : 7200)
		})
	).toString('base64url');
	return `${head}.${body}.${createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;
}
const adminToken = jwt(actorIds[0], 'admin');
const memberToken = jwt(actorIds[1], 'member');
const managerToken = jwt(actorIds[2], 'posts_manager');

async function request(
	path,
	{ method = 'GET', token = adminToken, body, origin = adminOrigin, direct = false } = {}
) {
	const headers = { accept: 'application/json' };
	if (direct) {
		headers['api-key'] = key;
		if (token) headers.authorization = `Bearer ${token}`;
	} else if (token) headers.cookie = `access_token=${token}`;
	if (method !== 'GET') headers.origin = origin;
	if (body !== undefined) headers['content-type'] = 'application/json';
	const res = await fetch(`${direct ? apiOrigin : adminOrigin}${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
		signal: AbortSignal.timeout(20000)
	});
	return { status: res.status, body: await res.json().catch(() => null) };
}
async function ready(url) {
	const deadline = Date.now() + 45000;
	while (Date.now() < deadline) {
		try {
			if ((await fetch(url)).status < 500) return;
		} catch {}
		await new Promise((r) => setTimeout(r, 300));
	}
	throw new Error(`Local server did not start: ${url}`);
}
async function snapshot() {
	return {
		content: (
			await pool.query('SELECT * FROM academy_content WHERE id = ANY($1) ORDER BY id', [ids])
		).rows,
		media: (await pool.query('SELECT * FROM academy_lesson_media WHERE lesson_id = $1', [ids[3]]))
			.rows
	};
}
async function unrelated() {
	const hashes = {};
	for (const table of [
		'academy_content',
		'academy_lesson_media',
		'academy_scopes',
		'academy_grants',
		'academy_progress',
		'academy_completions'
	]) {
		const exists = await pool.query('SELECT to_regclass($1) AS table', [table]);
		if (!exists.rows[0].table) continue;
		const condition =
			table === 'academy_content'
				? 'WHERE NOT (id = ANY($1))'
				: table === 'academy_lesson_media'
					? 'WHERE NOT (lesson_id = ANY($1))'
					: table === 'academy_scopes'
						? 'WHERE id <> $1'
						: '';
		const params =
			table === 'academy_content' || table === 'academy_lesson_media'
				? [ids]
				: table === 'academy_scopes'
					? [scopeId]
					: [];
		hashes[table] = (
			await pool.query(
				`SELECT md5(coalesce(string_agg(row_to_json(t)::text, '' ORDER BY row_to_json(t)::text), '')) AS hash FROM (SELECT * FROM ${table} ${condition}) t`,
				params
			)
		).rows[0].hash;
	}
	return hashes;
}
try {
	await mkdir(evidence, { recursive: true });
	for (const dir of [root, apiRoot]) {
		assert.ok(
			!(await readdir(dir)).some((name) => name.startsWith('.env') && name !== '.env.example'),
			'Refuse environment files; use a clean worktree'
		);
	}
	const neonArgs = ['-y', 'neonctl@latest'];
	const neon = (args) =>
		execFileSync(
			'npx',
			[...neonArgs, ...args, '--project-id', project, '--org-id', 'org-misty-queen-98932217'],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
		);
	const branches = JSON.parse(neon(['branches', 'list', '--output', 'json']));
	const qaBranch = branches.find((item) => item.id === branchId && item.name === branch);
	assert.ok(qaBranch && !qaBranch.primary && !qaBranch.default, 'QA branch identity must match');
	const dbUrl = neon(['connection-string', branchId]).trim();
	const parsed = new URL(dbUrl);
	assert.ok(
		parsed.hostname.startsWith('ep-purple-pond-') && !parsed.hostname.includes('falling-rice'),
		'QA endpoint only'
	);
	parsed.searchParams.set('sslmode', 'verify-full');
	pool = new pg.Pool({ connectionString: parsed.href });
	check('QA identity verified; no production connection', () =>
		assert.equal(qaBranch.id, branchId)
	);
	assert.equal(
		(await pool.query('SELECT id FROM academy_content WHERE id = ANY($1)', [ids])).rowCount,
		0,
		'Fixture collision; refuse to alter existing records'
	);
	baseline = await unrelated();
	for (const [i, role] of ['admin', 'member', 'posts_manager'].entries()) {
		await pool.query('INSERT INTO users (id,name,email,role,status) VALUES ($1,$2,$3,$4,$5)', [
			actorIds[i],
			`Synthetic QA ${role}`,
			`${fixturePrefix}-${role}@example.invalid`,
			role,
			'active'
		]);
	}
	const cleanEnv = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR };
	const api = spawn('bun', ['src/main.ts'], {
		cwd: apiRoot,
		env: {
			...cleanEnv,
			NODE_ENV: 'test',
			DATABASE_URL: parsed.href,
			PORT: '3467',
			SERVERLESS: 'false',
			API_KEY: key,
			ACCESS_TOKEN_SECRET: secret,
			OTP_SECRET: 'synthetic-otp-unused',
			RESEND_API_KEY: 're_synthetic_unused',
			RESEND_FROM: 'qa@example.invalid',
			RESEND_REPLY_TO: 'qa@example.invalid',
			CONTACT_FORM_TO_EMAIL: 'qa@example.invalid',
			BLOB_READ_WRITE_TOKEN: 'synthetic-unused',
			VERCEL_BLOB_BASE_URL: 'https://example.invalid',
			IMGBB_API_KEY: 'unused',
			CMC_API_KEY: 'unused'
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});
	children.push(api);
	api.stdout.on('data', (d) => {
		apiOutput += d;
	});
	api.stderr.on('data', (d) => {
		apiOutput += d;
	});
	await ready(`${apiOrigin}/health`);
	const admin = spawn(
		'node',
		['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187', '--strictPort'],
		{
			cwd: root,
			env: { ...cleanEnv, PUBLIC_CS_API_URL: apiOrigin, CS_API_KEY: key },
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);
	children.push(admin);
	admin.stdout.on('data', (d) => {
		adminOutput += d;
	});
	admin.stderr.on('data', (d) => {
		adminOutput += d;
	});
	await ready(`${adminOrigin}/login`);
	const path = '/api/academy/admin/content';
	let res = await request('/api/academy/admin/scopes', {
		method: 'POST',
		body: { id: scopeId, name: 'Synthetic QA scope' }
	});
	assert.equal(res.status, 201, JSON.stringify(res.body));
	scopeCreated = true;
	const rootOrder = Number(
		(
			await pool.query(
				'SELECT coalesce(max("order"), 0) + 1 AS next FROM academy_content WHERE parent_id=\'root\''
			)
		).rows[0].next
	);
	for (const [i, kind] of ['subject', 'level', 'chapter', 'lesson'].entries()) {
		const titles = [
			'Analisis Fundamental Crypto Asset · QA Sintetis',
			'Analisis Fundamental Crypto Asset',
			'Bab 1: Pengantar Crypto & Blockchain',
			'Pelajaran 1: Crypto Basics & Asset Value'
		];
		res = await request(path, {
			method: 'POST',
			body: {
				id: ids[i],
				kind,
				parentId: i === 0 ? 'root' : ids[i - 1],
				subjectId: 'web3',
				level: 1,
				chapterNumber: 1,
				order: i === 0 ? rootOrder : 0,
				title: titles[i],
				description: 'Data sintetis untuk audit metadata',
				scopeId,
				durationSeconds: i === 3 ? 900 : 0,
				instructor: 'Tim QA',
				syariahRequired: true
			}
		});
		assert.equal(res.status, 201, JSON.stringify(res.body));
		createdIds.push(ids[i]);
	}
	res = await request(`${path}/${ids[3]}/media`, {
		method: 'PUT',
		body: {
			videoId: 'abcdefghijk',
			readingRefs: ['https://example.invalid/reading'],
			slideRefs: ['qa/slides'],
			subtitleRefs: ['qa/subtitles'],
			attachmentRefs: ['qa/attachment']
		}
	});
	assert.equal(res.status, 200, JSON.stringify(res.body));
	const initial = await snapshot();
	await writeFile(resolve(evidence, 'qa-before.json'), JSON.stringify(initial, null, 2));
	check('Synthetic four-tier hierarchy with private video and references created', () =>
		assert.equal(initial.content.length, 4)
	);

	for (const [name, options, expected] of [
		['unauthenticated', { token: null }, 401],
		['member', { token: memberToken }, 403],
		['posts_manager', { token: managerToken }, 403],
		['expired token', { token: jwt(actorIds[0], 'admin', true) }, 401],
		['cross-origin', { origin: 'https://example.invalid' }, 403]
	]) {
		res = await request(`${path}/${ids[1]}`, {
			method: 'PUT',
			body: { title: 'Must not persist' },
			...options
		});
		check(`BFF denies ${name} metadata update`, () => assert.equal(res.status, expected));
	}
	res = await request(`/academy/admin/content/${ids[1]}`, {
		direct: true,
		method: 'PUT',
		token: managerToken,
		body: { title: 'Denied' }
	});
	check('Backend independently denies role without academy.manage', () =>
		assert.equal(res.status, 403)
	);
	res = await request(`${path}/${ids[1]}`, { method: 'PUT', body: { title: ' ' } });
	check('Invalid metadata is rejected', () => assert.equal(res.status, 400));
	res = await request(`${path}/missing-${fixturePrefix}`, {
		method: 'PUT',
		body: { title: 'Missing node' }
	});
	check('Missing node returns 404', () => assert.equal(res.status, 404));

	// Exercise all kinds and forbidden structural/editorial fields using the existing contract.
	for (const id of ids) {
		const old = initial.content.find((item) => item.id === id);
		res = await request(`${path}/${id}`, {
			method: 'PUT',
			body: {
				title: `${old.title} · metadata QA`,
				description: 'Deskripsi diperbarui melalui endpoint existing',
				id: 'changed',
				parentId: 'changed',
				subjectId: 'technical',
				kind: 'lesson',
				status: 'published',
				version: 99,
				reviewedBy: actorIds[0]
			}
		});
		check(`${old.kind} editable by academy.manage with stable identity and draft state`, () => {
			assert.equal(res.status, 200, JSON.stringify(res.body));
			for (const [key, value] of Object.entries({
				id,
				parentId: old.parent_id,
				kind: old.kind,
				subjectId: old.subject_id,
				status: 'draft',
				version: 1
			}))
				assert.equal(res.body[key], value);
		});
		// Restore only synthetic names so the browser reproduces the user's exact rename case.
		assert.equal(
			(
				await request(`${path}/${id}`, {
					method: 'PUT',
					body: { title: old.title, description: old.description }
				})
			).status,
			200
		);
	}
	for (const targetStatus of ['approved', 'published']) {
		res = await request(`${path}/${ids[3]}/transition`, { method: 'POST', body: { targetStatus } });
		check(`Editorial guard rejects draft -> ${targetStatus}`, () =>
			assert.ok(res.status >= 400 && res.status < 500)
		);
	}
	const stable = ({ updated_at, updated_by, title, description, ...item }) => item;
	let after = await snapshot();
	check('All IDs, parents, security/editorial fields and media preserved in PostgreSQL', () => {
		assert.deepEqual(after.content.map(stable), initial.content.map(stable));
		assert.deepEqual(after.media, initial.media);
	});
	let hashes = await unrelated();
	check('Unrelated QA Academy records unchanged', () => assert.deepEqual(baseline, hashes));

	// Metadata updates must also preserve review/publish decisions in each existing state.
	for (const targetStatus of ['review', 'approved', 'published', 'archived', 'draft']) {
		res = await request(`${path}/${ids[3]}/transition`, {
			method: 'POST',
			body: { targetStatus, rightsConfirmed: true }
		});
		assert.equal(res.status, 200, JSON.stringify(res.body));
		const beforeState = (await snapshot()).content.find((item) => item.id === ids[3]);
		res = await request(`${path}/${ids[3]}`, {
			method: 'PUT',
			body: { description: `Metadata in ${targetStatus}` }
		});
		assert.equal(res.status, 200);
		const afterState = (await snapshot()).content.find((item) => item.id === ids[3]);
		check(
			`Metadata save preserves ${targetStatus} status, version and review/publication audit`,
			() => assert.deepEqual(stable(afterState), stable(beforeState))
		);
	}
	// New draft fixture for the browser: do not change production or unrelated QA rows.
	await request(`${path}/${ids[3]}`, {
		method: 'PUT',
		body: { description: initial.content.find((item) => item.id === ids[3]).description }
	});
	const browserBaseline = await snapshot();
	await writeFile(
		resolve(evidence, 'qa-browser-before.json'),
		JSON.stringify(browserBaseline, null, 2)
	);
	if (process.argv.includes('--hold')) {
		await writeFile(
			resolve(evidence, 'qa-browser-session.json'),
			JSON.stringify({
				origin: adminOrigin,
				token: adminToken,
				ids,
				scopeId,
				fixturePrefix,
				url: `${adminOrigin}/academy/courses?subjectId=web3&select=${ids[1]}`
			}),
			{ mode: 0o600 }
		);
		console.log(
			`READY FOR BROWSER: ${adminOrigin}/academy/courses?subjectId=web3&select=${ids[1]}`
		);
		console.log(
			'Press Enter after browser tests to verify PostgreSQL and remove only this synthetic fixture.'
		);
		const lines = createInterface({ input: process.stdin, output: process.stdout });
		await new Promise((done) =>
			lines.once('line', () => {
				lines.close();
				done();
			})
		);
		after = await snapshot();
		check('Browser saved exact syllabus Level name in QA PostgreSQL', () => {
			assert.equal(
				after.content.find((item) => item.id === ids[1]).title,
				'FOUNDATION: DASAR-DASAR CRYPTO & NILAI ASET'
			);
		});
		check(
			'Browser updates preserve full hierarchy, scopes, review audit, versions and video references',
			() => {
				assert.deepEqual(after.content.map(stable), browserBaseline.content.map(stable));
				assert.deepEqual(after.media, browserBaseline.media);
			}
		);
		hashes = await unrelated();
		check('Unrelated Academy QA records unchanged after browser tests', () =>
			assert.deepEqual(baseline, hashes)
		);
		await writeFile(resolve(evidence, 'qa-browser-after.json'), JSON.stringify(after, null, 2));
	}
} catch (error) {
	results.push({ name: error.message, status: 'FAIL' });
	process.exitCode = 1;
	console.error(`FAIL ${error.message}`);
} finally {
	for (const child of children.reverse()) child.kill('SIGTERM');
	if (pool) {
		if (createdIds.length) {
			await pool.query('DELETE FROM academy_lesson_media WHERE lesson_id = $1', [ids[3]]);
			await pool.query('DELETE FROM academy_content WHERE id = ANY($1) AND created_by = $2', [
				createdIds,
				actorIds[0]
			]);
		}
		if (scopeCreated)
			await pool.query('DELETE FROM academy_scopes WHERE id = $1 AND created_by = $2', [
				scopeId,
				actorIds[0]
			]);
		await pool.query('DELETE FROM users WHERE id = ANY($1) AND email LIKE $2', [
			actorIds,
			`${fixturePrefix}-%@example.invalid`
		]);
		const remaining = (
			await pool.query('SELECT id FROM academy_content WHERE id = ANY($1) AND created_by = $2', [
				createdIds,
				actorIds[0]
			])
		).rowCount;
		check('Synthetic fixture cleanup completed', () => assert.equal(remaining, 0));
		await pool.end();
	}
	await rm(resolve(evidence, 'qa-browser-session.json'), { force: true });
	await writeFile(
		resolve(evidence, 'qa-results.json'),
		JSON.stringify({ branch, branchId, fixturePrefix, results }, null, 2)
	);
}
