import { Separator } from '@radix-ui/react-separator'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import UpdatePasswordModal from './components/update-password'
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
import { useAuth } from '~/providers/auth-provider'
import { UpdateClientEmail } from './update-email'
import { useSendOtp } from '~/hooks/use-send-otp'
import { Label } from '~/components/ui/label'
import { safeString } from '~/lib/strings'
import UpdateClientProfileModal from './components/update-name'
import { getNameInitials } from '~/lib/misc'

export function MyAccountSettingsModule() {
	const [openUpdatePasswordModal, setOpenUpdatePasswordModal] = useState(false)
	const [openUpdateClientEmailModal, setOpenUpdateClientEmailModal] =
		useState(false)
	const [openUpdateClientProfileModal, setOpenUpdateClientProfileModal] =
		useState(false)
	const { currentUser } = useAuth()
	const { sendOtp, isSendingOtp } = useSendOtp()

	return (
		<div className="mx-auto max-w-3xl px-4 py-4">
			<TypographyH3 className="">My Profile</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-10">
				<div className="mb-8 flex items-center">
					<Avatar className="size-20">
						{/* <AvatarImage src="https://github.com/shadcn.png" alt="profile image" /> */}
						<AvatarFallback className="bg-rose-500 text-white">
							{getNameInitials(safeString(currentUser?.name))}
						</AvatarFallback>
					</Avatar>

					{/* <div className="ml-3.5 flex flex-col">
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
					</div> */}
				</div>

				<div className="flex items-baseline-last justify-between">
					<FieldGroup className="w-2/5 space-y-4">
						<Field>
							<FieldLabel htmlFor="full_name">Full Name</FieldLabel>
							<Input
								id="full_name"
								type="text"
								placeholder="Enter your full name"
								value={safeString(currentUser?.name)}
								disabled
							/>
						</Field>
					</FieldGroup>

					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => setOpenUpdateClientProfileModal(true)}
					>
						Change Name
					</Button>
				</div>
			</section>

			<TypographyH3 className="mt-8">Account Security</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-6">
				<div className="mb-6 flex items-baseline-last justify-between">
					<Field className="w-2/5">
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="account@email.com"
							value={currentUser?.email ?? ''}
							disabled
						/>
					</Field>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							sendOtp({ channel: 'EMAIL', email: currentUser?.email ?? '' })
							setOpenUpdateClientEmailModal(true)
						}}
					>
						{isSendingOtp ? 'Sending...' : 'Change email'}
					</Button>
				</div>

				<div className="mb-6 flex items-baseline-last justify-between">
					<Field className="w-2/5">
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							disabled
						/>
					</Field>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => setOpenUpdatePasswordModal(true)}
					>
						Change password
					</Button>
				</div>
				{/* <div className="">
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
				</div> */}
			</section>

			{/* <TypographyH3 className="mt-12">Support Access</TypographyH3>
			<Separator className="bg-muted mt-2 mb-4 h-0.5" />

			<section className="mx-auto mb-5 space-y-6">
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
			</section> */}

			<UpdateClientProfileModal
				opened={openUpdateClientProfileModal}
				setOpened={setOpenUpdateClientProfileModal}
				client={currentUser}
			/>
			<UpdatePasswordModal
				opened={openUpdatePasswordModal}
				setOpened={setOpenUpdatePasswordModal}
			/>
			<UpdateClientEmail
				opened={openUpdateClientEmailModal}
				setOpened={setOpenUpdateClientEmailModal}
			/>
		</div>
	)
}
