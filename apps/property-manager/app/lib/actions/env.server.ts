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
	GOOGLE_MAPS_API_KEY: z.string().min(1).default('fake-api-key'),
})

const environmentVariables = () => environmentSchema.parse(process.env)

export { environmentVariables }
