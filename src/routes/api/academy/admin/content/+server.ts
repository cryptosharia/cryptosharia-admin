import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminContent, createAdminContent } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';
import { createContentSchema } from '$lib/server/academyValidation';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const status = url.searchParams.get('status') || undefined;
	const kind = url.searchParams.get('kind') || undefined;
	const subjectId = url.searchParams.get('subjectId') || undefined;
	const scopeId = url.searchParams.get('scopeId') || undefined;

	const res = await getAdminContent({ status, kind, subjectId, scopeId }, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json(
			{ error: 'INVALID_JSON', message: 'Format JSON permintaan tidak valid.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const parsed = createContentSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json(
			{
				error: 'VALIDATION_ERROR',
				message: 'Data materi tidak valid.',
				issues: parsed.error.issues
			},
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const res = await createAdminContent(parsed.data, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 201, headers: { 'cache-control': 'no-store' } });
};
