const CRYPTOASSET_MANAGER_ROLES = new Set(['super_admin', 'admin', 'cryptoassets_manager']);

export function canManageCryptoassets(role: string | null | undefined): boolean {
	return role !== undefined && role !== null && CRYPTOASSET_MANAGER_ROLES.has(role);
}
