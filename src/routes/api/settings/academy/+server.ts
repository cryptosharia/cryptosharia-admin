import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { canManageWebsiteSettings } from '$lib/permissions';
import { saveAcademyVisibility } from '$lib/server/websiteSettings';

const updateSchema = z
	.object({
		academyPromotionEnabled: z.boolean(),
		academyNavbarEnabled: z.boolean(),
		academyHomepageSectionEnabled: z.boolean(),
		expectedVersion: z.number().int().positive()
	})
	.strict();

export const PUT: RequestHandler = async ({ request, locals, fetch }) => {
	if (!locals.user || !canManageWebsiteSettings(locals.user.role)) {
		return json(
			{ message: 'Akses pengaturan website ditolak.' },
			{ status: locals.user ? 403 : 401, headers: { 'cache-control': 'no-store' } }
		);
	}
	const accessToken = locals.accessToken || locals.user.accessToken;
	if (!accessToken) {
		return json({ message: 'Sesi admin tidak tersedia. Silakan login kembali.' }, { status: 401 });
	}

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json({ message: 'Format permintaan tidak valid.' }, { status: 400 });
	}
	const parsed = updateSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json({ message: 'Nilai pengaturan tidak valid.' }, { status: 400 });
	}

	const result = await saveAcademyVisibility(fetch, accessToken, parsed.data);
	if (!result.ok) {
		return json(
			{ message: result.message },
			{ status: result.status || 502, headers: { 'cache-control': 'no-store' } }
		);
	}
	return json(result.data, { headers: { 'cache-control': 'no-store' } });
};
