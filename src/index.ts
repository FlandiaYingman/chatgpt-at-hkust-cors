/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

const METHOD_NOT_ALLOWED = new Response(null, {
	status: 405,
	statusText: 'Method Not Allowed',
});

// The URL for the remote third party API you want to fetch from
// but does not implement CORS
const API_URL = 'https://hkust.azure-api.net';

const handler: ExportedHandler = {
	fetch: async function(request) {
		async function handleRequest(request: Request) {
			const originURL = new URL(request.url);
			const redirectedURL = new URL(API_URL);
			redirectedURL.search = originURL.search;
			redirectedURL.pathname = originURL.pathname;

			// @ts-ignore
			// Don't know why "as RequestInit" is not working, suppress the error for now.
			request = new Request(redirectedURL, request as RequestInit);

			// Rewrite "Host".
			request.headers.set('Host', originURL.host);

			// Azure API Bug: Sometimes empty response is returned if "Origin" header is present
			// https://stackoverflow.com/questions/52068217/api-management-return-empty-response-if-origin-header-is-present
			request.headers.delete('Origin');

			// Log the Request with Headers
			console.log('request', request.method, request.url);
			console.log('request headers', request.headers);

			let response = await fetch(request);
			response = new Response(response.body, response);

			// Set CORS headers
			response.headers.set('Access-Control-Allow-Origin', originURL.origin);

			// Append to/Add Vary header so browser will cache response correctly
			response.headers.append('Vary', 'Origin');

			// Log the Response with Headers
			console.log('response', response.status, response.statusText, response.url);
			console.log('response headers', response.headers);

			return response;
		}

		async function handleOptions(request: Request) {
			if (
				request.headers.get('Origin') !== null &&
				request.headers.get('Access-Control-Request-Method') !== null &&
				request.headers.get('Access-Control-Request-Headers') !== null
			) {
				const corsHeaders = {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
					'Access-Control-Max-Age': '86400',
				};
				// Handle CORS preflight requests.
				return new Response(null, {
					headers: {
						...corsHeaders,
						'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') ?? '',
					},
				});
			} else {
				// Handle standard OPTIONS request.
				return new Response(null, {
					headers: {
						Allow: 'GET, HEAD, POST, OPTIONS',
					},
				});
			}
		}

		if (['OPTIONS'].includes(request.method)) {
			// Handle CORS preflight requests
			return handleOptions(request);
		} else if (['GET', 'POST', 'HEAD'].includes(request.method)) {
			// Handle requests to the API server
			return handleRequest(request);
		} else {
			return METHOD_NOT_ALLOWED;
		}
	},
};

// noinspection JSUnusedGlobalSymbols
export default handler;
