import { json } from '@sveltejs/kit';
import { canManageAcademy } from '../permissions.ts';

export type AdminAuthResult =
	| { ok: true; accessToken: string; user: NonNullable<App.Locals['user']> }
	| { ok: false; response: Response };

/**
 * Enforces session authentication and Academy administrator RBAC.
 * Rejects unauthenticated requests with HTTP 401.
 * Rejects non-admin / non-permitted roles with HTTP 403.
 * Fails closed.
 */
export function requireAdminAcademyAuth(locals: App.Locals): AdminAuthResult {
	const accessToken = locals.accessToken || locals.user?.accessToken;
	if (!accessToken || !locals.user) {
		return {
			ok: false,
			response: json(
				{ error: 'UNAUTHORIZED', message: 'Akses ditolak. Silakan login terlebih dahulu.' },
				{ status: 401, headers: { 'cache-control': 'no-store' } }
			)
		};
	}

	if (!canManageAcademy(locals.user.role)) {
		return {
			ok: false,
			response: json(
				{ error: 'FORBIDDEN', message: 'Akses administrator diperlukan.' },
				{ status: 403, headers: { 'cache-control': 'no-store' } }
			)
		};
	}

	return {
		ok: true,
		accessToken,
		user: locals.user
	};
}
