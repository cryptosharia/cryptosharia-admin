/**
 * Seed & Clean realistic curriculum & grants into Neon QA for UI preview.
 * STRICT SAFETY ENFORCEMENT: Never connects to production branch or database.
 */
import { execSync } from 'node:child_process';
import pg from 'pg';

const { Pool } = pg;
const NEON_PROJECT_ID = 'winter-firefly-11354002';
const NEON_ORG_ID = 'org-misty-queen-98932217';
const NEON_QA_BRANCH = 'qa-academy-testing';

const PERMITTED_QA_HOST_FRAGMENT = 'ep-purple-pond';
const FORBIDDEN_PROD_HOST_FRAGMENT = 'falling-rice';

async function main() {
	// 1. Strict branch checks
	if (NEON_QA_BRANCH.includes('main') || NEON_QA_BRANCH.includes('prod')) {
		console.error('BLOCKED: Safety violation - QA script cannot target production branch');
		process.exit(1);
	}

	const qaDbUrl = execSync(
		`npx -y neonctl@latest connection-string ${NEON_QA_BRANCH} --project-id ${NEON_PROJECT_ID} --org-id ${NEON_ORG_ID}`,
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
	).trim();

	const dbParsed = new URL(qaDbUrl);

	// 2. Strict endpoint verification
	if (!dbParsed.hostname.includes(PERMITTED_QA_HOST_FRAGMENT)) {
		console.error(`BLOCKED: Endpoint ${dbParsed.hostname} does not match permitted QA compute fragment.`);
		process.exit(1);
	}
	if (dbParsed.hostname.includes(FORBIDDEN_PROD_HOST_FRAGMENT)) {
		console.error('BLOCKED: Forbidden production hostname detected!');
		process.exit(1);
	}

	console.log(`✓ Neon QA Endpoint verified: ${dbParsed.hostname}`);

	const pool = new Pool({
		connectionString: qaDbUrl,
		ssl: { rejectUnauthorized: false }
	});

	const client = await pool.connect();
	try {
		const isCleanMode = process.argv.includes('--clean');

		if (isCleanMode) {
			console.log('Cleaning up all demonstration curriculum & grants from Neon QA...');
			await client.query(`DELETE FROM academy_grants WHERE source = 'demo-seed';`);
			await client.query(`DELETE FROM academy_lesson_media WHERE lesson_id LIKE 'cs-demo-%';`);
			await client.query(`DELETE FROM academy_content WHERE id LIKE 'cs-demo-%';`);
			await client.query(`DELETE FROM academy_scopes WHERE id IN ('starter-tier', 'pro-tier', 'vip-pass');`);
			console.log('✓ All demonstration data cleaned up with zero residue.');
			return;
		}

		console.log('Seeding demonstration curriculum & editorial items into Neon QA...');

		// 1. Ensure realistic scopes exist
		await client.query(`
			INSERT INTO academy_scopes (id, name, description, is_active, created_by, updated_by)
			VALUES 
				('starter-tier', 'Starter Tier (Dasar Kripto)', 'Akses kurikulum pengantar dan fikih dasar', true, '25f4507b-7908-458c-a07b-edae1f0e107a', '25f4507b-7908-458c-a07b-edae1f0e107a'),
				('pro-tier', 'Professional Tier', 'Akses modul analisis teknikal dan kepatuhan syariah lanjutan', true, '25f4507b-7908-458c-a07b-edae1f0e107a', '25f4507b-7908-458c-a07b-edae1f0e107a'),
				('vip-pass', 'VIP Sharia Scholar Pass', 'Akses mentorship langsung dan seluruh kurikulum', false, '25f4507b-7908-458c-a07b-edae1f0e107a', '25f4507b-7908-458c-a07b-edae1f0e107a')
			ON CONFLICT (id) DO UPDATE SET 
				name = EXCLUDED.name, 
				description = EXCLUDED.description, 
				is_active = EXCLUDED.is_active;
		`);

		// 2. Clear old demo items to avoid conflict
		await client.query(`DELETE FROM academy_lesson_media WHERE lesson_id LIKE 'cs-demo-%';`);
		await client.query(`DELETE FROM academy_content WHERE id LIKE 'cs-demo-%';`);

		// 3. Insert Muamalah subject tree
		// Subject
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah', 'subject', 'root', 'muamalah', 1, 1, 1, 'starter-tier', 'Fikih & Muamalah Aset Kripto', 'Panduan komprehensif hukum Islam seputar aset kripto, token, dan DeFi.', 'published', 1, true, 'Ustadz Dr. Zaidan Shadiq, MA', 3600);
		`);

		// Level 1
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1', 'level', 'cs-demo-muamalah', 'muamalah', 1, 1, 1, 'starter-tier', 'Level 1: Fondasi Maal & Sil''ah', 'Memahami status uang, komoditas, dan barang dalam syariat Islam.', 'published', 1, true, 'Ustadz Dr. Zaidan Shadiq, MA', 1800);
		`);

		// Chapter 1
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1-c1', 'chapter', 'cs-demo-muamalah-l1', 'muamalah', 1, 1, 1, 'starter-tier', 'Bab 1: Definisi Maal Mutaqawwam', 'Syarat dan kriteria barang bernilai menurut jumhur ulama.', 'published', 1, true, 'Ustadz Dr. Zaidan Shadiq, MA', 1200);
		`);

		// Lesson 1 (Published)
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, rights_confirmed, reviewed_by, approved_at, published_at, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1-c1-ls1', 'lesson', 'cs-demo-muamalah-l1-c1', 'muamalah', 1, 1, 1, 'starter-tier', 'Pelajaran 1: Hakikat Uang dalam Fikih Klasik', 'Mengapa uang dalam Islam bukan komoditas murni dan fungsi tsaman.', 'published', 1, true, true, '25f4507b-7908-458c-a07b-edae1f0e107a', NOW(), NOW(), 'Ustadz Dr. Zaidan Shadiq, MA', 420);
		`);

		// Media for Lesson 1
		await client.query(`
			INSERT INTO academy_lesson_media (lesson_id, video_id, version, reading_refs, slide_refs, subtitle_refs, attachment_refs, internal_note)
			VALUES ('cs-demo-muamalah-l1-c1-ls1', 'dQw4w9WgXcQ', 1, '["https://almanhaj.or.id/hukum-uang-kripto", "Fatwa DSN-MUI No. 116"]', '[]', '[]', '[]', 'Terverifikasi bebas copyright')
			ON CONFLICT (lesson_id) DO UPDATE SET video_id = EXCLUDED.video_id;
		`);

		// Lesson 2 (Review Queue Item)
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1-c1-ls2', 'lesson', 'cs-demo-muamalah-l1-c1', 'muamalah', 1, 1, 2, 'starter-tier', 'Pelajaran 2: Analisis Gharar & Maysir pada Tokenomics', 'Pemeriksaan struktur reward staking, burn mechanism, dan potensi judi terselubung.', 'review', 0, true, 'Ustadz Dr. Zaidan Shadiq, MA', 680);
		`);

		// Lesson 3 (Approved Ready to Publish Item)
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, rights_confirmed, reviewed_by, approved_at, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1-c1-ls3', 'lesson', 'cs-demo-muamalah-l1-c1', 'muamalah', 1, 1, 3, 'pro-tier', 'Pelajaran 3: Akad Ijarah vs Ju''alah dalam Proof-of-Work', 'Penerapan akad imbalan kerja komputasi menurut fatwa kontemporer.', 'approved', 0, true, true, '25f4507b-7908-458c-a07b-edae1f0e107a', NOW(), 'Ustadz Dr. Zaidan Shadiq, MA', 540);
		`);

		// Lesson 4 (Draft Item)
		await client.query(`
			INSERT INTO academy_content (id, kind, parent_id, subject_id, level, chapter_number, "order", scope_id, title, description, status, version, syariah_required, instructor, duration_seconds)
			VALUES ('cs-demo-muamalah-l1-c1-ls4', 'lesson', 'cs-demo-muamalah-l1-c1', 'muamalah', 1, 1, 4, 'pro-tier', 'Pelajaran 4: Status Hukum Liquidity Pool & AMM', 'Kajian syubhat riba fadhl dan syirkah dalam Automated Market Maker.', 'draft', 0, true, 'Ustadz Dr. Zaidan Shadiq, MA', 900);
		`);

		// 4. Seed sample Grant
		await client.query(`DELETE FROM academy_grants WHERE source = 'demo-seed';`);
		await client.query(`
			INSERT INTO academy_grants (id, user_id, scope_id, state, starts_at, expires_at, source)
			VALUES 
				(gen_random_uuid(), '11111111-1111-4111-a111-111111111111', 'starter-tier', 'active', NOW(), NOW() + INTERVAL '90 days', 'demo-seed'),
				(gen_random_uuid(), '25f4507b-7908-458c-a07b-edae1f0e107a', 'pro-tier', 'active', NOW(), NOW() + INTERVAL '365 days', 'demo-seed');
		`);

		console.log('✓ Demonstration curriculum & grants seeded successfully!');
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Seeding error:', err);
	process.exit(1);
});
