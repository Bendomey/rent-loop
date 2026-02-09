import { config } from 'dotenv'
import * as z from 'zod'

// Load environment variables from .env file
config()

const environmentSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test', 'staging'])
		.default('development'),
	API_ADDRESS: z.string().min(1).default('http://localhost:5000/api'),
	SENTRY_DSN: z.string().min(1).default('fake_dsn_for_dev'),
	CF_ACCOUNT_ID: z.string().min(1),
	BUCKET_NAME: z.string().min(1),
	R2_ACCESS_KEY_ID: z.string().min(1),
	R2_SECRET_ACCESS_KEY: z.string().min(1),
	RENTLOOP_IMAGES_BASE_URL: z.url().min(1),
})

const environmentVariables = () => environmentSchema.parse(process.env)

export { environmentVariables }
