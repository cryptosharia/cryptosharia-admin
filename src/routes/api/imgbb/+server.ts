import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const image = formData.get('image');

	if (!image) {
		throw error(400, 'Image file is required');
	}

	const apiUrl = env.PUBLIC_CS_API_URL || 'http://localhost:5173';
	
	try {
		const uploadForm = new FormData();
		uploadForm.append('file', image);

		const res = await fetch(`${apiUrl}/assets`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${locals.user?.accessToken || ''}`
			},
			body: uploadForm
		});

		if (!res.ok) {
			const errText = await res.text();
			console.error('Asset upload error:', errText);
			return json({ success: false, message: 'Upload failed' }, { status: res.status });
		}

		const data = await res.json();
		// AssetsPostResponse has `pathname`, but AssetMetadata has `url`.
		// Try url first (from AssetMetadata), then construct from pathname.
		const assetData = data.data || data;
		const url = assetData?.url || (assetData?.pathname ? `${apiUrl}${assetData.pathname}` : '');
		return json({ success: true, url });
	} catch (err: any) {
		console.error('Upload error:', err);
		return json({ success: false, message: err.message }, { status: 500 });
	}
};
