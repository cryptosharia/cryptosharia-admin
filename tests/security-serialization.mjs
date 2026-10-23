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
const loginPassword = 'Synthetic browser password 2026!';
const resetPassword = 'Synthetic reset password 2026!';
const resetToken = 'A'.repeat(43);
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
const secrets = [
	key,
	refresh,
	extra,
	loginPassword,
	resetPassword,
	expiredToken,
	...roleTokens.keys()
];
const forbidden = ['accessToken', 'refreshToken', 'apiKey', 'sessionSecret', 'authorization'];
const publicKeys = ['email', 'id', 'name', 'permissions', 'role'];
const cryptoasset = {
	id: '20000000-0000-4000-8000-000000000002',
	name: 'Synthetic Token',
	ticker: 'SYN',
	slug: 'synthetic-token',
	status: 'draft',
	shariaStatus: 'halal',
	website: 'https://token.p01.invalid',
	tradingviewSymbol: null,
	excerpt: 'Synthetic token fixture',
	content: '# Synthetic token',
	logo: null,
	tags: [],
	updatedAt: '2026-10-13T00:00:00.000Z'
};
const uploadedAsset = {
	id: '30000000-0000-4000-8000-000000000003',
	pathname: 'synthetic.png',
	filename: 'synthetic.png',
	size: 15,
	mimeType: 'image/png',
	width: 1,
	height: 1,
	provider: 'vercel_blob',
	createdAt: '2026-10-13T00:00:00.000Z',
	createdBy: id
};
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
	calls.push({
		method: req.method,
		path: pathname,
		role: role ?? null,
		apiKeyMatched,
		bearerMatched: Boolean(role)
	});
	const json = (status, data) => {
		res.writeHead(status, { 'content-type': 'application/json', 'total-items': '1' });
		res.end(JSON.stringify(data));
	};
	if (!apiKeyMatched)
		return json(401, { error: 'UNAUTHORIZED', message: 'Synthetic key required' });
	if (pathname === '/auth/password/login') {
		const data = JSON.parse(body);
		if (![loginPassword, resetPassword].includes(data.password))
			return json(401, { error: 'PASSWORD_INVALID', message: 'Invalid synthetic password' });
		const accessToken =
			data.email === 'member@p01.invalid'
				? [...roleTokens].find(([, value]) => value === 'member')[0]
				: adminToken;
		return json(200, { accessToken, refreshToken: refresh });
	}
	if (pathname === '/auth/password/forgot') {
		res.writeHead(204);
		return res.end();
	}
	if (pathname === '/auth/password/reset') {
		const data = JSON.parse(body);
		if (data.token !== resetToken || data.newPassword !== resetPassword)
			return json(400, { error: 'PASSWORD_RESET_INVALID' });
		res.writeHead(204);
		return res.end();
	}
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
	if (pathname === '/tags' && req.method === 'GET') return json(200, []);
	if (pathname === '/assets' && req.method === 'POST') return json(201, uploadedAsset);
	if (pathname === '/cryptoassets' && req.method === 'GET') return json(200, [cryptoasset]);
	if (pathname === '/cryptoassets' && req.method === 'POST') return json(201, cryptoasset);
	if (pathname === '/cryptoassets/synthetic-token' && req.method === 'GET')
		return json(200, cryptoasset);
	if (pathname === `/cryptoassets/${cryptoasset.id}` && req.method === 'PATCH')
		return json(200, cryptoasset);
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
		.then((outcome) => {
			const status = outcome?.status === 'FAIL' ? 'FAIL' : 'PASS';
			results.push({
				name,
				status,
				...(outcome?.findings ? { findings: outcome.findings } : {}),
				...(outcome?.evidence ? { evidence: outcome.evidence } : {})
			});
			if (status === 'FAIL') process.exitCode = 1;
			console.log(`${status} ${name}`);
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
		await record(
			'Main token listing, detail and creation routes preserve the role guard',
			async () => {
				const tokenPaths = ['/tokens', '/tokens/synthetic-token', '/tokens/new'];
				const deniedActionEvidence = [];
				const malformedActionEvidence = [];
				for (const role of ['super_admin', 'admin', 'cryptoassets_manager']) {
					const access = [...roleTokens].find(([, candidateRole]) => candidateRole === role)?.[0];
					assert.ok(access, `Synthetic token for ${role} exists`);
					const ctx = await context(access, refresh);
					for (const path of tokenPaths) {
						const res = await ctx.request.get(`${origin}${path}`);
						assert.equal(res.status(), 200, `${role} can load ${path}`);
						assert.equal(res.headers()['cache-control'], 'private,no-store');
						const text = await res.text();
						safePayload(text, `${role} ${path}`);
						if (path === '/tokens') assert.ok(text.includes('Synthetic Token'));
						if (path === '/tokens/synthetic-token') assert.ok(text.includes('Edit Token'));
						if (path === '/tokens/new') assert.ok(text.includes('Add New Token'));
					}
					assert.ok(
						calls.some(
							(call) =>
								call.path === '/cryptoassets' &&
								call.method === 'GET' &&
								call.role === role &&
								call.apiKeyMatched
						),
						`${role} token listing delegates with server credentials`
					);
					assert.ok(
						calls.some(
							(call) =>
								call.path === '/cryptoassets/synthetic-token' &&
								call.role === role &&
								call.apiKeyMatched
						),
						`${role} token detail delegates with server credentials`
					);
					await ctx.close();
				}

				const deniedIdentities = [
					{
						role: 'posts_manager',
						access: [...roleTokens].find(([, role]) => role === 'posts_manager')?.[0],
						location: null
					},
					{
						role: 'member',
						access: [...roleTokens].find(([, role]) => role === 'member')?.[0],
						location: '/login?pending=true'
					},
					{ role: 'guest', access: undefined, location: '/login' }
				];
				for (const { role, access, location } of deniedIdentities) {
					const ctx = await context(access, access ? refresh : undefined);
					if (role === 'posts_manager') {
						for (const path of tokenPaths) {
							const res = await ctx.request.get(`${origin}${path}`);
							assert.equal(res.status(), 403, `${role} is denied ${path}`);
							const text = await res.text();
							safePayload(text, `denied ${role} ${path}`);
							assert.ok(
								!text.includes('Synthetic Token'),
								`Denied ${path} does not serialize token data`
							);
						}
					}

					for (const actionName of ['update', 'delete']) {
						const path = `/tokens/synthetic-token?/${actionName}`;
						const callStart = calls.length;
						const options = {
							...(actionName === 'update'
								? {
										multipart: {
											id: cryptoasset.id,
											name: cryptoasset.name,
											ticker: cryptoasset.ticker,
											slug: cryptoasset.slug,
											shariaStatus: cryptoasset.shariaStatus,
											status: cryptoasset.status,
											website: cryptoasset.website,
											excerpt: cryptoasset.excerpt,
											content: cryptoasset.content,
											tags: '',
											logoImage: {
												name: 'denied-synthetic.png',
												mimeType: 'image/png',
												buffer: Buffer.from('synthetic denied image')
											}
										}
									}
								: { form: { id: cryptoasset.id } }),
							headers: actionHeaders,
							maxRedirects: 0
						};
						const res = await ctx.request.post(`${origin}${path}`, options);
						const text = await res.text();
						safePayload(text, `denied ${role} ${actionName} action`);
						const action = res.status() === 200 ? JSON.parse(text) : undefined;
						if (role === 'posts_manager') {
							assert.ok(
								res.status() === 403 || (action?.type === 'failure' && action.status === 403),
								`${role} ${actionName} is denied with 403`
							);
						} else {
							assert.ok(
								(res.status() === 200 &&
									action?.type === 'redirect' &&
									action.location === location) ||
									(res.status() === 303 && res.headers().location === location),
								`${role} ${actionName} is redirected to ${location}`
							);
						}
						const delegatedMutations = calls
							.slice(callStart)
							.filter(
								(call) =>
									(call.path.startsWith('/cryptoassets') &&
										['POST', 'PATCH', 'DELETE'].includes(call.method)) ||
									(call.path === '/assets' && call.method === 'POST')
							)
							.map(({ method, path: apiPath }) => ({ method, path: apiPath }));
						assert.deepEqual(
							delegatedMutations,
							[],
							`${role} ${actionName} performs no API mutation or upload`
						);
						deniedActionEvidence.push({
							role,
							action: actionName,
							httpStatus: res.status(),
							resultType: action?.type ?? null,
							resultStatus: action?.status ?? null,
							redirect: action?.location ?? res.headers().location ?? null,
							delegatedMutations
						});

						if (role === 'posts_manager') {
							const malformedStart = calls.length;
							const malformed = await ctx.request.post(`${origin}${path}`, {
								data: 'malformed multipart body',
								headers: {
									...actionHeaders,
									'content-type': 'multipart/form-data; boundary=p01-invalid'
								},
								maxRedirects: 0
							});
							const malformedText = await malformed.text();
							safePayload(malformedText, `malformed denied ${actionName} action`);
							const malformedAction =
								malformed.status() === 200 ? JSON.parse(malformedText) : undefined;
							assert.ok(
								malformed.status() === 403 ||
									(malformedAction?.type === 'failure' && malformedAction.status === 403),
								`${role} ${actionName} is rejected before malformed form parsing`
							);
							assert.deepEqual(
								calls
									.slice(malformedStart)
									.filter(
										(call) =>
											(call.path.startsWith('/cryptoassets') &&
												['POST', 'PATCH', 'DELETE'].includes(call.method)) ||
											(call.path === '/assets' && call.method === 'POST')
									),
								[],
								`${role} malformed ${actionName} performs no API mutation or upload`
							);
							malformedActionEvidence.push({
								role,
								action: actionName,
								httpStatus: malformed.status(),
								resultType: malformedAction?.type ?? null,
								resultStatus: malformedAction?.status ?? null,
								delegatedMutations: []
							});
						}
					}
					await ctx.close();
				}
				return {
					evidence: {
						deniedActions: deniedActionEvidence,
						malformedMultipartDeniedBeforeParsing: malformedActionEvidence
					}
				};
			}
		);
		await record(
			'Main token create and detail actions retain authenticated API delegation',
			async () => {
				const ctx = await context(adminToken, refresh);
				const create = await ctx.request.post(`${origin}/tokens/new?/create`, {
					multipart: {
						name: cryptoasset.name,
						ticker: cryptoasset.ticker,
						slug: cryptoasset.slug,
						shariaStatus: cryptoasset.shariaStatus,
						status: cryptoasset.status,
						website: cryptoasset.website,
						excerpt: cryptoasset.excerpt,
						content: cryptoasset.content,
						tags: '',
						logoImage: {
							name: 'synthetic.png',
							mimeType: 'image/png',
							buffer: Buffer.from('synthetic image')
						}
					},
					headers: { origin },
					maxRedirects: 0
				});
				const createText = await create.text();
				safePayload(createText, 'token create action');
				assert.equal(create.status(), 200);
				assert.deepEqual(JSON.parse(createText), {
					type: 'redirect',
					status: 303,
					location: '/tokens/synthetic-token'
				});
				assert.ok(
					calls.some(
						(call) =>
							call.path === '/assets' &&
							call.method === 'POST' &&
							call.role === 'admin' &&
							call.apiKeyMatched
					),
					'Logo upload is delegated with server credentials'
				);
				assert.ok(
					calls.some(
						(call) =>
							call.path === '/cryptoassets' &&
							call.method === 'POST' &&
							call.role === 'admin' &&
							call.apiKeyMatched
					),
					'Token creation is delegated with server credentials'
				);

				await ctx.close();
				const authorizedActionEvidence = [];
				for (const role of ['super_admin', 'admin', 'cryptoassets_manager']) {
					const access = [...roleTokens].find(([, candidateRole]) => candidateRole === role)?.[0];
					assert.ok(access, `Synthetic token for ${role} exists`);
					const roleContext = await context(access, refresh);
					const update = await roleContext.request.post(
						`${origin}/tokens/synthetic-token?/update`,
						{
							multipart: {
								id: cryptoasset.id,
								name: cryptoasset.name,
								ticker: cryptoasset.ticker,
								slug: cryptoasset.slug,
								shariaStatus: cryptoasset.shariaStatus,
								status: cryptoasset.status,
								website: cryptoasset.website,
								excerpt: cryptoasset.excerpt,
								content: cryptoasset.content,
								tags: '',
								logoImage: {
									name: `${role}-synthetic.png`,
									mimeType: 'image/png',
									buffer: Buffer.from('synthetic allowed image')
								}
							},
							headers: actionHeaders
						}
					);
					assert.equal(update.status(), 200, `${role} update action succeeds`);
					const updateText = await update.text();
					safePayload(updateText, `${role} token update action`);
					assert.equal(JSON.parse(updateText).type, 'success');
					assert.ok(
						calls.some(
							(call) =>
								call.path === '/assets' &&
								call.method === 'POST' &&
								call.role === role &&
								call.apiKeyMatched
						),
						`${role} logo upload is delegated with server credentials`
					);
					assert.ok(
						calls.some(
							(call) =>
								call.path === `/cryptoassets/${cryptoasset.id}` &&
								call.method === 'PATCH' &&
								call.role === role &&
								call.apiKeyMatched
						),
						`${role} token update is delegated with server credentials`
					);
					const remove = await roleContext.request.post(
						`${origin}/tokens/synthetic-token?/delete`,
						{ form: { id: cryptoasset.id }, headers: actionHeaders }
					);
					assert.equal(remove.status(), 200, `${role} delete action succeeds`);
					const removeText = await remove.text();
					safePayload(removeText, `${role} token delete action`);
					assert.deepEqual(JSON.parse(removeText), {
						type: 'redirect',
						status: 303,
						location: '/tokens'
					});
					assert.ok(
						calls.some(
							(call) =>
								call.path === `/cryptoassets/${cryptoasset.id}` &&
								call.method === 'DELETE' &&
								call.role === role &&
								call.apiKeyMatched
						),
						`${role} token deletion is delegated with server credentials`
					);
					authorizedActionEvidence.push({
						role,
						update: { result: 'success', uploadDelegated: true, patchDelegated: true },
						delete: { redirect: '/tokens', deleteDelegated: true }
					});
					await roleContext.close();
				}
				return { evidence: { authorizedActions: authorizedActionEvidence } };
			}
		);
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
				assert.ok(cookie, 'Access cookie survives successful refresh');
				assert.ok(cookie.httpOnly && cookie.sameSite === 'Strict');
				assert.equal(cookie.path, '/');
				assert.equal(cookie.secure, preview);
				const refreshedCookie = (await ctx.cookies()).find(
					(cookie) => cookie.name === 'refresh_token'
				);
				assert.ok(refreshedCookie.httpOnly && refreshedCookie.sameSite === 'Strict');
				assert.equal(refreshedCookie.path, '/');
				assert.equal(refreshedCookie.secure, preview);
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
		const warmDashboard = await admin.newPage();
		await warmDashboard.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
		await warmDashboard.close();
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
			'Password login toggles visibility, rejects credentials and admits only admin roles',
			async () => {
				const guest = await context();
				const guestPage = await guest.newPage();
				await guestPage.goto(`${origin}/login`, { waitUntil: 'networkidle' });
				await guestPage.locator('#password-email').fill('admin@p01.invalid');
				await guestPage.locator('#password').fill('wrong synthetic password');
				await guestPage.getByRole('button', { name: /Masuk/ }).click();
				await guestPage
					.getByRole('alert')
					.filter({ hasText: 'Email atau kata sandi tidak valid.' })
					.waitFor();
				assert.equal((await guest.cookies()).length, 0, 'Failed login sets no session cookies');

				await guestPage.locator('#password-email').fill('member@p01.invalid');
				await guestPage.locator('#password').fill(loginPassword);
				await guestPage.getByRole('button', { name: /Masuk/ }).click();
				await guestPage
					.getByRole('alert')
					.filter({ hasText: 'tidak memiliki akses ke panel admin' })
					.waitFor();
				assert.equal((await guest.cookies()).length, 0, 'Member login sets no Admin session');
				await guest.close();

				await page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
				const passwordInput = page.locator('#password');
				assert.equal(await passwordInput.getAttribute('type'), 'password');
				await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click();
				await page.waitForFunction(
					() => document.querySelector('#password')?.getAttribute('type') === 'text'
				);
				await page.getByRole('button', { name: 'Sembunyikan kata sandi' }).click();
				await page.waitForFunction(
					() => document.querySelector('#password')?.getAttribute('type') === 'password'
				);
				await page.locator('#password-email').fill('admin@p01.invalid');
				await passwordInput.fill(loginPassword);
				await page.getByRole('button', { name: /Masuk/ }).click();
				await page.waitForURL(`${origin}/dashboard`);
				await page.waitForLoadState('networkidle');
				await page.getByRole('heading', { name: 'Dashboard Operasional', exact: true }).waitFor();
				safePayload(await page.content(), 'password-login hydrated HTML');
				safePayload(await page.evaluate(() => document.cookie), 'browser JS cookies');
				const cookies = new Map((await ui.cookies()).map((cookie) => [cookie.name, cookie]));
				for (const name of ['access_token', 'refresh_token', 'user_session']) {
					const cookie = cookies.get(name);
					assert.ok(cookie, `${name} is set after synthetic password login`);
					assert.equal(cookie.httpOnly, true);
					assert.equal(cookie.sameSite, 'Strict');
					assert.equal(cookie.path, '/');
					assert.equal(cookie.secure, preview, `${name} Secure matches local runtime mode`);
				}
				assert.ok(
					calls.some((call) => call.path === '/auth/password/login' && call.apiKeyMatched),
					'Password login is delegated through the server API client'
				);
				assert.ok(pendingResponses.length > 0);
			}
		);
		await record('Admin browser retains OTP login as a working fallback', async () => {
			const otpContext = await context();
			const otpPage = await otpContext.newPage();
			await otpPage.goto(`${origin}/login`, { waitUntil: 'networkidle' });
			await otpPage.getByRole('button', { name: 'Kode email', exact: true }).click();
			await otpPage.locator('#otp-email').fill('admin@p01.invalid');
			await otpPage.getByRole('button', { name: /Kirim kode OTP/ }).click();
			await otpPage.locator('#code').fill('123456');
			await otpPage.getByRole('button', { name: 'Verifikasi dan masuk' }).click();
			await otpPage.waitForURL(`${origin}/dashboard`);
			await otpPage.getByRole('heading', { name: 'Dashboard Operasional', exact: true }).waitFor();
			safePayload(await otpPage.content(), 'OTP-login hydrated HTML');
			await otpContext.close();
		});
		await record('Admin reset request and token reset use the generic browser flow', async () => {
			const resetContext = await context();
			const resetPage = await resetContext.newPage();
			await resetPage.goto(`${origin}/reset-password`, { waitUntil: 'networkidle' });
			await resetPage.locator('#email').fill('admin@p01.invalid');
			await resetPage.getByRole('button', { name: /Kirim tautan reset/ }).click();
			await resetPage.getByRole('heading', { name: 'Periksa Email Anda' }).waitFor();

			await resetPage.goto(`${origin}/reset-password/${resetToken}`, { waitUntil: 'networkidle' });
			await resetPage.locator('#password').fill(resetPassword);
			await resetPage.locator('#confirmPassword').fill(resetPassword);
			await resetPage.getByRole('button', { name: /Atur kata sandi/ }).click();
			await resetPage.getByRole('heading', { name: 'Kata sandi diperbarui' }).waitFor();
			assert.ok(calls.some((call) => call.path === '/auth/password/forgot'));
			assert.ok(calls.some((call) => call.path === '/auth/password/reset'));

			await resetPage.getByRole('link', { name: 'Masuk', exact: true }).click();
			await resetPage.locator('#password-email').fill('admin@p01.invalid');
			await resetPage.locator('#password').fill(resetPassword);
			await resetPage.getByRole('button', { name: /Masuk/ }).click();
			await resetPage.waitForURL(`${origin}/dashboard`);
			assert.ok(await resetContext.cookies());
			await resetContext.close();
		});
		await page.getByRole('link', { name: 'Daftar Pengguna', exact: true }).click();
		await page.waitForURL(`${origin}/users`);
		await page.waitForLoadState('networkidle');
		assert.ok(await page.getByText('Synthetic Admin', { exact: true }).count());
		await record('Main sidebar shows token access only to cryptoasset managers', async () => {
			assert.equal(await page.getByRole('link', { name: 'Token Kripto', exact: true }).count(), 1);
			const managerToken = [...roleTokens].find(([, role]) => role === 'posts_manager')?.[0];
			assert.ok(managerToken, 'Synthetic posts manager token exists');
			const ctx = await context(managerToken, refresh);
			const managerPage = await ctx.newPage();
			await managerPage.goto(`${origin}/dashboard`);
			assert.equal(await managerPage.getByRole('link', { name: 'Token Kripto', exact: true }).count(), 0);
			await ctx.close();
			await ui.close();
		});
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
				const logoutContext = await context(adminToken, refresh);
				const logoutPage = await logoutContext.newPage();
				await logoutPage.goto(`${origin}/dashboard`);
				const actionResponse = logoutPage.waitForResponse(
					(response) =>
						new URL(response.url()).pathname === '/logout' && response.request().method() === 'POST'
				);
				await logoutPage.getByRole('button', { name: 'Logout', exact: true }).click();
				const response = await actionResponse;
				if (response.status() === 200) {
					assert.deepEqual(await response.json(), {
						type: 'redirect',
						status: 303,
						location: '/login'
					});
				} else {
					assert.equal(response.status(), 303);
					assert.equal(response.headers()['location'], '/login');
				}
				await logoutPage.waitForURL(`${origin}/login`, { waitUntil: 'domcontentloaded' });
				assert.equal(calls.filter((call) => call.path === '/auth/signout').length, before + 1);
				assert.ok(
					!(await logoutContext.cookies()).some((cookie) =>
						['access_token', 'refresh_token', 'user_session'].includes(cookie.name)
					)
				);
				await logoutContext.close();
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
				result: results.some((result) => result.status === 'FAIL') ? 'FAIL' : 'PASS',
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
			{ result: 'FAIL', results, error: redacted(error.message), calls, pageErrors, consoleErrors },
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
