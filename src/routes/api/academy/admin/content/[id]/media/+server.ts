import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setAdminLessonMedia } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';
import { setLessonMediaSchema } from '$lib/server/academyValidation';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const auth = requireAdminAcademyAuth(locals);
	if (!auth.ok) return auth.response;

	const id = params.id?.trim();
	if (!id) {
		return json(
			{ error: 'BAD_REQUEST', message: 'ID materi diperlukan.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json(
			{ error: 'INVALID_JSON', message: 'Format JSON permintaan tidak valid.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const parsed = setLessonMediaSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json(
			{
				error: 'VALIDATION_ERROR',
				message: 'Data media materi tidak valid.',
				issues: parsed.error.issues
			},
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const res = await setAdminLessonMedia(id, parsed.data, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};
