import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	GalleryVerticalEnd,
} from 'lucide-react'
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
import { TypographyH1 } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import { cn } from '~/lib/utils'

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
				<div className={cn('flex flex-col gap-6')}>
					<Form {...rhfMethods}>
						<form onSubmit={onSubmit}>
							<FieldGroup>
								<div className="flex flex-col gap-2">
									<div className="flex flex-col gap-2 font-medium">
										<div className="flex size-8 items-center justify-center rounded-md">
											<GalleryVerticalEnd className="size-10" />
										</div>
										<span className="sr-only">{APP_NAME}.</span>
									</div>

									<TypographyH1 className="mt-4">
										Welcome to{' '}
										<span className="text-rose-700">
											{APP_NAME.slice(0, 4)}
										</span>{' '}
										<span className="font-extrabold">{APP_NAME.slice(4)}</span>
									</TypographyH1>
									<FieldDescription>
										Don&apos;t have an account?{' '}
										<Link to="/apply">Apply as landlord/real estate</Link>
									</FieldDescription>
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
					<FieldDescription className="px-6 text-center">
						By clicking continue, you agree to our{' '}
						<a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
					</FieldDescription>
				</div>
			</div>
		</div>
	)
}
