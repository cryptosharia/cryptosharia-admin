import assert from 'node:assert/strict';
import test from 'node:test';
import { toPublicUser } from '../src/lib/server/public-user.ts';
import type { PublicUserDTO } from '../src/lib/types/public-user.ts';

const user = {
	id: '10000000-0000-4000-8000-000000000001',
	name: 'Synthetic Admin',
	email: 'admin@p01.invalid',
	role: 'admin',
	permissions: ['users.read'],
	accessToken: 'synthetic-access-sentinel',
	refreshToken: 'synthetic-refresh-sentinel',
	apiKey: 'synthetic-key-sentinel',
	authorization: 'synthetic-authorization-sentinel',
	internalAuth: { futureSessionSecret: 'synthetic-future-secret' }
};

test('DTO allowlist preserves the five browser fields only', () => {
	assert.deepEqual(toPublicUser(user), {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		permissions: ['users.read']
	});
});

test('server locals retain their access token and future credentials', () => {
	toPublicUser(user);
	assert.ok(user.accessToken && user.refreshToken && user.internalAuth.futureSessionSecret);
	assert.equal(user.permissions.length, 1);
});

test('adding sensitive server fields never adds them to browser JSON', () => {
	const augmented = {
		...user,
		sessionSecret: 'synthetic-session-sentinel',
		futureCredentials: { cookie: 'synthetic-cookie-sentinel' }
	};
	const text = JSON.stringify(toPublicUser(augmented));
	for (const sentinel of [
		user.accessToken,
		user.refreshToken,
		user.apiKey,
		user.authorization,
		user.internalAuth.futureSessionSecret,
		augmented.sessionSecret,
		augmented.futureCredentials.cookie
	]) {
		assert.ok(!text.includes(sentinel), 'Sensitive value is absent from serialized DTO');
	}
	assert.deepEqual(Object.keys(toPublicUser(augmented)!).sort(), [
		'email',
		'id',
		'name',
		'permissions',
		'role'
	]);
});

test('permissions are copied so DTO mutation cannot alter server authorization metadata', () => {
	const dto = toPublicUser(user)!;
	dto.permissions.push('synthetic-browser-change');
	assert.deepEqual(user.permissions, ['users.read']);
});

test('runtime permission objects cannot serialize future nested credentials', () => {
	const malformed = {
		...user,
		permissions: ['users.read', { sessionSecret: 'synthetic-nested-secret' }]
	};
	const dto = toPublicUser(malformed as unknown as NonNullable<App.Locals['user']>);
	assert.deepEqual(dto?.permissions, ['users.read']);
});

test('guest locals produce no public user', () => {
	assert.equal(toPublicUser(undefined), undefined);
});

test('browser DTO type does not expose credential keys', () => {
	// Even an optional future field or an index signature fails this typecheck.
	type AllowedKeys = 'id' | 'name' | 'email' | 'role' | 'permissions';
	const contractIsClosed: [
		Exclude<keyof PublicUserDTO, AllowedKeys> | Exclude<AllowedKeys, keyof PublicUserDTO>
	] extends [never]
		? true
		: false = true;
	assert.equal(contractIsClosed, true);
});
