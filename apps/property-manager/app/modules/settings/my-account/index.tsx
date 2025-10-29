import { Separator } from '@radix-ui/react-separator'
import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { TypographyH3, TypographyP } from '~/components/ui/typography'

export function MyAccountSettingsModule() {
	return (
		<div className="px-4 py-4">
			<TypographyH3 className="">My Profile</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-10">
				<div className="mb-8 flex items-center">
					<Avatar className="size-20">
						<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
						<AvatarFallback>CN</AvatarFallback>
					</Avatar>

					<div className="ml-3.5 flex flex-col">
						<div className="flex flex-wrap items-center gap-3 md:flex-row">
							<Button variant="outline" size="sm">
								<Plus /> Change Image
							</Button>
							<Button
								variant="default"
								className="bg-rose-600 hover:bg-rose-700"
							>
								Remove Image
							</Button>
						</div>
						<TypographyP className="!mt-2 text-xs text-gray-400">
							We support PNGs, JPEGs, and GIFs under 2MB
						</TypographyP>
					</div>
				</div>

				<div>
					<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="first_name">First Name</FieldLabel>
							<Input
								id="first_name"
								type="text"
								placeholder="Enter your first name"
								value="John"
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="last_name">Last Name</FieldLabel>
							<Input
								id="last_name"
								type="text"
								placeholder="Enter your last name"
								value="Doe"
								required
							/>
						</Field>
					</FieldGroup>
				</div>
			</section>

			<TypographyH3 className="mt-10">Account Security</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-10">
				<div className="mb-6 flex items-baseline-last justify-between">
					<Field className="w-2/5">
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="text"
							placeholder="account@email.com"
							disabled
						/>
					</Field>

					<Button size="sm" variant="secondary">
						Change email
					</Button>
				</div>

				<div className="mb-6 flex items-center justify-between">
					<Field className="w-2/5">
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							disabled
						/>
					</Field>
					<Button size="sm" variant="secondary">
						Change password
					</Button>
				</div>

				<div className="">
					<Field orientation="horizontal" className="flex items-baseline-last">
						<FieldContent>
							<FieldLabel htmlFor="2fa">2-Step Verifications</FieldLabel>
							<FieldDescription>
								Add an additional layer of security to your account during
								login.
							</FieldDescription>
						</FieldContent>
						<Switch id="2fa" checked />
					</Field>
				</div>
			</section>

			<TypographyH3 className="mt-12">Support Access</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-10">
				<div className="flex items-center justify-between">
					<Field className="">
						<FieldLabel htmlFor="support_access">Support Access</FieldLabel>
						<FieldDescription>
							Allow support agents to access your account to help troubleshoot
							issues.
						</FieldDescription>
					</Field>
					<Switch id="support_access" />
				</div>

				<div className="flex items-center justify-between">
					<Field className="">
						<FieldLabel htmlFor="logout_all_devices">
							Log out of all devices
						</FieldLabel>
						<FieldDescription>
							Log out of all other active sessions when changing your password.
						</FieldDescription>
					</Field>
					<Button size="sm" variant="secondary">
						Log out
					</Button>
				</div>

				<div className="flex items-center justify-between">
					<Field className="">
						<FieldLabel htmlFor="delete_account" className="text-rose-600">
							Delete my Account
						</FieldLabel>
						<FieldDescription>
							Permanetly delete your account and all associated data.
						</FieldDescription>
					</Field>
					<Button size="sm" variant="secondary">
						Delete Account
					</Button>
				</div>
			</section>
		</div>
	)
}
