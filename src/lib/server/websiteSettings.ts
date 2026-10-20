import { createApiClient } from '$lib/api';

export type AcademyVisibilitySettings = {
	academyPromotionEnabled: boolean;
	academyNavbarEnabled: boolean;
	academyHomepageSectionEnabled: boolean;
	effectiveNavbar: boolean;
	effectiveSection: boolean;
	version: number;
	updatedAt: string;
};

type ApiReply<T> = { data?: T; error?: unknown; response: Response };
type WebsiteSettingsTransport = {
	GET(path: string): Promise<ApiReply<AcademyVisibilitySettings>>;
	PUT(
		path: string,
		options: { body: Record<string, unknown> }
	): Promise<ApiReply<AcademyVisibilitySettings>>;
};

function messageFrom(error: unknown, status: number) {
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	return status === 403
		? 'Akun ini tidak memiliki izin mengubah pengaturan website.'
		: 'Pengaturan website tidak dapat dimuat dari server.';
}

export async function readAcademyVisibility(fetchFn: typeof fetch, accessToken: string) {
	const client = createApiClient({
		fetch: fetchFn,
		accessToken
	}) as unknown as WebsiteSettingsTransport;
	const result = await client.GET('/admin/site-settings/academy');
	if (!result.data) {
		return {
			ok: false as const,
			status: result.response.status,
			message: messageFrom(result.error, result.response.status)
		};
	}
	return { ok: true as const, data: result.data };
}

export async function saveAcademyVisibility(
	fetchFn: typeof fetch,
	accessToken: string,
	settings: {
		academyPromotionEnabled: boolean;
		academyNavbarEnabled: boolean;
		academyHomepageSectionEnabled: boolean;
		expectedVersion: number;
	}
) {
	const client = createApiClient({
		fetch: fetchFn,
		accessToken
	}) as unknown as WebsiteSettingsTransport;
	const result = await client.PUT('/admin/site-settings/academy', { body: settings });
	if (!result.data) {
		return {
			ok: false as const,
			status: result.response.status,
			message: messageFrom(result.error, result.response.status)
		};
	}
	return { ok: true as const, data: result.data };
}
