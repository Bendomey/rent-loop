import { Check, Copy, ExternalLink, Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)
	const handleCopy = () => {
		void navigator.clipboard.writeText(text).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		})
	}
	return (
		<button
			onClick={handleCopy}
			className="text-muted-foreground hover:text-foreground transition-colors"
		>
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
		</button>
	)
}

function DetailRow({
	label,
	value,
}: {
	label: string
	value: string | null | undefined
}) {
	if (!value) return null
	return (
		<div className="flex items-center justify-between gap-4 py-1">
			<span className="text-muted-foreground text-xs">{label}</span>
			<div className="flex items-center gap-1.5">
				<span className="text-xs font-medium">{value}</span>
				<CopyButton text={value} />
			</div>
		</div>
	)
}

export function GuestCard({
	guest,
	propertyId,
}: {
	guest: Tenant | null | undefined
	propertyId: string
}) {
	if (!guest) return null

	const initials =
		`${guest.first_name?.[0] ?? ''}${guest.last_name?.[0] ?? ''}`.toUpperCase()
	const fullName = `${guest.first_name} ${guest.last_name}`.trim()

	return (
		<Card className="shadow-none">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
						Guest
					</CardTitle>
					<Link
						to={`/properties/${propertyId}/occupancy/tenants/${guest.id}`}
						className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
					>
						View profile
						<ExternalLink className="size-3" />
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Avatar + name */}
				<div className="flex items-center gap-3">
					<Avatar className="size-11">
						<AvatarImage
							src={guest.profile_photo_url ?? undefined}
							alt={fullName}
						/>
						<AvatarFallback className="bg-rose-100 text-sm font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
							{initials || <User className="size-4" />}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-sm font-semibold">{fullName}</p>
						{guest.current_address ? (
							<p className="text-muted-foreground text-xs">
								{guest.current_address}
							</p>
						) : null}
					</div>
				</div>

				{/* Contact action buttons */}
				<div className="grid grid-cols-3 gap-2">
					<Button variant="outline" size="sm" className="text-xs" asChild>
						<a href={`tel:${guest.phone}`}>
							<Phone className="size-3" />
							Call
						</a>
					</Button>
					<Button variant="outline" size="sm" className="text-xs" asChild>
						<a href={`mailto:${guest.email}`}>
							<Mail className="size-3" />
							Email
						</a>
					</Button>
					<Button variant="outline" size="sm" className="text-xs" asChild>
						<a href={`sms:${guest.phone}`}>
							<Phone className="size-3" />
							Message
						</a>
					</Button>
				</div>

				<Separator />

				{/* Detail rows */}
				<div>
					<DetailRow label="Phone" value={guest.phone} />
					<DetailRow label="Email" value={guest.email} />
					<DetailRow label="ID Number" value={guest.id_number} />
				</div>
			</CardContent>
		</Card>
	)
}
