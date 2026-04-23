import { error, json } from '@sveltejs/kit';
import { createApiClient } from '$lib/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const image = formData.get('image') as File;

	if (!image) {
		throw error(400, 'Image file is required');
	}

	const client = createApiClient({ fetch, accessToken: locals.user?.accessToken });
	const uploadForm = new FormData();
	uploadForm.append('file', image);

	console.log(`Uploading image to /imgbb: ${image.name} (${image.size} bytes)`);

	const res = await client.POST('/imgbb', { body: uploadForm });

	if (res.error) {
		console.error('Failed to upload image:', res.error);
		return json(
			{ success: false, message: 'Failed to upload image' },
			{ status: res.response?.status || 500 }
		);
	}

	return json({ success: true, url: res.data?.data?.url });
};
