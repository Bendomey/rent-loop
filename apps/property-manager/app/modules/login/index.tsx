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
import { TypographyH1 } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import { cn } from '~/lib/utils'

export function LoginModule() {
	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className={cn('flex flex-col gap-6')}>
					<form>
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
									<span className="text-rose-700">{APP_NAME.slice(0, 4)}</span>{' '}
									<span className="font-extrabold">{APP_NAME.slice(4)}</span>
								</TypographyH1>
								<FieldDescription>
									Don&apos;t have an account?{' '}
									<Link to="/apply">Apply as landlord/real estate</Link>
								</FieldDescription>
							</div>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input
									id="password"
									type="password"
									placeholder="* * * * * * * *"
									required
								/>
								<FieldDescription>
									Forgotten your password? Reset it{' '}
									<Link to="/forgot-your-password">here</Link>.
								</FieldDescription>
							</Field>
							<Field>
								<Button
									type="submit"
									size="lg"
									className="bg-rose-600 hover:bg-rose-700"
								>
									Login
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
