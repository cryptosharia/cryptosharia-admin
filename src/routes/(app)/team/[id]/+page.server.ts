import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_BASE_URL } from '$lib/api';
import { env as privateEnv } from '$env/dynamic/private';
import { uploadAsset } from '$lib/server/assets';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const apiUrl = API_BASE_URL;
	const apiKey = privateEnv.CS_API_KEY;
	try {
		const res = await fetch(`${apiUrl}/team-members/${params.id}`, {
			headers: {
				...(locals.user?.accessToken ? { Authorization: `Bearer ${locals.user.accessToken}` } : {}),
				...(apiKey ? { 'Api-Key': apiKey } : {})
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

export const actions = {
	default: async ({ params, request, fetch, locals }) => {
		const formData = await request.formData();
		const apiUrl = API_BASE_URL;
		const apiKey = privateEnv.CS_API_KEY;

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
					...(apiKey ? { 'Api-Key': apiKey } : {})
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
