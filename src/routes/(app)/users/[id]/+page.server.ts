import { createApiClient } from '$lib/api';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { env } from '$env/dynamic/public';
import { CS_API_KEY } from '$env/static/private';

// Role definitions from API spec - enum values with display labels
export const _ROLES = [
	{ value: 'super_admin', label: 'Super Admin' },
	{ value: 'admin', label: 'Admin' },
	{ value: 'posts_manager', label: 'Posts Manager' },
	{ value: 'tokens_manager', label: 'Tokens Manager' },
	{ value: 'member', label: 'Member' },
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

        if (apiError || !data?.success) {
            console.error('User load error:', apiError);
            throw error(404, 'User not found');
        }

        return { 
            user: data.data,
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
                const apiUrl = (env.PUBLIC_CS_API_URL || 'https://preview.api.cryptosharia.id').replace(/\/$/, '');
                const uploadForm = new FormData();
                uploadForm.append('file', avatarFile);
                const uploadRes = await fetch(`${apiUrl}/assets`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${locals.user?.accessToken || ''}`,
                        'Api-Key': CS_API_KEY
                    },
                    body: uploadForm
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    avatarId = uploadData.data?.id;
                }
            } else if (removeAvatar) {
                avatarId = null;
            }

            if (name || avatarId !== undefined) {
                const patchBody: any = {};
                if (name) patchBody.name = name;
                if (avatarId !== undefined) patchBody.avatarId = avatarId;

                const { error: patchError } = await client.PATCH('/users/{id}', {
                    params: { path: { id: params.id } },
                    body: patchBody
                });

                if (patchError) {
                    console.error('Update profile error:', patchError);
                    return fail(400, { success: false, message: 'Failed to update user profile.' });
                }
            }

            // 2. Update Role
            if (role) {
                const roleValue = role as any;
                const { error: roleError } = await client.PUT('/users/{id}/role', {
                    params: { path: { id: params.id } },
                    body: { role: roleValue }
                });

                if (roleError) {
                    console.error('Update role error:', roleError);
                    return fail(400, { success: false, message: 'Profile updated, but failed to update role.' });
                }
            }

            // 3. Update Status
            if (status) {
                const statusValue = status as 'active' | 'inactive' | 'suspended' | 'banned';
                const { error: statusError } = await client.PUT('/users/{id}/status', {
                    params: { path: { id: params.id } },
                    body: { status: statusValue }
                });

                if (statusError) {
                    console.error('Update status error:', statusError);
                    return fail(400, { success: false, message: 'Profile updated, but failed to update status.' });
                }
            }

            return { success: true, message: 'User updated successfully' };
        } catch (error: any) {
            console.error('Unexpected error updating user:', error);
            return fail(500, { success: false, message: 'An unexpected internal error occurred.' });
        }
    },
    delete: async () => {
        return fail(405, { success: false, message: 'Delete operation is not supported by the API yet.' });
    }
} satisfies Actions;
