import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, CheckCircle2Icon, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { z } from 'zod'
import { Alert, AlertDescription } from '~/components/ui/alert'

import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH1, TypographyMuted } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'

const ValidationSchema = z.object({
	email: z.email('Invalid email address'),
	password: z
		.string({ error: 'Password is required' })
		.min(6, 'Password must be at least 6 characters long'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function LoginModule() {
	const { error, success } = useLoaderData()
	const fetcher = useFetcher<{ error: string }>()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { control, handleSubmit } = rhfMethods

	const onSubmit = handleSubmit(async (data) =>
		fetcher.submit(data, { method: 'post' }),
	)

	const isSubmitting = fetcher.state !== 'idle'

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-6">
					<Form {...rhfMethods}>
						<form onSubmit={onSubmit}>
							<FieldGroup>
								<div className="flex flex-col gap-4">
									<div className="flex size-10 items-center justify-center rounded-md bg-rose-600 text-white">
										<ShieldCheck className="size-6" />
									</div>
									<div>
										<TypographyH1>
											Welcome to{' '}
											<span className="text-rose-700">
												{APP_NAME.slice(0, 4)}
											</span>
											<span className="font-extrabold">
												{APP_NAME.slice(4)}
											</span>{' '}
											<span className="font-extrabold text-rose-700">
												Admin
											</span>
										</TypographyH1>
										<TypographyMuted className="mt-1">
											Sign in to your account to continue.
										</TypographyMuted>
									</div>
								</div>

								{success ? (
									<Alert className="bg-green-600 text-white">
										<CheckCircle2Icon />
										<AlertDescription className="text-white">
											{success}
										</AlertDescription>
									</Alert>
								) : null}
								{error ? (
									<Alert className="bg-red-600 text-white">
										<AlertCircleIcon />
										<AlertDescription className="text-white">
											{error}
										</AlertDescription>
									</Alert>
								) : null}

								<FormField
									name="email"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													{...field}
													placeholder="m@example.com"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="password"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<Input
													type="password"
													{...field}
													placeholder="* * * * * * * *"
												/>
											</FormControl>
											<FieldDescription>
												Forgot your password?{' '}
												<Link to="/forgot-your-password">Reset it</Link>
											</FieldDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Field>
									<Button
										size="lg"
										disabled={isSubmitting}
										className="bg-rose-600 hover:bg-rose-700"
									>
										{isSubmitting ? <Spinner /> : null}
										Login
									</Button>
								</Field>
							</FieldGroup>
						</form>
					</Form>
				</div>
			</div>
		</div>
	)
}
