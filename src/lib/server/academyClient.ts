import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type {
	ScopeDto,
	AdminContentDto,
	AdminStatsDto,
	AdminGrantDto,
	MediaDto,
	CreateScopePayload,
	UpdateScopePayload,
	CreateContentPayload,
	UpdateContentPayload,
	ContentTransitionPayload,
	SetLessonMediaPayload,
	CreateGrantPayload
} from '$lib/academyDtos';

export interface ApiClientResponse<T> {
	status: number;
	ok: boolean;
	data: T | null;
	error?: string;
	message?: string;
}

export function getAcademyApiBaseUrl(): string {
	return (publicEnv.PUBLIC_CS_API_URL || 'https://api.cryptosharia.id').replace(/\/$/, '');
}

/**
 * Server-side dispatch to CryptoSharia API v2 backend for Academy Admin CMS.
 * Securely injects server-only `api-key` header and Bearer token.
 * Never exposes the API key to client browsers.
 */
export async function academyApiFetch<T = unknown>(
	path: string,
	options: {
		method?: string;
		accessToken?: string;
		body?: unknown;
		signal?: AbortSignal;
	} = {}
): Promise<ApiClientResponse<T>> {
	const baseUrl = getAcademyApiBaseUrl();
	const apiKey = privateEnv.CS_API_KEY;

	if (!apiKey) {
		return {
			status: 503,
			ok: false,
			data: null,
			error: 'API_KEY_MISSING',
			message: 'Kunci otorisasi API (CS_API_KEY) belum dikonfigurasi di server.'
		};
	}

	const headers: Record<string, string> = {
		'api-key': apiKey,
		accept: 'application/json'
	};

	if (options.accessToken) {
		headers['authorization'] = `Bearer ${options.accessToken}`;
	}

	if (options.body !== undefined) {
		headers['content-type'] = 'application/json';
	}

	try {
		const res = await fetch(`${baseUrl}${path}`, {
			method: options.method ?? 'GET',
			headers,
			body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
			signal: options.signal ?? AbortSignal.timeout(10000),
			redirect: 'error',
			cache: 'no-store'
		});

		let data: unknown = null;
		const text = await res.text();
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = text;
		}

		if (!res.ok) {
			const failure = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
			const error = typeof failure.error === 'string' ? failure.error : 'API_ERROR';
			const message =
				typeof failure.message === 'string'
					? failure.message
					: res.statusText || 'Terjadi kesalahan pada server API.';
			return {
				status: res.status,
				ok: false,
				data: null,
				error,
				message
			};
		}

		return {
			status: res.status,
			ok: true,
			data: data as T
		};
	} catch (err) {
		const isTimeout = err instanceof Error && err.name === 'TimeoutError';
		return {
			status: isTimeout ? 504 : 502,
			ok: false,
			data: null,
			error: isTimeout ? 'GATEWAY_TIMEOUT' : 'SERVICE_UNAVAILABLE',
			message: isTimeout
				? 'Permintaan ke API backend melebihi batas waktu (timeout).'
				: 'Gagal terhubung ke server API CryptoSharia.'
		};
	}
}

// ==========================================
// Academy Admin CMS API Methods (Package 4)
// ==========================================

export async function getAdminStats(accessToken: string) {
	return academyApiFetch<AdminStatsDto>('/academy/admin/stats', {
		accessToken
	});
}

export async function getAdminScopes(accessToken: string) {
	return academyApiFetch<ScopeDto[]>('/academy/admin/scopes', {
		accessToken
	});
}

export async function createAdminScope(payload: CreateScopePayload, accessToken: string) {
	return academyApiFetch<ScopeDto>('/academy/admin/scopes', {
		method: 'POST',
		accessToken,
		body: payload
	});
}

export async function updateAdminScope(
	id: string,
	payload: UpdateScopePayload,
	accessToken: string
) {
	return academyApiFetch<ScopeDto>(`/academy/admin/scopes/${encodeURIComponent(id)}`, {
		method: 'PUT',
		accessToken,
		body: payload
	});
}

export async function getAdminContent(
	params: { status?: string; kind?: string; subjectId?: string; scopeId?: string } = {},
	accessToken: string
) {
	const queryParts: string[] = [];
	if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
	if (params.kind) queryParts.push(`kind=${encodeURIComponent(params.kind)}`);
	if (params.subjectId) queryParts.push(`subjectId=${encodeURIComponent(params.subjectId)}`);
	if (params.scopeId) queryParts.push(`scopeId=${encodeURIComponent(params.scopeId)}`);
	const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

	return academyApiFetch<AdminContentDto[]>(`/academy/admin/content${query}`, {
		accessToken
	});
}

export async function getAdminContentById(id: string, accessToken: string) {
	return academyApiFetch<AdminContentDto>(`/academy/admin/content/${encodeURIComponent(id)}`, {
		accessToken
	});
}

export async function createAdminContent(payload: CreateContentPayload, accessToken: string) {
	return academyApiFetch<AdminContentDto>('/academy/admin/content', {
		method: 'POST',
		accessToken,
		body: payload
	});
}

export async function updateAdminContent(
	id: string,
	payload: UpdateContentPayload,
	accessToken: string
) {
	return academyApiFetch<AdminContentDto>(`/academy/admin/content/${encodeURIComponent(id)}`, {
		method: 'PUT',
		accessToken,
		body: payload
	});
}

export async function deleteAdminContentDraft(id: string, accessToken: string) {
	return academyApiFetch<void>(`/academy/admin/content/${encodeURIComponent(id)}`, {
		method: 'DELETE',
		accessToken
	});
}

export async function transitionAdminContent(
	id: string,
	payload: ContentTransitionPayload,
	accessToken: string
) {
	return academyApiFetch<AdminContentDto>(
		`/academy/admin/content/${encodeURIComponent(id)}/transition`,
		{
			method: 'POST',
			accessToken,
			body: payload
		}
	);
}

export async function setAdminLessonMedia(
	id: string,
	payload: SetLessonMediaPayload,
	accessToken: string
) {
	return academyApiFetch<MediaDto>(`/academy/admin/content/${encodeURIComponent(id)}/media`, {
		method: 'PUT',
		accessToken,
		body: payload
	});
}

export async function getAdminGrants(
	params: { userId?: string; scopeId?: string } = {},
	accessToken: string
) {
	const queryParts: string[] = [];
	if (params.userId) queryParts.push(`userId=${encodeURIComponent(params.userId)}`);
	if (params.scopeId) queryParts.push(`scopeId=${encodeURIComponent(params.scopeId)}`);
	const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

	return academyApiFetch<AdminGrantDto[]>(`/academy/admin/grants${query}`, {
		accessToken
	});
}

export async function createAdminGrant(payload: CreateGrantPayload, accessToken: string) {
	return academyApiFetch<AdminGrantDto>('/academy/admin/grants', {
		method: 'POST',
		accessToken,
		body: payload
	});
}

export async function revokeAdminGrant(id: string, accessToken: string) {
	return academyApiFetch<AdminGrantDto>(`/academy/admin/grants/${encodeURIComponent(id)}/revoke`, {
		method: 'PUT',
		accessToken
	});
}
