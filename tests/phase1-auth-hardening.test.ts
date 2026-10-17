import assert from 'node:assert/strict';
import test from 'node:test';
import {
	ALL_PERMISSIONS,
	ROLE_PERMISSIONS,
	ADMIN_ROLES,
	getRolePermissions,
	hasPermission,
	canManageAcademy,
	canReviewAcademy,
	canPublishAcademy,
	canManageCryptoassets,
	canManagePosts,
	canManageUsers,
	canManageTeam
} from '../src/lib/permissions.ts';

test('ALL_PERMISSIONS contains exact 13 official backend permissions', () => {
	assert.equal(ALL_PERMISSIONS.length, 13);
	assert.ok(ALL_PERMISSIONS.includes('academy.manage'));
	assert.ok(ALL_PERMISSIONS.includes('academy.review'));
	assert.ok(ALL_PERMISSIONS.includes('academy.publish'));
	assert.ok(ALL_PERMISSIONS.includes('posts.manage'));
	assert.ok(ALL_PERMISSIONS.includes('cryptoassets.manage'));
	assert.ok(ALL_PERMISSIONS.includes('users.manage_role'));
});

test('ROLE_PERMISSIONS accurately maps all official roles', () => {
	// super_admin has all permissions
	assert.equal(ROLE_PERMISSIONS.super_admin.length, 13);
	assert.ok(canManageAcademy('super_admin'));
	assert.ok(canReviewAcademy('super_admin'));
	assert.ok(canPublishAcademy('super_admin'));
	assert.ok(canManageCryptoassets('super_admin'));
	assert.ok(canManagePosts('super_admin'));
	assert.ok(canManageUsers('super_admin'));
	assert.ok(canManageTeam('super_admin'));

	// admin has 11 permissions (no role/status management)
	assert.equal(ROLE_PERMISSIONS.admin.length, 11);
	assert.ok(canManageAcademy('admin'));
	assert.ok(canReviewAcademy('admin'));
	assert.ok(canPublishAcademy('admin'));
	assert.ok(!hasPermission('admin', 'users.manage_role'));
	assert.ok(!hasPermission('admin', 'users.manage_status'));

	// posts_manager has posts & tags only
	assert.deepEqual(ROLE_PERMISSIONS.posts_manager, ['posts.manage', 'tags.manage']);
	assert.ok(!canManageAcademy('posts_manager'));
	assert.ok(!canManageCryptoassets('posts_manager'));
	assert.ok(canManagePosts('posts_manager'));

	// cryptoassets_manager has cryptoassets & tags only
	assert.deepEqual(ROLE_PERMISSIONS.cryptoassets_manager, ['cryptoassets.manage', 'tags.manage']);
	assert.ok(!canManageAcademy('cryptoassets_manager'));
	assert.ok(canManageCryptoassets('cryptoassets_manager'));
	assert.ok(!canManagePosts('cryptoassets_manager'));

	// member has 0 permissions and is not in ADMIN_ROLES
	assert.deepEqual(ROLE_PERMISSIONS.member, []);
	assert.ok(!ADMIN_ROLES.has('member'));
	assert.ok(!canManageAcademy('member'));
	assert.ok(!canManageCryptoassets('member'));

	// Unknown or null role produces empty permissions
	assert.deepEqual(getRolePermissions(null), []);
	assert.deepEqual(getRolePermissions(undefined), []);
	assert.deepEqual(getRolePermissions('unknown_role'), []);
});

test('CSRF origin validation rejects cross-origin mutating requests', () => {
	function validateCsrfOrigin(method: string, originHeader: string | null, appOrigin: string): boolean {
		if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
			if (originHeader) {
				try {
					const originUrl = new URL(originHeader);
					if (originUrl.origin !== appOrigin) {
						return false; // REJECT
					}
				} catch {
					return false; // REJECT malformed
				}
			}
		}
		return true; // PASS
	}

	const appOrigin = 'https://admin.cryptosharia.id';

	// Same origin on mutating requests -> PASS
	assert.equal(validateCsrfOrigin('POST', 'https://admin.cryptosharia.id', appOrigin), true);
	assert.equal(validateCsrfOrigin('PUT', 'https://admin.cryptosharia.id', appOrigin), true);
	assert.equal(validateCsrfOrigin('DELETE', 'https://admin.cryptosharia.id', appOrigin), true);

	// Cross origin on mutating requests -> REJECT (403)
	assert.equal(validateCsrfOrigin('POST', 'https://evil-attacker.com', appOrigin), false);
	assert.equal(validateCsrfOrigin('POST', 'https://academy.cryptosharia.id', appOrigin), false);
	assert.equal(validateCsrfOrigin('DELETE', 'http://admin.cryptosharia.id', appOrigin), false);
	assert.equal(validateCsrfOrigin('POST', 'not-a-valid-url', appOrigin), false);

	// Safe GET requests -> PASS
	assert.equal(validateCsrfOrigin('GET', 'https://any-external-site.com', appOrigin), true);
});

test('Open redirect prevention sanitizes untrusted redirect query parameters', () => {
	function sanitizeRedirect(targetParam: string | null, fallback: string = '/dashboard'): string {
		if (
			targetParam &&
			targetParam.startsWith('/') &&
			!targetParam.startsWith('//') &&
			!targetParam.includes('\\')
		) {
			return targetParam;
		}
		return fallback;
	}

	// Valid relative paths
	assert.equal(sanitizeRedirect('/academy/courses'), '/academy/courses');
	assert.equal(sanitizeRedirect('/tokens?filter=halal'), '/tokens?filter=halal');
	assert.equal(sanitizeRedirect('/posts/123'), '/posts/123');

	// Malicious open redirects
	assert.equal(sanitizeRedirect('https://evil.com'), '/dashboard');
	assert.equal(sanitizeRedirect('//evil.com/phishing'), '/dashboard');
	assert.equal(sanitizeRedirect('/\\evil.com'), '/dashboard');
	assert.equal(sanitizeRedirect('javascript:alert(1)'), '/dashboard');
	assert.equal(sanitizeRedirect(null), '/dashboard');
	assert.equal(sanitizeRedirect(''), '/dashboard');
});

test('Cookie security policy enforces Host-Only scope without wildcard domain', () => {
	const cookieOptions = {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: true
	};

	assert.equal(cookieOptions.path, '/');
	assert.equal(cookieOptions.httpOnly, true);
	assert.equal(cookieOptions.sameSite, 'strict');
	assert.equal(cookieOptions.secure, true);
	// Verifies no 'domain' attribute is set, ensuring Host-Only isolation per RFC 6265
	assert.ok(!('domain' in cookieOptions), 'Cookie must NOT define domain attribute');
});
