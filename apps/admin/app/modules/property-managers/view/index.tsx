import {
	ArrowLeft,
	Building2,
	Calendar,
	Globe,
	Mail,
	MapPin,
	Phone,
	User,
} from 'lucide-react'
import type { ElementType } from 'react'
import { Link, useLoaderData } from 'react-router'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import type { loader } from '~/routes/_auth._dashboard.property-managers_.$managerId'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
	'ClientApplication.Status.Approved': {
		label: 'Approved',
		className:
			'border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
	},
	'ClientApplication.Status.Pending': {
		label: 'Pending',
		className:
			'border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
	},
	'ClientApplication.Status.Rejected': {
		label: 'Rejected',
		className: 'border-destructive/40 bg-destructive/5 text-destructive',
	},
} as const

function InfoRow({
	icon: Icon,
	label,
	value,
	href,
}: {
	icon: ElementType
	label: string
	value: string | null | undefined
	href?: string
}) {
	if (!value) return null
	return (
		<div className="flex items-start gap-3">
			<Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
			<div className="min-w-0">
				<p className="text-muted-foreground text-xs">{label}</p>
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noreferrer"
						className="text-primary truncate text-sm font-medium hover:underline"
					>
						{value}
					</a>
				) : (
					<p className="truncate text-sm font-medium">{value}</p>
				)}
			</div>
		</div>
	)
}

function SectionCard({
	title,
	icon: Icon,
	children,
}: {
	title: string
	icon: ElementType
	children: React.ReactNode
}) {
	return (
		<Card className="shadow-none">
			<CardHeader className="-mb-3">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<Icon className="text-muted-foreground size-4" />
					{title}
				</CardTitle>
			</CardHeader>
			<Separator />
			<CardContent className="flex flex-col gap-4 pt-1">{children}</CardContent>
		</Card>
	)
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export function PropertyManagerDetailModule() {
	const { manager } = useLoaderData<typeof loader>()

	if (!manager) {
		return (
			<main className="flex items-center justify-center py-20">
				<TypographyMuted>Property manager not found.</TypographyMuted>
			</main>
		)
	}

	const statusConfig = STATUS_CONFIG[manager.status]
	const isCompany = manager.type === 'COMPANY'
	const subTypeLabel = manager.sub_type.replace(/_/g, ' ')

	return (
		<main className="flex flex-col gap-6 px-4 py-8 md:px-8">
			{/* Page header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/property-managers">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-semibold">{manager.name}</h1>
					<TypographyMuted className="text-sm">
						{manager.type} · {subTypeLabel}
					</TypographyMuted>
				</div>
			</div>

			<div className="grid grid-cols-12 gap-6">
				{/* ----------------------------------------------------------------
				    Left sidebar — profile card
				---------------------------------------------------------------- */}
				<div className="col-span-12 lg:col-span-4">
					<Card className="shadow-none">
						<CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
							<Avatar className="size-20">
								<AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
									{getNameInitials(manager.name)}
								</AvatarFallback>
							</Avatar>

							<div className="space-y-1">
								<p className="text-base font-semibold">{manager.name}</p>
								<TypographyMuted className="text-sm">
									{subTypeLabel}
								</TypographyMuted>
							</div>

							<Badge variant="outline" className={statusConfig.className}>
								{statusConfig.label}
							</Badge>

							{manager.description && (
								<>
									<Separator className="w-full" />
									<p className="text-muted-foreground text-left text-xs leading-relaxed">
										{manager.description}
									</p>
								</>
							)}

							<Separator className="w-full" />

							<div className="flex w-full flex-col gap-3 text-left">
								<InfoRow
									icon={Calendar}
									label="Applied"
									value={localizedDayjs(manager.created_at).format(
										'MMM D, YYYY',
									)}
								/>
								<InfoRow
									icon={Calendar}
									label="Last updated"
									value={localizedDayjs(manager.updated_at).fromNow()}
								/>
								<InfoRow
									icon={MapPin}
									label="Location"
									value={[manager.city, manager.region, manager.country]
										.filter(Boolean)
										.join(', ')}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ----------------------------------------------------------------
				    Right column — detail cards
				---------------------------------------------------------------- */}
				<div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
					{/* Contact */}
					<SectionCard title="Contact Information" icon={User}>
						<InfoRow
							icon={User}
							label="Contact name"
							value={manager.contact_name}
						/>
						<InfoRow icon={Mail} label="Email" value={manager.contact_email} />
						<InfoRow
							icon={Phone}
							label="Phone"
							value={manager.contact_phone_number}
						/>
						{(manager.support_email || manager.support_phone) && (
							<>
								<Separator />
								<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
									Support
								</p>
								<InfoRow
									icon={Mail}
									label="Support email"
									value={manager.support_email}
								/>
								<InfoRow
									icon={Phone}
									label="Support phone"
									value={manager.support_phone}
								/>
							</>
						)}
						<InfoRow
							icon={Globe}
							label="Website"
							value={manager.website_url}
							href={manager.website_url ?? undefined}
						/>
					</SectionCard>

					{/* Address */}
					<SectionCard title="Address" icon={MapPin}>
						<InfoRow
							icon={MapPin}
							label="Street address"
							value={manager.address}
						/>
						<div className="grid grid-cols-2 gap-4">
							<InfoRow icon={MapPin} label="City" value={manager.city} />
							<InfoRow icon={MapPin} label="Region" value={manager.region} />
						</div>
						<InfoRow icon={MapPin} label="Country" value={manager.country} />
					</SectionCard>

					{/* Company or Individual identity */}
					{isCompany && manager.registration_number ? (
						<SectionCard title="Business Details" icon={Building2}>
							<InfoRow
								icon={Building2}
								label="Registration number"
								value={manager.registration_number}
							/>
						</SectionCard>
					) : !isCompany && (manager.id_type ?? manager.id_number) ? (
						<SectionCard title="Identity" icon={User}>
							<InfoRow
								icon={User}
								label="ID type"
								value={manager.id_type?.replace(/_/g, ' ') ?? null}
							/>
							<InfoRow
								icon={User}
								label="ID number"
								value={manager.id_number}
							/>
							<InfoRow
								icon={Calendar}
								label="ID expiry"
								value={
									manager.id_expiry
										? localizedDayjs(manager.id_expiry).format('MMM D, YYYY')
										: null
								}
							/>
						</SectionCard>
					) : null}

					{/* Rejection reason — only shown when rejected */}
					{manager.status === 'ClientApplication.Status.Rejected' &&
						manager.rejected_because && (
							<Card className="border-destructive/30 shadow-none">
								<CardHeader className="pb-3">
									<CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
										Rejection Reason
									</CardTitle>
								</CardHeader>
								<Separator />
								<CardContent className="pt-4">
									<p className="text-muted-foreground text-sm leading-relaxed">
										{manager.rejected_because}
									</p>
								</CardContent>
							</Card>
						)}
				</div>
			</div>
		</main>
	)
}
