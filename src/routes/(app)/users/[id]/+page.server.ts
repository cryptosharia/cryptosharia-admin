import { createApiClient } from '$lib/api';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

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

        // 1. Update profile name
        if (name) {
            const { error: patchError } = await client.PATCH('/users/{id}', {
                params: { path: { id: params.id } },
                body: { name }
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
    },
    delete: async () => {
        return fail(405, { success: false, message: 'Delete operation is not supported by the API yet.' });
    }
} satisfies Actions;
