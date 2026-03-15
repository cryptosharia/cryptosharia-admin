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
        // We forward to /imgbb since user specified this endpoint
		const res = await fetch(`${apiUrl}/imgbb`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${locals.user?.accessToken || ''}`
			},
			body: formData
		});

		if (!res.ok) {
			const errText = await res.text();
			console.error('ImgBB API error:', errText);
			return json({ success: false, message: 'Upload failed' }, { status: res.status });
		}

		const data = await res.json();
		// The API must return URL in response so that TUI Editor can use it.
		// Usually data.data.url or data.url. We just return it directly.
        // The user says "tampilin deh image-nya pakai URL dari field response-nya" 
        // which means the frontend should read res.url
		return json({
			success: true,
			url: data.data?.url || data.url || ''
		});
	} catch (err: any) {
		console.error('Upload error:', err);
		return json({ success: false, message: err.message }, { status: 500 });
	}
};
