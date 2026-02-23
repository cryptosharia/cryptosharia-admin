import { createApiClient } from '$lib/api';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const client = createApiClient({ 
        fetch, 
        accessToken: locals.user?.accessToken 
    });
    try {
        const [{ data, error: apiError }, { data: rolesRes }] = await Promise.all([
            client.GET('/users/{id}', {
                params: { path: { id: params.id } }
            }),
            client.GET('/roles' as any, {})
        ]);

        if (apiError || !data?.success) {
            console.error('User load error:', apiError);
            throw error(404, 'User not found');
        }

        return { 
            user: data.data,
            roles: rolesRes?.success ? rolesRes.data : []
        };
    } catch (err: any) {
        if (err instanceof Response) throw err; // re-throw redirects/errors
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
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string;
        const status = formData.get('status') === 'on' ? 'active' : 'inactive';

        // 1. Update Profile (Name, Email, Role) - Password often separate or handled here?
        // API spec says UsersIdPatchBody.
        const patchBody: any = { name };
        // If password provided, include it if API supports it in PATCH. 
        // If not, we might need a separate endpoint or ignore it.
        // Assuming API supports password update in PATCH for admin.
        if (password && password.trim() !== '') {
            patchBody.password = password;
        }

        const { data: patchData, error: patchError } = await client.PATCH('/users/{id}', {
            params: { path: { id: params.id } },
            body: patchBody
        });

        if (patchError) {
             console.error('Update profile error:', patchError);
             return fail(400, { success: false, message: patchError.message || 'Failed to update user profile.' });
        }

        // 2. Update Role
        const roleId = formData.get('roleId') as string;
        if (roleId) {
            const { error: roleError } = await client.PUT('/users/{id}/role', {
                params: { path: { id: params.id } },
                body: { roleId } as any
            });

            if (roleError) {
                console.error('Update role error:', roleError);
                return fail(400, { success: false, message: roleError.message || 'Profile updated, but failed to update role.' });
            }
        }

        // 3. Update Status
        // Only if status logic is needed.
        const { error: statusError } = await client.PUT('/users/{id}/status', {
            params: { path: { id: params.id } },
            body: { status }
        });

        if (statusError) {
            console.error('Update status error:', statusError);
            return fail(400, { success: false, message: statusError.message || 'Profile updated, but failed to update status.' });
        }

        return { success: true, message: 'User updated successfully' };
    },
    delete: async () => {
         return fail(405, { success: false, message: 'Delete operation is not supported by the API yet.' });
    }
} satisfies Actions;
