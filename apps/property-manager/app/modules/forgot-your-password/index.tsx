import { GalleryVerticalEnd } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '~/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { TypographyH1, TypographyMuted } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import { cn } from '~/lib/utils'

export function ForgotYourPasswordModule() {
	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className={cn('flex flex-col gap-6')}>
					<form>
						<FieldGroup>
							<div className="flex flex-col gap-3">
								<div className="mb-4 flex flex-col gap-2 font-medium">
									<div className="flex size-8 items-center justify-center rounded-md">
										<GalleryVerticalEnd className="size-16" />
									</div>
									<span className="sr-only">{APP_NAME}.</span>
								</div>

								<TypographyH1>Forgot Your Password?</TypographyH1>
								<TypographyMuted>
									Sorry you're in this position. Good news is we can help you
									fix this. Enter your email address below and we'll send you a
									link to reset your password.
								</TypographyMuted>
							</div>
							<Field className="mt-5">
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
								/>
								<FieldDescription>
									Remember your password? <Link to="/login">Login</Link>
								</FieldDescription>
							</Field>
							<Field className="">
								<Button
									type="submit"
									size="lg"
									className="bg-rose-600 hover:bg-rose-700"
								>
									Send Reset Link
								</Button>
							</Field>
						</FieldGroup>
					</form>
					<FieldDescription className="px-6 text-center">
						By clicking continue, you agree to our{' '}
						<a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
					</FieldDescription>
				</div>
			</div>
		</div>
	)
}
