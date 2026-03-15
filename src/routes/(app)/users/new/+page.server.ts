import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {};
};

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        const client = createApiClient({ fetch }) as any;

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string;
        // status is usually handled after creation or defaulted to inactive pending verification

        if (!name || !email || !password) {
             return fail(400, { message: 'Name, Email and Password are required.' });
        }

        try {
            // 1. Create User (via SignUp endpoint or equivalent)
            // Note: AuthSignup usually returns access tokens. Admin creating user might mean different flow.
            // If using AuthSignup, we are technically "signing up" a new user.
            // Warning: This might log us in as the new user if cookie handling is implicit, 
            // but createApiClient doesn't set browser cookies automatically.
            // However, we passed `fetch` which interacts with SvelteKit's fetch.
            // The `api.ts` factory sets `options.fetch`.
            // If we use `POST /auth/signup`, we are verifying if admin can do it.
            // Let's assume yes or use it.
            
            // Adjusting to API Spec seen: 
            // post: { parameters: { query: { notify?: boolean } }, requestBody: { content: { "application/json": AuthSignupPostBody } } }
            // AuthSignupPostBody: { email, password, name, ... } - wait, role?
            
            const { data, error } = await client.POST('/auth/signup', {
                query: { notify: true },
                body: {
                    name,
                    email,
                    password
                }
            });

            if (error || !data?.success) {
                console.error('Create user error:', error || data);
                 return fail(400, { message: error?.message || 'Failed to create user.' });
            }

            const newUserId = data.data.user?.id || data.data.id; // improved robustness

            // 2. Update Role
            if (role && role !== 'member') {
                 try {
                     await client.PATCH(`/users/${newUserId}`, {
                         body: { role }
                     });
                 } catch (roleErr) {
                     console.error('Failed to set role for new user:', roleErr);
                 }
            }
            
            // 3. Update Status
            const desiredStatus = formData.get('status') === 'on' ? 'active' : 'inactive';
            if (desiredStatus === 'active') { // Force verify
                 try {
                     await client.PUT(`/users/${newUserId}/status`, {
                         body: { status: 'active' }
                     });
                 } catch (statusErr) {
                     console.error('Failed to activate new user:', statusErr);
                 }
            }

        } catch (err) {
            console.error('Create user exception:', err);
            return fail(500, { message: 'Internal server error' });
        }

        throw redirect(303, '/users');
    }
};
