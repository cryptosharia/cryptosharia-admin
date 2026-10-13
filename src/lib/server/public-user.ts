import type { PublicUserDTO } from '$lib/types/public-user';

/** Keep server credentials out of load data, including future fields in Locals. */
export function toPublicUser(user: App.Locals['user']): PublicUserDTO | undefined {
	if (!user) return undefined;

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		permissions: Array.isArray(user.permissions)
			? user.permissions.filter((permission) => typeof permission === 'string')
			: []
	};
}
