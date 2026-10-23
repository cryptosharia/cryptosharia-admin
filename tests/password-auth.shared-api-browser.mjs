import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const adminUrl = new URL(process.env.ADMIN_FRONTEND_URL || '');
const email = process.env.CROSS_APP_EMAIL || '';
const password = process.env.CROSS_APP_PASSWORD || '';
const apiKey = process.env.API_KEY || '';
assert.ok(['127.0.0.1', 'localhost', '::1'].includes(adminUrl.hostname));
assert.ok(email && password, 'A synthetic shared account is required');
assert.ok(process.env.PLAYWRIGHT_MODULE, 'Playwright module is required');

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({
	headless: true,
	...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {})
});
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.setDefaultNavigationTimeout(60_000);

const blockedOrigins = [];
const pageErrors = [];
const secrets = [password, apiKey].filter(Boolean);
const forbiddenFields = ['accessToken', 'refreshToken', 'apiKey', 'authorization'];

function safePayload(value, label) {
	for (const secret of secrets) assert.ok(!value.includes(secret), `${label} excludes credentials`);
	for (const field of forbiddenFields)
		assert.ok(!value.includes(`"${field}"`), `${label} excludes ${field}`);
}

await context.route('**/*', async (route) => {
	const target = new URL(route.request().url());
	if (target.origin === adminUrl.origin) return route.continue();
	blockedOrigins.push(target.origin);
	return route.abort();
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
	await page.goto(new URL('/login', adminUrl).href, { waitUntil: 'domcontentloaded' });
	await page.locator('#password-email').waitFor();

	await page.locator('#password-email').fill(email);
	await page.locator('#password').fill('Wrong synthetic cross-app password');
	await page.getByRole('button', { name: /Masuk/ }).click({ noWaitAfter: true });
	await page.getByRole('alert').filter({ hasText: 'Email atau kata sandi tidak valid.' }).waitFor();
	assert.equal((await context.cookies(adminUrl.href)).length, 0);
	console.log('PASS Admin BFF rejects bad credentials against the shared test API');

	await page.locator('#password-email').fill(email);
	await page.locator('#password').fill(password);
	await page.getByRole('button', { name: /Masuk/ }).click({ noWaitAfter: true });
	await page.waitForURL(new URL('/dashboard', adminUrl).href);
	await page.getByRole('heading', { name: 'Dashboard Operasional', exact: true }).waitFor();
	safePayload(await page.content(), 'Admin shared-account dashboard HTML');
	safePayload(await page.evaluate(() => document.cookie), 'Admin browser-visible cookies');

	const cookies = await context.cookies(adminUrl.href);
	for (const name of ['access_token', 'refresh_token', 'user_session']) {
		const cookie = cookies.find((item) => item.name === name);
		assert.ok(cookie, `${name} is set by the Admin BFF`);
		assert.equal(cookie.httpOnly, true);
		assert.equal(cookie.domain, adminUrl.hostname);
		assert.equal(cookie.path, '/');
	}
	const userSession = JSON.parse(
		decodeURIComponent(cookies.find((item) => item.name === 'user_session').value)
	);
	assert.equal(userSession.email, email);
	assert.equal(userSession.role, 'admin');
	assert.ok(!cookies.some((item) => ['cs_at', 'cs_rt'].includes(item.name)));
	assert.ok(!JSON.stringify(cookies).includes(apiKey));
	console.log(
		'PASS Admin logs into the same reset account with its admin role and host-only cookies'
	);

	assert.equal(await page.getByRole('link', { name: 'Daftar Pengguna', exact: true }).count(), 1);
	console.log('PASS Admin role retains its own dashboard permissions');

	await page.getByRole('button', { name: 'Logout', exact: true }).click();
	await page.waitForURL(new URL('/login', adminUrl).href);
	const remaining = (await context.cookies(adminUrl.href)).filter((cookie) =>
		['access_token', 'refresh_token', 'user_session'].includes(cookie.name)
	);
	assert.deepEqual(remaining, []);
	assert.deepEqual(pageErrors, []);
	assert.ok(
		blockedOrigins.every((origin) => origin === 'https://fonts.googleapis.com'),
		'Only blocked stylesheet font requests target an external origin'
	);
	console.log('PASS Admin logout clears all session cookies');
} finally {
	await context.close();
	await browser.close();
}
