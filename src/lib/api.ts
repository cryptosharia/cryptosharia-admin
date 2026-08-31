import createClient from 'openapi-fetch';
import type { paths } from '$lib/api-types';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Factory untuk membuat API Client.
 */
export const createApiClient = (
	options: {
		fetch?: typeof fetch;
		apiKey?: string;
		accessToken?: string;
	} = {}
) => {
	const headers: Record<string, string> = {};

	// Gunakan apiKey dari options, atau fallback ke CS_API_KEY dari .env
	const apiKey = options.apiKey || privateEnv.CS_API_KEY;
	if (apiKey) headers['Api-Key'] = apiKey;

	if (options.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

	return createClient<paths>({
		baseUrl: publicEnv.PUBLIC_CS_API_URL,
		fetch: options.fetch,
		headers
	});
};
