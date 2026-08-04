import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher, useLoaderData, useSearchParams } from 'react-router'

import { z } from 'zod'
import { ExternalLink } from '~/components/external-link'
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
import { cn } from '~/lib/utils'

const ValidationSchema = z
	.object({
		password: z
			.string({ error: 'Password is required' })
			.min(6, 'Password must be at least 6 characters long'),
		confirmPassword: z
			.string({ error: 'Confirm Password is required' })
			.min(6, 'Confirm Password must be at least 6 characters long'),
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Passwords do not match',
				path: ['confirmPassword'],
			})
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

export function ResetYourPasswordModule() {
	const [searchParams] = useSearchParams()
	const { error, success, rentLoopWebsiteUrl } = useLoaderData()
	const fetcher = useFetcher<{ error: string }>()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { control, handleSubmit } = rhfMethods

	const onSubmit = handleSubmit(async (data) =>
		fetcher.submit(
			{ ...data, token: searchParams.get('token') },
			{ method: 'post' },
		),
	)

	const isSubmitting = fetcher.state !== 'idle'

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className={cn('flex flex-col gap-6')}>
					<Form {...rhfMethods}>
						<form onSubmit={onSubmit}>
							<FieldGroup>
								<div className="flex flex-col gap-3">
									<div className="flex flex-col gap-2 font-medium">
										<TypographyH1 className="mt-4 text-7xl font-black text-rose-600 md:text-7xl">
											rl<span className="text-black">.</span>
										</TypographyH1>
									</div>

									<TypographyH1>Reset Your Password</TypographyH1>
									<TypographyMuted>
										Set a new password for your account. Make sure it's strong
										and secure to keep your account safe.
									</TypographyMuted>
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
									name="password"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>New Password</FormLabel>
											<FormControl>
												<Input
													type="password"
													{...field}
													placeholder="* * * * * * * *"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="confirmPassword"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Confirm Password</FormLabel>
											<FormControl>
												<Input
													type="password"
													{...field}
													placeholder="* * * * * * * *"
												/>
											</FormControl>
											<FormMessage />
											<FieldDescription>
												Didn't request this? <Link to="/login">Login</Link>
											</FieldDescription>
										</FormItem>
									)}
								/>

								<Field className="">
									<Button
										disabled={isSubmitting}
										size="lg"
										className="bg-rose-600 hover:bg-rose-700"
									>
										{isSubmitting ? <Spinner /> : null}
										Save New Password
									</Button>
								</Field>
							</FieldGroup>
						</form>
					</Form>
					<FieldDescription className="px-6 text-center">
						By clicking continue, you agree to our{' '}
						<ExternalLink to={`${rentLoopWebsiteUrl}/terms`}>
							Terms of Service
						</ExternalLink>{' '}
						and{' '}
						<ExternalLink to={`${rentLoopWebsiteUrl}/privacy-policy`}>
							Privacy Policy
						</ExternalLink>
						.
					</FieldDescription>
				</div>
			</div>
		</div>
	)
}
