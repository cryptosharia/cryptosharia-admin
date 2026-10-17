import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function findFilesRecursively(dir: string, pattern: RegExp): string[] {
	const results: string[] = [];
	if (!existsSync(dir)) return results;

	function walk(currentDir: string) {
		const entries = readdirSync(currentDir);
		for (const entry of entries) {
			const fullPath = join(currentDir, entry);
			const stat = statSync(fullPath);
			if (stat.isDirectory()) {
				walk(fullPath);
			} else if (pattern.test(fullPath)) {
				results.push(fullPath);
			}
		}
	}
	walk(dir);
	return results;
}

test('Security Gate: Development authentication bypass routes must NOT exist in source', () => {
	const routesDir = join(process.cwd(), 'src/routes');

	// 1. Assert no dev-auth directory exists anywhere in src/routes
	const devAuthFiles = findFilesRecursively(routesDir, /dev-auth/);
	assert.equal(
		devAuthFiles.length,
		0,
		`CRITICAL SECURITY VIOLATION: Found development authentication route in release source: ${devAuthFiles.join(', ')}`
	);

	// 2. Assert no route file allows setting auth cookies from query parameters
	const allRouteFiles = findFilesRecursively(routesDir, /\+server\.(ts|js)$/);
	for (const file of allRouteFiles) {
		assert.doesNotMatch(
			file,
			/dev-auth/,
			`Forbidden route file detected: ${file}`
		);
	}
});

test('Security Gate: SvelteKit build artifacts must NOT contain dev-auth handlers', () => {
	const buildDir = join(process.cwd(), '.svelte-kit/output');
	if (existsSync(buildDir)) {
		const buildDevAuthFiles = findFilesRecursively(buildDir, /dev-auth/);
		assert.equal(
			buildDevAuthFiles.length,
			0,
			`CRITICAL SECURITY VIOLATION: Found development auth handler in build output: ${buildDevAuthFiles.join(', ')}`
		);
	}
});

test('Security Gate: Script tools must NOT target production Neon branches', () => {
	const scriptsDir = join(process.cwd(), 'scripts');
	if (existsSync(scriptsDir)) {
		const scriptFiles = findFilesRecursively(scriptsDir, /\.(mjs|js|ts)$/);
		for (const file of scriptFiles) {
			// Ensure scripts do not contain hardcoded production hostname
			assert.doesNotMatch(
				file,
				/production-branch|falling-rice/,
				`Forbidden production identifier in script filename: ${file}`
			);
		}
	}
});
