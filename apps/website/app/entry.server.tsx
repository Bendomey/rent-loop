import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

const ABORT_DELAY = 5_000

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
) {
	return new Promise<Response>((resolve, reject) => {
		let shellRendered = false
		const userAgent = request.headers.get('user-agent')

		const { pipe, abort } = renderToPipeableStream(
			<ServerRouter context={routerContext} url={request.url} />,
			{
				[isbot(userAgent ?? '') ? 'onAllReady' : 'onShellReady']() {
					shellRendered = true
					const body = new PassThrough()
					const stream = createReadableStreamFromReadable(body)

					responseHeaders.set('Content-Type', 'text/html')
					responseHeaders.set('X-Frame-Options', 'DENY')
					responseHeaders.set('X-Content-Type-Options', 'nosniff')
					responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
					responseHeaders.set(
						'Strict-Transport-Security',
						'max-age=31536000; includeSubDomains; preload',
					)
					responseHeaders.set(
						'Permissions-Policy',
						'camera=(), microphone=(), geolocation=()',
					)

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					)

					pipe(body)
				},
				onShellError(error: unknown) {
					reject(error)
				},
				onError(error: unknown) {
					responseStatusCode = 500
					if (shellRendered) {
						console.error(error)
					}
				},
			},
		)

		setTimeout(abort, ABORT_DELAY)
	})
}
