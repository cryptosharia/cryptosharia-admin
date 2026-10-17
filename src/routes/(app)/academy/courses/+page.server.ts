import type { PageServerLoad } from './$types';
import { getAdminContent, getAdminScopes } from '$lib/server/academyClient';
import { canReviewAcademy, canPublishAcademy, canManageAcademy } from '$lib/permissions';

export const load: PageServerLoad = async ({ locals, url }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';
	const userRole = locals.user?.role;
	const subjectId = url.searchParams.get('subjectId') || undefined;
	const status = url.searchParams.get('status') || undefined;
	const kind = url.searchParams.get('kind') || undefined;
	const selectedId = url.searchParams.get('select') || undefined;

	const [contentRes, scopesRes] = await Promise.all([
		getAdminContent({ subjectId, status, kind }, accessToken),
		getAdminScopes(accessToken)
	]);

	return {
		contents: contentRes.ok && contentRes.data ? contentRes.data : [],
		scopes: scopesRes.ok && scopesRes.data ? scopesRes.data : [],
		filters: { subjectId, status, kind, selectedId },
		permissions: {
			canManage: canManageAcademy(userRole),
			canReview: canReviewAcademy(userRole),
			canPublish: canPublishAcademy(userRole)
		},
		user: locals.user,
		error: !contentRes.ok ? contentRes.message : !scopesRes.ok ? scopesRes.message : null
	};
};
