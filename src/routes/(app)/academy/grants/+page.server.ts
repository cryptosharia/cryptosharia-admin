import type { PageServerLoad } from './$types';
import { getAdminGrants, getAdminScopes } from '$lib/server/academyClient';

export const load: PageServerLoad = async ({ locals, url }) => {
	const accessToken = locals.accessToken || locals.user?.accessToken || '';
	const userId = url.searchParams.get('userId') || undefined;
	const scopeId = url.searchParams.get('scopeId') || undefined;

	const [grantsRes, scopesRes] = await Promise.all([
		getAdminGrants({ userId, scopeId }, accessToken),
		getAdminScopes(accessToken)
	]);

	return {
		grants: grantsRes.ok && grantsRes.data ? grantsRes.data : [],
		scopes: scopesRes.ok && scopesRes.data ? scopesRes.data : [],
		filters: { userId, scopeId },
		error: !grantsRes.ok ? grantsRes.message : !scopesRes.ok ? scopesRes.message : null
	};
};
