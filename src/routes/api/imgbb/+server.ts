import { json } from '@sveltejs/kit';
import { IMGBB_API_KEY } from '$env/static/private';

export const POST = async ({ request, fetch }) => {
	const formData = await request.formData();
	const image = formData.get('image');

	if (!image || !(image instanceof Blob)) {
		return json({ success: false, message: 'No image file provided' }, { status: 400 });
	}

	const imgbbData = new FormData();
	imgbbData.append('image', image);
	imgbbData.append('key', IMGBB_API_KEY);

	try {
		const response = await fetch('https://api.imgbb.com/1/upload', {
			method: 'POST',
			body: imgbbData
		});

		const result = await response.json();

		if (result.success) {
			return json({
				success: true,
				data: {
					url: result.data.url,
					delete_url: result.data.delete_url,
					thumb: result.data.thumb?.url,
					medium: result.data.medium?.url,
                    filename: result.data.image?.filename || 'image.png',
                    size: result.data.size,
                    width: result.data.width,
                    height: result.data.height,
                    mime: result.data.mime
				}
			});
		} else {
			console.error('ImgBB Error:', result);
			return json({ success: false, message: result.error?.message || 'Failed to upload to ImgBB' }, { status: result.status || 500 });
		}
	} catch (error) {
		console.error('ImgBB Upload Exception:', error);
		return json({ success: false, message: 'Internal server error during upload' }, { status: 500 });
	}
};
