import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const image = formData.get('image') as File;

	if (!image) {
		throw error(400, 'Image file is required');
	}

	const apiUrl = env.PUBLIC_CS_API_URL || 'https://preview.api.cryptosharia.id';
	const imgbbKey = privateEnv.IMGBB_API_KEY;

	console.log(`Starting image upload for: ${image.name} (${image.size} bytes)`);
	
	// 1. Try Internal API first
	try {
		const uploadForm = new FormData();
		uploadForm.append('file', image);

		console.log(`Attempting upload to internal API: ${apiUrl}/assets`);
		const res = await fetch(`${apiUrl}/assets`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${locals.user?.accessToken || ''}`
			},
			body: uploadForm
		});

		if (res.ok) {
			const data = await res.json();
			const assetData = data.data || data;
			const url = assetData?.url || (assetData?.pathname ? `${apiUrl}${assetData.pathname}` : '');
			
			if (url) {
				console.log('Internal upload successful:', url);
				return json({ success: true, url });
			}
		} else {
			const errText = await res.text();
			console.warn('Internal asset upload failed, status:', res.status, errText);
		}
	} catch (err: any) {
		console.warn('Internal upload caught error:', err.message);
	}

	// 2. Fallback to ImgBB if internal fails and we have a key
	if (imgbbKey) {
		try {
			console.log('Attempting fallback upload to ImgBB');
			// ImgBB requires base64-encoded image, not raw file
			const arrayBuffer = await image.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString('base64');

			const imgbbForm = new FormData();
			imgbbForm.append('image', base64);
			
			const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
				method: 'POST',
				body: imgbbForm
			});

			if (imgbbRes.ok) {
				const imgbbData = await imgbbRes.json();
				if (imgbbData.success) {
					console.log('ImgBB fallback upload successful:', imgbbData.data.url);
					return json({ success: true, url: imgbbData.data.url });
				}
			} else {
				const errText = await imgbbRes.text();
				console.error('ImgBB fallback failed:', errText);
			}
		} catch (err: any) {
			console.error('ImgBB fallback caught error:', err.message);
		}
	}

	return json({ 
		success: false, 
		message: 'All upload attempts failed. Check server logs for details.' 
	}, { status: 500 });
};
