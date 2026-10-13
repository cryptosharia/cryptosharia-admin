import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unflatten, parse } from 'devalue';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = process.argv.includes('--baseline');
const preview = process.argv.includes('--preview');
const evidence = process.env.P01_EVIDENCE_DIR
	? resolve(process.env.P01_EVIDENCE_DIR)
	: await mkdtemp(join(tmpdir(), 'p01-admin-evidence-'));
const rel = relative(root, evidence);
assert.ok(
	rel.startsWith('..') || isAbsolute(rel),
	'Evidence must be outside the source repository'
);
assert.ok(
	!(await readdir(root)).some((name) => name.startsWith('.env') && name !== '.env.example'),
	'Tests refuse environment files; use a clean worktree with synthetic process env'
);
if (!process.env.P01_PLAYWRIGHT_MODULE) {
	throw new Error('Set P01_PLAYWRIGHT_MODULE to an installed Playwright index.mjs');
}
const { chromium } = await import(pathToFileURL(process.env.P01_PLAYWRIGHT_MODULE).href);
const key = 'p01-synthetic-shared-key';
const refresh = 'p01-synthetic-refresh-credential';
const extra = 'p01-synthetic-future-session-secret';
const id = '10000000-0000-4000-8000-000000000001';
function token(role, expired = false) {
	return [
		Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
		Buffer.from(
			JSON.stringify({ sub: id, role, exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600) })
		).toString('base64url'),
		'p01-synthetic-signature'
	].join('.');
}
const adminToken = token('admin');
const expiredToken = token('admin', true);
const roleTokens = new Map(
	['super_admin', 'admin', 'posts_manager', 'cryptoassets_manager', 'member'].map((role) => [
		role === 'admin' ? adminToken : token(role),
		role
	])
);
const secrets = [key, refresh, extra, expiredToken, ...roleTokens.keys()];
const forbidden = ['accessToken', 'refreshToken', 'apiKey', 'sessionSecret', 'authorization'];
const publicKeys = ['email', 'id', 'name', 'permissions', 'role'];
const calls = [];
const results = [];
let failPatch = false;
let failMeOnce = false;
let failRefresh = false;
let browser;
let child;
let serverOutput = '';
let blockedBrowserRequests = 0;
const pendingResponses = [];
const pageErrors = [];
const consoleErrors = [];
const mock = createServer(async (req, res) => {
	let body = '';
	for await (const chunk of req) body += chunk;
	const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
	const role = roleTokens.get(req.headers.authorization?.replace(/^Bearer /, ''));
	const apiKeyMatched = req.headers['api-key'] === key;
	calls.push({ method: req.method, path: pathname, apiKeyMatched, bearerMatched: Boolean(role) });
	const json = (status, data) => {
		res.writeHead(status, { 'content-type': 'application/json', 'total-items': '1' });
		res.end(JSON.stringify(data));
	};
	if (!apiKeyMatched)
		return json(401, { error: 'UNAUTHORIZED', message: 'Synthetic key required' });
	if (pathname === '/auth/otp/request') {
		res.writeHead(204);
		return res.end();
	}
	if (pathname === '/auth/otp/verify') {
		const data = JSON.parse(body);
		if (data.code !== '123456')
			return json(401, { error: 'UNAUTHORIZED', message: 'Invalid code' });
		const accessToken =
			data.email === 'member@p01.invalid'
				? [...roleTokens].find(([, value]) => value === 'member')[0]
				: adminToken;
		return json(200, { accessToken, refreshToken: refresh });
	}
	if (pathname === '/auth/refresh') {
		if (failRefresh || JSON.parse(body).refreshToken !== refresh) {
			return json(401, { error: 'UNAUTHORIZED', message: 'Invalid synthetic refresh' });
		}
		return json(200, { accessToken: adminToken });
	}
	if (pathname === '/auth/signout') {
		assert.equal(JSON.parse(body).refreshToken, refresh, 'Server delegates the expected refresh');
		res.writeHead(204);
		return res.end();
	}
	if (!role || failMeOnce) {
		failMeOnce = false;
		return json(401, { error: 'UNAUTHORIZED', message: 'Synthetic bearer required' });
	}
	const user = {
		id,
		name: 'Synthetic Admin',
		email: 'admin@p01.invalid',
		role,
		status: 'active',
		createdAt: '2026-10-12T00:00:00Z',
		lastLoginAt: null,
		avatar: null
	};
	if (pathname === '/auth/me') {
		// Deliberate future fields must never propagate through locals/load to the browser.
		return json(200, {
			...user,
			accessToken: adminToken,
			refreshToken: refresh,
			apiKey: key,
			sessionSecret: extra
		});
	}
	if (pathname === `/users/${id}` && req.method === 'PATCH') {
		return failPatch
			? json(400, { error: 'VALIDATION_FAILED', message: 'Synthetic update rejected' })
			: json(200, user);
	}
	if (pathname === `/users/${id}`) return json(200, user);
	if (pathname === '/users') return json(200, [user]);
	if (pathname === '/imgbb') return json(200, { url: '/logo.png' });
	return json(200, []);
});

function safePayload(text, label) {
	assert.ok(
		!secrets.some((secret) => text.includes(secret)),
		`${label}: synthetic credential value absent`
	);
	assert.ok(
		!forbidden.some((name) => text.includes(`"${name}"`)),
		`${label}: credential field absent`
	);
}
function record(name, fn) {
	return Promise.resolve()
		.then(fn)
		.then(() => {
			results.push({ name, status: 'PASS' });
			console.log(`PASS ${name}`);
		});
}
function redacted(text) {
	for (const secret of secrets) text = text.replaceAll(secret, '[REDACTED SYNTHETIC VALUE]');
	return text;
}
const listen = (server) => new Promise((done) => server.listen(0, '127.0.0.1', done));
try {
	await listen(mock);
	const apiOrigin = `http://127.0.0.1:${mock.address().port}`;
	const reserve = createServer();
	await listen(reserve);
	const port = reserve.address().port;
	await new Promise((done) => reserve.close(done));
	const origin = `http://127.0.0.1:${port}`;
	const childEnv = {};
	for (const name of [
		'PATH',
		'Path',
		'SystemRoot',
		'SYSTEMROOT',
		'WINDIR',
		'TEMP',
		'TMP',
		'USERPROFILE'
	]) {
		if (process.env[name]) childEnv[name] = process.env[name];
	}
	Object.assign(childEnv, {
		NODE_ENV: preview ? 'production' : 'development',
		PUBLIC_CS_API_URL: apiOrigin,
		CS_API_KEY: key,
		P01_ALLOWED_ORIGINS: JSON.stringify([origin, apiOrigin])
	});
	child = spawn(
		process.execPath,
		[
			'--require',
			join(root, 'tests', 'loopback-only.cjs'),
			join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
			preview ? 'preview' : 'dev',
			'--host',
			'127.0.0.1',
			'--port',
			String(port),
			'--strictPort'
		],
		{ cwd: root, env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
	);
	child.stdout.on('data', (chunk) => {
		serverOutput += chunk.toString();
	});
	child.stderr.on('data', (chunk) => {
		serverOutput += chunk.toString();
	});
	let ready = false;
	for (let attempt = 0; attempt < 120; attempt++) {
		if (child.exitCode !== null) throw new Error('Isolated Admin server exited before ready');
		try {
			const res = await fetch(`${origin}/login`, { signal: AbortSignal.timeout(3000) });
			ready = res.ok;
		} catch {
			/* Wait for local compilation only. */
		}
		if (ready) break;
		await delay(500);
	}
	assert.ok(ready, 'Local Admin server is ready');
	browser = await chromium.launch({ headless: true });
	async function context(access, refreshValue) {
		const ctx = await browser.newContext();
		await ctx.route('**/*', (route) => {
			if (new URL(route.request().url()).origin === origin) return route.continue();
			blockedBrowserRequests++;
			return route.abort();
		});
		const cookies = [];
		if (access) cookies.push({ name: 'access_token', value: access });
		if (refreshValue) cookies.push({ name: 'refresh_token', value: refreshValue });
		await ctx.addCookies(
			cookies.map((cookie) => ({ ...cookie, url: origin, httpOnly: true, sameSite: 'Strict' }))
		);
		return ctx;
	}
	const admin = await context(adminToken, refresh);
	if (baseline) {
		for (const path of ['/dashboard', '/settings']) {
			const res = await admin.request.get(`${origin}${path}`);
			assert.equal(res.status(), 200);
			const body = await res.text();
			assert.ok(body.includes(adminToken), 'Baseline reproduces own-browser bearer disclosure');
			results.push({
				name: `Baseline ${path} SSR contains synthetic access bearer`,
				status: 'REPRODUCED'
			});
		}
	} else {
		await record('SSR dashboard and settings exclude credential values and fields', async () => {
			for (const path of ['/dashboard', '/settings']) {
				const res = await admin.request.get(`${origin}${path}`);
				assert.equal(res.status(), 200);
				assert.equal(res.headers()['cache-control'], 'private,no-store');
				safePayload(await res.text(), path);
			}
		});
		await record('SvelteKit page data has exactly the public DTO in BOTH sinks', async () => {
			const res = await admin.request.get(`${origin}/settings/__data.json`);
			assert.equal(res.status(), 200);
			assert.equal(res.headers()['cache-control'], 'private,no-store');
			const text = await res.text();
			safePayload(text, 'settings data');
			const data = JSON.parse(text.split('\n')[0]);
			const users = data.nodes
				.filter((node) => node?.type === 'data')
				.map((node) => unflatten(node.data).user)
				.filter(Boolean);
			assert.equal(users.length, 2, 'Layout and settings each return their safe DTO');
			for (const user of users) assert.deepEqual(Object.keys(user).sort(), publicKeys);
		});
		await record('Authenticated server load keeps bearer AND private API key', async () => {
			assert.ok(
				calls.some((call) => call.path === '/users' && call.bearerMatched && call.apiKeyMatched)
			);
		});
		const actionHeaders = { origin, accept: 'application/json', 'x-sveltekit-action': 'true' };
		await record(
			'Authenticated API-backed form action success and failure are credential-free',
			async () => {
				for (const failing of [false, true]) {
					failPatch = failing;
					const res = await admin.request.post(`${origin}/users/${id}?/update`, {
						form: { name: 'Synthetic updated user' },
						headers: actionHeaders
					});
					const text = await res.text();
					safePayload(text, 'user action');
					const action = JSON.parse(text);
					assert.equal(action.type, failing ? 'failure' : 'success');
					assert.equal(action.status, failing ? 400 : 200);
					if (!failing) assert.equal(parse(action.data).success, true);
					assert.equal(res.headers()['cache-control'], 'private,no-store');
				}
				failPatch = false;
				assert.ok(
					calls.some((call) => call.method === 'PATCH' && call.bearerMatched && call.apiKeyMatched)
				);
			}
		);
		await record(
			'Settings success and unsupported-auth form failures do not serialize locals',
			async () => {
				for (const name of ['update', 'changePassword', 'enable2FA', 'disable2FA']) {
					const res = await admin.request.post(`${origin}/settings?/${name}`, {
						form: {},
						headers: actionHeaders
					});
					const text = await res.text();
					safePayload(text, 'settings action');
					assert.equal(
						JSON.parse(text).status,
						name === 'update' ? 200 : name === 'changePassword' ? 410 : 501
					);
				}
			}
		);
		await record(
			'Invalid OTP and non-admin OTP login failures do not expose issued credentials',
			async () => {
				const guest = await context();
				for (const [email, code, status] of [
					['admin@p01.invalid', '000000', 401],
					['member@p01.invalid', '123456', 403]
				]) {
					const res = await guest.request.post(`${origin}/login?/verifyOtp`, {
						form: { email, code },
						headers: actionHeaders
					});
					const text = await res.text();
					safePayload(text, 'failed OTP login');
					assert.equal(JSON.parse(text).status, status);
					assert.ok(
						!(await guest.cookies()).some((cookie) =>
							['access_token', 'refresh_token'].includes(cookie.name)
						)
					);
				}
				await guest.close();
			}
		);
		await record(
			'Authenticated framework error responses are no-store and credential-free',
			async () => {
				const res = await admin.request.get(`${origin}/p01-missing-route`);
				assert.equal(res.status(), 404);
				assert.equal(res.headers()['cache-control'], 'private,no-store');
				safePayload(await res.text(), 'authenticated error');
			}
		);
		await record('Guest is redirected and non-admin is rejected before a mutation', async () => {
			const guest = await context();
			const res = await guest.request.get(`${origin}/settings`, { maxRedirects: 0 });
			assert.equal(res.status(), 303);
			assert.equal(res.headers().location, '/login');
			const memberToken = [...roleTokens].find(([, role]) => role === 'member')[0];
			const member = await context(memberToken);
			const before = calls.filter((call) => call.method === 'PATCH').length;
			const denied = await member.request.post(`${origin}/users/${id}?/update`, {
				form: { role: 'admin' },
				headers: actionHeaders,
				maxRedirects: 0
			});
			// Enhanced form redirects use HTTP 200 with an explicit redirect action result.
			assert.equal(denied.status(), 200);
			const deniedText = await denied.text();
			safePayload(deniedText, 'denied member action');
			assert.deepEqual(JSON.parse(deniedText), {
				type: 'redirect',
				status: 303,
				location: '/login?pending=true'
			});
			assert.equal(calls.filter((call) => call.method === 'PATCH').length, before);
			await guest.close();
			await member.close();
		});
		await record('All four existing administrative roles retain app admission', async () => {
			for (const [access, role] of roleTokens) {
				if (role === 'member') continue;
				const ctx = await context(access);
				const res = await ctx.request.get(`${origin}/settings`);
				assert.equal(res.status(), 200);
				safePayload(await res.text(), 'role SSR');
				await ctx.close();
			}
		});
		await record('Expiry refresh and auth/me retry remain server-only', async () => {
			for (const expired of [true, false]) {
				const ctx = await context(expired ? expiredToken : adminToken, refresh);
				failMeOnce = !expired;
				const before = calls.filter((call) => call.path === '/auth/refresh').length;
				const res = await ctx.request.get(`${origin}/settings/__data.json`);
				assert.equal(res.status(), 200);
				safePayload(await res.text(), 'refreshed data');
				assert.equal(calls.filter((call) => call.path === '/auth/refresh').length, before + 1);
				const cookie = (await ctx.cookies()).find((cookie) => cookie.name === 'access_token');
				assert.ok(cookie.httpOnly && cookie.sameSite === 'Strict');
				await ctx.close();
			}
		});
		await record(
			'Failed refresh clears current cookies and returns login without page credentials',
			async () => {
				failRefresh = true;
				const ctx = await context(expiredToken, refresh);
				const res = await ctx.request.get(`${origin}/settings`, { maxRedirects: 0 });
				assert.equal(res.status(), 303);
				assert.equal(res.headers().location, '/login');
				safePayload(await res.text(), 'failed refresh');
				assert.ok(
					!(await ctx.cookies()).some((cookie) =>
						['access_token', 'refresh_token'].includes(cookie.name)
					)
				);
				failRefresh = false;
				await ctx.close();
			}
		);
		const ui = await context();
		const page = await ui.newPage();
		page.on('pageerror', (error) => pageErrors.push(redacted(error.message)));
		page.on('console', (message) => {
			if (message.type() === 'error') consoleErrors.push(redacted(message.text()));
		});
		page.on('response', (response) => {
			if (new URL(response.url()).origin !== origin) return;
			pendingResponses.push(
				response
					.text()
					.then((text) => safePayload(text, 'browser response'))
					.catch((error) => {
						if (
							error.message.includes('synthetic credential') ||
							error.message.includes('credential field')
						)
							throw error;
					})
			);
		});
		await record(
			'Real browser OTP login, hydration and client navigation preserve auth',
			async () => {
				await page.goto(`${origin}/login`);
				await page.locator('#email').fill('admin@p01.invalid');
				await page.getByRole('button', { name: 'Kirim kode OTP' }).click();
				await page.locator('#code').fill('123456');
				await page.getByRole('button', { name: 'Verifikasi dan masuk' }).click();
				await page.waitForURL(`${origin}/dashboard`);
				await page.getByRole('heading', { name: 'System Overview', exact: true }).waitFor();
				safePayload(await page.content(), 'hydrated HTML');
				safePayload(await page.evaluate(() => document.cookie), 'browser JS cookies');
				await page.getByRole('link', { name: 'Users', exact: true }).click();
				await page.waitForURL(`${origin}/users`);
				assert.ok(await page.getByText('Synthetic Admin', { exact: true }).count());
				assert.ok(pendingResponses.length > 0);
			}
		);
		await record(
			'Internal server endpoint forwards server credentials without returning them',
			async () => {
				const res = await admin.request.post(`${origin}/api/imgbb`, {
					multipart: {
						image: {
							name: 'synthetic.png',
							mimeType: 'image/png',
							buffer: Buffer.from('synthetic image')
						}
					},
					headers: { origin }
				});
				assert.equal(res.status(), 200);
				safePayload(await res.text(), 'internal endpoint');
				assert.equal((await res.json()).success, true);
				assert.ok(
					calls.some((call) => call.path === '/imgbb' && call.bearerMatched && call.apiKeyMatched)
				);
			}
		);
		await record(
			'Logout delegates signout, deletes all auth cookies and returns guest login',
			async () => {
				const before = calls.filter((call) => call.path === '/auth/signout').length;
				await page.getByRole('button', { name: 'Logout', exact: true }).click();
				await page.waitForURL(`${origin}/login`);
				assert.equal(calls.filter((call) => call.path === '/auth/signout').length, before + 1);
				assert.ok(
					!(await ui.cookies()).some((cookie) =>
						['access_token', 'refresh_token', 'user_session'].includes(cookie.name)
					)
				);
				await ui.close();
			}
		);
		await record('No credential values in captured browser responses or server logs', async () => {
			await Promise.all(pendingResponses);
			safePayload(serverOutput, 'server logs');
			assert.deepEqual(pageErrors, []);
		});
	}
	await admin.close();
	await writeFile(
		join(
			evidence,
			baseline
				? 'baseline-serialization.json'
				: preview
					? 'preview-serialization.json'
					: 'security-serialization.json'
		),
		JSON.stringify(
			{
				mode: baseline ? 'BASELINE REPRODUCTION' : preview ? 'BUILT LOCAL PREVIEW' : 'LOCAL DEV',
				result: 'PASS',
				api: 'Loopback synthetic mock only; no backend changes',
				credentials: 'Synthetic only; values omitted',
				results,
				calls,
				blockedBrowserRequests,
				pageErrors,
				consoleErrors
			},
			null,
			2
		) + '\n'
	);
} catch (error) {
	console.error(redacted(error.stack || String(error)));
	await writeFile(
		join(evidence, 'security-failure.json'),
		JSON.stringify(
			{ result: 'FAIL', results, error: redacted(error.message), pageErrors, consoleErrors },
			null,
			2
		) + '\n'
	);
	process.exitCode = 1;
} finally {
	await browser?.close();
	child?.kill();
	await new Promise((done) => mock.close(done));
	await writeFile(
		join(
			evidence,
			baseline ? 'baseline-server.log' : preview ? 'preview-server.log' : 'security-server.log'
		),
		redacted(serverOutput)
	);
}
