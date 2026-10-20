export const ALL_PERMISSIONS = [
	'posts.manage',
	'posts.read',
	'cryptoassets.manage',
	'tags.manage',
	'users.read',
	'users.update',
	'users.manage_status',
	'users.manage_role',
	'messages.read',
	'team.manage',
	'academy.manage',
	'academy.review',
	'academy.publish',
	'website.settings.manage'
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
	super_admin: [...ALL_PERMISSIONS],
	admin: ALL_PERMISSIONS.filter(
		(permission) =>
			permission !== 'users.manage_role' &&
			permission !== 'users.manage_status' &&
			permission !== 'website.settings.manage'
	),
	posts_manager: ['posts.manage', 'tags.manage'],
	cryptoassets_manager: ['cryptoassets.manage', 'tags.manage'],
	member: []
};

export const ADMIN_ROLES = new Set(['super_admin', 'admin', 'posts_manager', 'cryptoassets_manager']);

export function getRolePermissions(role: string | null | undefined): Permission[] {
	if (!role || !(role in ROLE_PERMISSIONS)) return [];
	return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
	const permissions = getRolePermissions(role);
	return permissions.includes(permission);
}

export function canManageCryptoassets(role: string | null | undefined): boolean {
	return hasPermission(role, 'cryptoassets.manage');
}

export function canManageAcademy(role: string | null | undefined): boolean {
	return hasPermission(role, 'academy.manage');
}

export function canReviewAcademy(role: string | null | undefined): boolean {
	return hasPermission(role, 'academy.review');
}

export function canPublishAcademy(role: string | null | undefined): boolean {
	return hasPermission(role, 'academy.publish');
}

export function canManagePosts(role: string | null | undefined): boolean {
	return hasPermission(role, 'posts.manage');
}

export function canManageUsers(role: string | null | undefined): boolean {
	return hasPermission(role, 'users.read');
}

export function canManageTeam(role: string | null | undefined): boolean {
	return hasPermission(role, 'team.manage');
}

export function canManageWebsiteSettings(role: string | null | undefined): boolean {
	return hasPermission(role, 'website.settings.manage');
}
