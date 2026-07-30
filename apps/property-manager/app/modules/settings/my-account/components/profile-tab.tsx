import { Camera, Pencil } from 'lucide-react'
import { PLACEHOLDER_EMAIL_VERIFIED } from '../placeholder-data'
import {
	AccountPanel,
	AccountRow,
	MutedBadge,
	SuccessBadge,
	comingSoon,
} from './account-ui'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'

interface Props {
	name: string
	email: string
	initials: string
	onChangeName: () => void
	onUploadPhoto: () => void
	onRemovePhoto: () => void
}

export function ProfileTab({
	name,
	email,
	initials,
	onChangeName,
	onUploadPhoto,
	onRemovePhoto,
}: Props) {
	return (
		<div className="flex flex-col gap-5">
			<AccountPanel caption="Profile photo">
				<div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
					<div className="relative shrink-0">
						<Avatar className="size-23">
							<AvatarFallback className="bg-primary font-serif text-3xl text-white">
								{initials}
							</AvatarFallback>
						</Avatar>
						<button
							type="button"
							onClick={onUploadPhoto}
							aria-label="Upload profile photo"
							className="bg-background absolute -right-0.5 -bottom-0.5 flex size-8 cursor-pointer items-center justify-center rounded-full border shadow-sm"
						>
							<Camera className="size-4" />
						</button>
					</div>

					<div className="flex-1">
						<p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
							Upload a square image, at least 200×200px. JPG or PNG, up to 2MB.
							Without one we show your initials.
						</p>
						<div className="mt-3.5 flex flex-wrap gap-2.5">
							<Button size="sm" onClick={onUploadPhoto}>
								Upload photo
							</Button>
							<Button variant="outline" size="sm" onClick={onRemovePhoto}>
								Remove
							</Button>
						</div>
					</div>
				</div>
			</AccountPanel>

			<AccountPanel caption="Basic information" className="pb-1">
				<AccountRow
					label="Full name"
					value={name}
					action={
						<Button variant="outline" size="sm" onClick={onChangeName}>
							<Pencil /> Change name
						</Button>
					}
				/>
				<AccountRow
					label="Email address"
					value={email}
					tone={
						PLACEHOLDER_EMAIL_VERIFIED ? (
							<SuccessBadge>Verified</SuccessBadge>
						) : (
							<MutedBadge>Unverified</MutedBadge>
						)
					}
					action={
						<Button
							variant="outline"
							size="sm"
							onClick={comingSoon('Email updates')}
						>
							<Pencil /> Change email
						</Button>
					}
					last
				/>
			</AccountPanel>
		</div>
	)
}
