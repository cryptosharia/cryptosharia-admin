import { API_BASE_URL } from '$lib/api';
import { env as privateEnv } from '$env/dynamic/private';

export type UploadedAsset = {
	id: string;
	pathname: string;
	filename: string;
	size: number;
	mimeType: string | null;
	width: number | null;
	height: number | null;
	provider: 'vercel_blob';
	createdAt: string;
	createdBy: string | null;
};

function isUploadedAsset(value: unknown): value is UploadedAsset {
	return Boolean(
		value &&
			typeof value === 'object' &&
			'id' in value &&
			typeof value.id === 'string'
	);
}

export async function uploadAsset(
	fetchFn: typeof fetch,
	file: File,
	accessToken: string | undefined
): Promise<UploadedAsset> {
	if (!accessToken) throw new Error('Sesi admin tidak tersedia. Silakan login ulang.');

	const apiKey = privateEnv.CS_API_KEY;
	if (!apiKey) throw new Error('CS_API_KEY belum dikonfigurasi pada panel admin.');

	const formData = new FormData();
	formData.append('file', file);

	const response = await fetchFn(`${API_BASE_URL}/assets`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Api-Key': apiKey
		},
		body: formData
	});

	const payload: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const message =
			payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
				? payload.message
				: `Upload file gagal (${response.status}).`;
		throw new Error(message);
	}

	if (!isUploadedAsset(payload)) {
		throw new Error('Respons upload aset dari API tidak valid.');
	}

	return payload;
}
