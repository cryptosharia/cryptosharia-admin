import { createApiClient } from '$lib/api';
import { uploadAsset } from '$lib/server/assets';
import { loadAllTags } from '$lib/server/tags';
import { canManageCryptoassets } from '$lib/permissions';
import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getApiErrorCode(payload: unknown): string | undefined {
	if (!isRecord(payload) || typeof payload.error !== 'string') return undefined;
	return payload.error;
}

function getValidationMessage(payload: unknown): string | undefined {
	if (!isRecord(payload) || !isRecord(payload.details)) return undefined;

	const labels: Record<string, string> = {
		name: 'Token Name',
		ticker: 'Ticker Symbol',
		slug: 'URL Slug',
		shariaStatus: 'Sharia Status',
		status: 'Status',
		excerpt: 'Excerpt',
		tradingviewSymbol: 'TradingView Symbol',
		website: 'Website',
		logoId: 'Logo',
		content: 'Content',
		tags: 'Tags'
	};
	const fields = isRecord(payload.details.fields) ? payload.details.fields : {};
	const fieldMessages = Object.entries(fields).flatMap(([field, errors]) =>
		Array.isArray(errors)
			? errors
					.filter((message): message is string => typeof message === 'string')
					.map((message) => `${labels[field] ?? 'Token details'}: ${message}`)
			: []
	);
	const rootMessages = Array.isArray(payload.details.root)
		? payload.details.root.filter((message): message is string => typeof message === 'string')
		: [];
	const messages = [...fieldMessages, ...rootMessages].slice(0, 4);

	return messages.length ? `Periksa kembali data token: ${messages.join('; ')}` : undefined;
}

function getCreateFailureMessage(status: number, payload: unknown): string {
	const code = getApiErrorCode(payload);

	if (status === 401 || code === 'UNAUTHORIZED') {
		return 'Sesi admin tidak valid. Silakan login kembali.';
	}
	if (status === 403 || code === 'FORBIDDEN') {
		return 'Akun ini tidak memiliki izin untuk membuat token.';
	}
	if (code === 'SLUG_CONFLICT') return 'URL slug sudah digunakan. Pilih slug lain.';
	if (code === 'TICKER_CONFLICT') return 'Ticker symbol sudah digunakan. Pilih ticker lain.';
	if (status === 409) return 'Token dengan slug atau ticker tersebut sudah ada.';
	if (status === 422 || code === 'VALIDATION_FAILED') {
		return getValidationMessage(payload) ?? 'Data token tidak valid. Periksa kembali semua field.';
	}
	if (status === 429) return 'Terlalu banyak permintaan. Coba lagi sebentar.';
	if (status >= 500) return 'Layanan API sedang bermasalah. Coba lagi nanti.';
	return 'API menolak data token. Periksa kembali semua field.';
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!canManageCryptoassets(locals.user?.role)) {
		throw error(403, 'You do not have permission to create cryptoassets.');
	}

	return { tags: await loadAllTags(fetch, locals.user?.accessToken) };
};

export const actions = {
	create: async ({ request, fetch, locals }) => {
		if (!canManageCryptoassets(locals.user?.role)) {
			return fail(403, { message: 'Akun ini tidak memiliki izin untuk membuat token.' });
		}

		const formData = await request.formData();
		const client = createApiClient({
			fetch,
			accessToken: locals.user?.accessToken
		});

		const name = formData.get('name') as string;
		const ticker = formData.get('ticker') as string;
		const shariaStatus = formData.get('shariaStatus') as 'halal' | 'haram' | 'syubhat';
		const status = formData.get('status') as 'draft' | 'published' | 'archived';

		const slug = formData.get('slug') as string;
		const excerpt = formData.get('excerpt') as string;
		const content = formData.get('content') as string;
		const website = formData.get('website') as string;
		const tradingviewSymbol = (formData.get('tradingviewSymbol') as string) || null;
		const tagsStr = formData.get('tags') as string;
		const tags = tagsStr
			? tagsStr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const logoFile = formData.get('logoImage') as File | null;

		if (!name || !ticker || !slug || !excerpt || !content) {
			return fail(400, {
				missing: true,
				message: 'Name, ticker, slug, excerpt, and content are required.'
			});
		}

		if (!website) {
			return fail(400, { missing: true, message: 'Website is required.' });
		}
		let logoId: string;

		try {
			if (!logoFile || logoFile.size === 0) {
				return fail(400, { message: 'Logo Image is required' });
			}

			const uploadedAsset = await uploadAsset(fetch, logoFile, locals.user?.accessToken);
			logoId = uploadedAsset.id;

			const {
				data,
				error: apiError,
				response
			} = await client.POST('/cryptoassets', {
				body: {
					name,
					ticker,
					slug,
					shariaStatus,
					status,
					website,
					tradingviewSymbol,
					tags,
					logoId,
					excerpt,
					content
				}
			});

			if (apiError || !data) {
				const code = getApiErrorCode(apiError) ?? 'UNKNOWN';
				console.error('Create cryptoasset API request failed', {
					status: response.status,
					code
				});
				return fail(400, { message: getCreateFailureMessage(response.status, apiError) });
			}

			throw redirect(303, `/tokens/${data.slug}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			console.error('Create token error:', err);
			const isConfigurationError =
				err instanceof Error &&
				(err.message === 'CS_API_KEY belum dikonfigurasi pada panel admin.' ||
					err.message === 'Sesi admin tidak tersedia. Silakan login ulang.');
			return fail(500, {
				message: isConfigurationError
					? err.message
					: 'Gagal menghubungi API saat mengunggah logo atau membuat token. Coba lagi nanti.'
			});
		}
	}
} satisfies Actions;
