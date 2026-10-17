/**
 * UI Preview Server Runner for CryptoSharia Unified Admin Portal
 * Connects ONLY to isolated Neon QA branch.
 * STRICT SAFETY ENFORCEMENT: Never connects to production branch or database.
 */
import { spawn, execSync } from 'node:child_process';

const NEON_PROJECT_ID = 'winter-firefly-11354002';
const NEON_ORG_ID = 'org-misty-queen-98932217';
const NEON_QA_BRANCH = 'qa-academy-testing';

// Allowed QA Compute Hostname (isolated Neon QA compute node)
const PERMITTED_QA_HOST_FRAGMENT = 'ep-purple-pond';
const FORBIDDEN_PROD_HOST_FRAGMENT = 'falling-rice';

const API_PORT = 3456;
const ADMIN_PORT = 5174;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`;

const TEST_API_KEY = 'test-internal-api-key-cs-gate-2026';
const TEST_JWT_SECRET = 'test-jwt-secret-cs-gate-2026-very-secure';

async function waitForUrl(url, timeoutMs = 20000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.status < 500) return true;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
	// 1. Strict branch check
	if (NEON_QA_BRANCH.includes('main') || NEON_QA_BRANCH.includes('prod')) {
		console.error('BLOCKED: Safety violation - QA script cannot target production branch');
		process.exit(1);
	}

	console.log('Retrieving Neon QA branch connection string...');
	const qaDbUrl = execSync(
		`npx -y neonctl@latest connection-string ${NEON_QA_BRANCH} --project-id ${NEON_PROJECT_ID} --org-id ${NEON_ORG_ID}`,
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
	).trim();

	// 2. Strict endpoint verification
	const dbParsed = new URL(qaDbUrl);
	if (!dbParsed.hostname.includes(PERMITTED_QA_HOST_FRAGMENT)) {
		console.error(`BLOCKED: Endpoint ${dbParsed.hostname} does not match permitted QA compute fragment.`);
		process.exit(1);
	}
	if (dbParsed.hostname.includes(FORBIDDEN_PROD_HOST_FRAGMENT)) {
		console.error('BLOCKED: Forbidden production hostname detected!');
		process.exit(1);
	}

	console.log(`✓ Neon QA Endpoint verified: ${dbParsed.hostname}`);

	console.log('Starting cryptosharia-api (NestJS) on ' + API_URL + '...');
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
		stdio: 'inherit'
	});

	await waitForUrl(`${API_URL}/health`);
	console.log('✓ cryptosharia-api is live on ' + API_URL);

	console.log('Starting cryptosharia-admin on ' + ADMIN_URL + '...');
	const adminEnv = {
		...process.env,
		PUBLIC_CS_API_URL: API_URL,
		CS_API_KEY: TEST_API_KEY
	};

	const adminProcess = spawn('npx', ['vite', '--port', String(ADMIN_PORT), '--strictPort'], {
		cwd: '/Users/mac/Projects/CryptoSharia/cryptosharia-admin',
		env: adminEnv,
		stdio: 'inherit'
	});

	await waitForUrl(`${ADMIN_URL}/login`);
	console.log('✓ cryptosharia-admin is live on ' + ADMIN_URL);

	console.log('\n======================================================');
	console.log('🌟 ADMIN UI SERVER READY');
	console.log('Login via standard OTP or inject test session cookie');
	console.log('Target URL: ' + ADMIN_URL + '/dashboard');
	console.log('======================================================\n');

	process.on('SIGINT', () => {
		apiProcess.kill();
		adminProcess.kill();
		process.exit(0);
	});
	process.on('SIGTERM', () => {
		apiProcess.kill();
		adminProcess.kill();
		process.exit(0);
	});
}

main().catch((err) => {
	console.error('Failed to start UI preview server:', err);
	process.exit(1);
});
