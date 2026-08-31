import { createApiClient } from '$lib/api';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Role definitions from API spec - enum values with display labels
export const _ROLES = [
	{ value: 'super_admin', label: 'Super Admin' },
	{ value: 'admin', label: 'Admin' },
	{ value: 'posts_manager', label: 'Posts Manager' },
	{ value: 'cryptoassets_manager', label: 'Cryptoassets Manager' },
	{ value: 'member', label: 'Member' }
] as const;

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const client = createApiClient({
		fetch,
		accessToken: locals.user?.accessToken
	});

	try {
		const { data, error: apiError } = await client.GET('/users/{id}', {
			params: { path: { id: params.id } }
		});

		if (apiError || !data) {
			console.error('User load error:', apiError);
			throw error(404, 'User not found');
		}

		return {
			user: data,
			roles: _ROLES
		};
	} catch (err: any) {
		if (err instanceof Response) throw err;
		if (err?.status) throw err; // re-throw SvelteKit errors
		console.error('Failed to load user:', err);
		throw error(500, `Failed to load user: ${err.message || 'Unknown error'}`);
	}
};

export const actions = {
	update: async ({ request, params, fetch, locals }) => {
		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = formData.get('name') as string;
		const role = formData.get('role') as string;
		const status = formData.get('status') as string;

		if (!name && !role && !status) {
			return fail(400, { success: false, message: 'No valid fields provided for update.' });
		}

		try {
			// 1. Update profile name (and optionally avatarId)
			const avatarFile = formData.get('avatar') as File | null;
			const removeAvatar = formData.get('remove_avatar') === 'true';
			let avatarId: string | null | undefined = undefined;

			if (avatarFile && avatarFile.size > 0) {
				const apiUrl = (
					publicEnv.PUBLIC_CS_API_URL || 'https://preview.api.cryptosharia.id'
				).replace(/\/$/, '');
				const uploadForm = new FormData();
				uploadForm.append('file', avatarFile);
				const uploadRes = await fetch(`${apiUrl}/assets`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${locals.user?.accessToken || ''}`,
						'Api-Key': privateEnv.CS_API_KEY
					},
					body: uploadForm
				});
				if (uploadRes.ok) {
					const uploadData = await uploadRes.json();
					avatarId = uploadData.id;
				}
			} else if (removeAvatar) {
				avatarId = null;
			}

			const patchBody = {
				...(name ? { name } : {}),
				...(avatarId !== undefined ? { avatarId } : {}),
				...(role
					? {
							role: role as
								'super_admin' | 'admin' | 'posts_manager' | 'cryptoassets_manager' | 'member'
						}
					: {}),
				...(status ? { status: status as 'active' | 'inactive' | 'suspended' | 'banned' } : {})
			};
			const { error: patchError } = await client.PATCH('/users/{id}', {
				params: { path: { id: params.id } },
				body: patchBody
			});

			if (patchError) {
				console.error('Update user error:', patchError);
				return fail(400, { success: false, message: 'Failed to update user.' });
			}

			return { success: true, message: 'User updated successfully' };
		} catch (error: any) {
			console.error('Unexpected error updating user:', error);
			return fail(500, { success: false, message: 'An unexpected internal error occurred.' });
		}
	}
} satisfies Actions;
