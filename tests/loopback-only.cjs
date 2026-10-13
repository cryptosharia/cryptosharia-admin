// Only the isolated test server is started with this preload.
const allowedOrigins = new Set(JSON.parse(process.env.P01_ALLOWED_ORIGINS || '[]'));
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
	const url = new URL(input instanceof Request ? input.url : input);
	if (!allowedOrigins.has(url.origin)) {
		throw new Error('P01 test blocked a fetch outside the isolated loopback origins');
	}
	return nativeFetch(input, init);
};
