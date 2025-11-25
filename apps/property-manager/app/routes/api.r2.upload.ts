import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import type { Route } from './+types/api.r2.upload'
import { environmentVariables } from '~/lib/actions/env.server'

export async function action({ request }: Route.ActionArgs) {
	const env = environmentVariables()
	try {
		const client = new S3Client({
			endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			region: 'auto',
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			},
		})

		const form = await request.formData()
		const file = form.get('file')
		const objectKey = form.get('objectKey')

		if (
			!objectKey ||
			!file ||
			typeof file !== 'object' ||
			typeof objectKey !== 'string'
		) {
			return new Response(JSON.stringify({ error: 'Invalid request' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const arrayBuffer = await (file as File).arrayBuffer()

		const command = new PutObjectCommand({
			Bucket: env.BUCKET_NAME,
			Key: objectKey,
			Body: Buffer.from(arrayBuffer),
			ContentType: file.type,
		})

		await client.send(command)

		return new Response(
			JSON.stringify({
				url: `${env.RENTLOOP_IMAGES_BASE_URL}/${objectKey}`,
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		// TODO: sentry capture can be added here for better error tracking
		console.error('Error uploading file to R2:', error)
		return new Response(JSON.stringify({ error: 'FailedToUploadFileToR2' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500,
		})
	}
}
