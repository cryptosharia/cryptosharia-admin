import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { transitionAdminContent } from '$lib/server/academyClient';
import { requireAdminAcademyAuth } from '$lib/server/academyAuth';
import { contentTransitionSchema } from '$lib/server/academyValidation';
import { canReviewAcademy, canPublishAcademy } from '$lib/permissions';

export const POST: RequestHandler = async ({ params, request, locals }) => {
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

	const parsed = contentTransitionSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json(
			{
				error: 'VALIDATION_ERROR',
				message: 'Data transisi status materi tidak valid.',
				issues: parsed.error.issues
			},
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	// Granular Editorial RBAC checks:
	if (parsed.data.targetStatus === 'review' || parsed.data.targetStatus === 'approved') {
		if (!canReviewAcademy(auth.user.role)) {
			return json(
				{ error: 'FORBIDDEN', message: 'Izin review editorial (academy.review) diperlukan.' },
				{ status: 403, headers: { 'cache-control': 'no-store' } }
			);
		}
	}

	if (parsed.data.targetStatus === 'published') {
		if (!canPublishAcademy(auth.user.role)) {
			return json(
				{ error: 'FORBIDDEN', message: 'Izin publikasi materi (academy.publish) diperlukan.' },
				{ status: 403, headers: { 'cache-control': 'no-store' } }
			);
		}
	}

	const res = await transitionAdminContent(id, parsed.data, auth.accessToken);
	if (!res.ok) {
		return json(
			{ error: res.error, message: res.message },
			{ status: res.status, headers: { 'cache-control': 'no-store' } }
		);
	}

	return json(res.data, { status: 200, headers: { 'cache-control': 'no-store' } });
};
