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

export function ResetYourPasswordModule() {
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

								<TypographyH1>Reset Your Password</TypographyH1>
								<TypographyMuted>
									Set a new password for your account. Make sure it's strong and
									secure to keep your account safe.
								</TypographyMuted>
							</div>
							<Field className="mt-5">
								<FieldLabel htmlFor="password">New Password</FieldLabel>
								<Input
									id="password"
									type="password"
									placeholder="* * * * * * * *"
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="confirm_password">
									Confirm Password
								</FieldLabel>
								<Input
									id="confirm_password"
									type="password"
									placeholder="* * * * * * * *"
									required
								/>
								<FieldDescription>
									Didn't request this? <Link to="/login">Login</Link>
								</FieldDescription>
							</Field>
							<Field className="">
								<Button
									type="submit"
									size="lg"
									className="bg-rose-600 hover:bg-rose-700"
								>
									Save New Password
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
