import { createApiClient } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {};
};

export const actions = {
    create: async ({ request, fetch }) => {
        const formData = await request.formData();
        const client = createApiClient({ fetch }) as any;

        const name = formData.get('name') as string;
        const ticker = formData.get('ticker') as string;
        const shariaStatus = formData.get('shariaStatus') as "halal" | "haram" | "syubhat";
        const status = formData.get('status') as "draft" | "published" | "archived";

        if (!name || !ticker) {
            return fail(400, { missing: true, message: 'Name and Ticker are required.' });
        }

        try {
            const { data, error } = await client.POST('/tokens', {
                body: {
                    name,
                    ticker,
                    shariaStatus,
                    status
                }
            });

            if (error || !data?.success) {
                return fail(400, { message: 'Failed to create token via API' });
            }

            throw redirect(303, `/tokens/${data.data.slug}`);
        } catch (err) {
            if (err instanceof Response) throw err; // re-throw redirect
            console.error('Create token error:', err);
            return fail(500, { message: 'Internal server error' });
        }
    }
};
