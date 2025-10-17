import * as z from 'zod'

const environmentSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test', 'staging'])
		.default('development'),
	API_ADDRESS: z.string().min(1).default('http://localhost:3000/api'),
	SENTRY_DSN: z.string().min(1).default('fake_dsn_for_dev'),
})

const environmentVariables = () => environmentSchema.parse(process.env)

export { environmentVariables }
