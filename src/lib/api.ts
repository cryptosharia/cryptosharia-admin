import createClient from 'openapi-fetch';
import type { paths } from '$lib/api-types';
import { PUBLIC_CS_API_URL } from '$env/static/public';
import { CS_API_KEY } from '$env/static/private';

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
	const apiKey = options.apiKey || CS_API_KEY;
	if (apiKey) headers['Api-Key'] = apiKey;
	
	if (options.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;

	return createClient<paths>({
		baseUrl: PUBLIC_CS_API_URL,
		fetch: options.fetch,
		headers
	});
};
