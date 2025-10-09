import * as z from 'zod'

const environmentSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test', 'staging'])
		.default('development'),
	API_ADDRESS: z.string().min(1),
	SENTRY_DSN: z.string().min(1).optional(),
})

const environmentVariables = () => environmentSchema.parse(process.env)

export { environmentVariables }
