import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_CS_API_URL } from '$env/static/public';
import { CS_API_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const apiUrl = PUBLIC_CS_API_URL.replace(/\/$/, '');
	try {
		const res = await fetch(`${apiUrl}/team-members/${params.id}`, {
			headers: {
				...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
				...(CS_API_KEY ? { 'Api-Key': CS_API_KEY } : {})
			}
		});

		if (!res.ok) {
			throw error(res.status, 'Anggota tim tidak ditemukan.');
		}

		const member = await res.json();
		return { member };
	} catch (err: any) {
		console.error('Failed to load team member for edit:', err);
		if (err.status) throw err;
		throw error(500, 'Gagal memuat data anggota tim.');
	}
};

async function uploadAsset(fetchFn: typeof fetch, file: File, accessToken?: string) {
	const formData = new FormData();
	formData.append('file', file);
	const apiUrl = PUBLIC_CS_API_URL.replace(/\/$/, '');

	const res = await fetchFn(`${apiUrl}/assets`, {
		method: 'POST',
		headers: {
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...(CS_API_KEY ? { 'Api-Key': CS_API_KEY } : {})
		},
		body: formData
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(errorText || `Upload foto gagal (${res.status})`);
	}

	const json = await res.json();
	return json.data;
}

export const actions = {
	default: async ({ params, request, fetch, locals }) => {
		const formData = await request.formData();
		const apiUrl = PUBLIC_CS_API_URL.replace(/\/$/, '');

		const name = (formData.get('name') as string)?.trim();
		const slug = (formData.get('slug') as string)?.trim() || undefined;
		const credentials = (formData.get('credentials') as string)?.trim() || null;
		const role = (formData.get('role') as string)?.trim();
		const focus = (formData.get('focus') as string)?.trim();
		const contribution = (formData.get('contribution') as string)?.trim() || null;
		const joined = (formData.get('joined') as string)?.trim() || null;
		const description = (formData.get('description') as string)?.trim();
		const orderIndex = Number(formData.get('orderIndex') || '0');
		const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true';
		const imageUrlInput = (formData.get('imageUrl') as string)?.trim() || null;
		const imageFile = formData.get('image') as File | null;
		const expertiseRaw = formData.get('expertise') as string;

		if (!name || !role || !focus || !description) {
			return fail(400, {
				message: 'Nama, Jabatan, Fokus, dan Deskripsi wajib diisi.'
			});
		}

		let expertise: Array<{ title: string; description: string }> = [];
		if (expertiseRaw) {
			try {
				expertise = JSON.parse(expertiseRaw);
			} catch {
				expertise = [];
			}
		}

		const updatePayload: Record<string, any> = {
			name,
			slug,
			credentials,
			role,
			description,
			focus,
			contribution,
			joined,
			expertise,
			orderIndex,
			isActive
		};

		if (imageUrlInput !== null) {
			updatePayload.imageUrl = imageUrlInput;
		}

		if (imageFile && imageFile.size > 0) {
			try {
				const asset = await uploadAsset(fetch, imageFile, locals.user?.accessToken);
				if (asset?.id) {
					updatePayload.imageId = asset.id;
				}
				if (asset?.url) {
					updatePayload.imageUrl = asset.url;
				}
			} catch (err: any) {
				console.error('Asset upload error:', err);
				return fail(400, { message: `Gagal mengunggah foto profil: ${err.message}` });
			}
		}

		try {
			const res = await fetch(`${apiUrl}/team-members/${params.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
					...(CS_API_KEY ? { 'Api-Key': CS_API_KEY } : {})
				},
				body: JSON.stringify(updatePayload)
			});

			if (!res.ok) {
				const errorJson = await res.json().catch(() => ({}));
				return fail(res.status, {
					message: errorJson.message || 'Gagal memperbarui data anggota tim.'
				});
			}
		} catch (error: any) {
			console.error('Error updating team member:', error);
			return fail(500, { message: 'Terjadi kesalahan sistem saat menghubungi server.' });
		}

		throw redirect(303, '/team');
	}
} satisfies Actions;
