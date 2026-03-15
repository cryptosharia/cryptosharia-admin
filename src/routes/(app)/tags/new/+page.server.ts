import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        const client = createApiClient({ fetch }) as any;

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const description = formData.get('description') as string;

        if (!name || !slug) {
            return fail(400, { missing: true, message: 'Name and Slug are required.' });
        }

        try {
            const { data, error } = await client.POST('/tags', {
                body: {
                    name,
                    slug,
                    description: description || undefined
                }
            });

            if (error || !data?.success) {
                console.error('API Error:', error || data);
                return fail(400, { message: data?.message || 'Failed to create tag' });
            }
        } catch (error: any) {
            console.error('Error creating tag:', error);
            if (error instanceof Response) throw error; // handle redirect
            return fail(500, { message: 'Failed to create tag.' });
        }

        throw redirect(303, '/tags');
    }
} satisfies Actions;
