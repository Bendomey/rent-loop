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
import { ApplicationStatus } from '../status'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import type { loader } from '~/routes/_auth._dashboard.applications_.$applicationId'

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

export function ApplicationDetailModule() {
	const { application } = useLoaderData<typeof loader>()

	if (!application) {
		return (
			<main className="flex items-center justify-center py-20">
				<TypographyMuted>Application not found.</TypographyMuted>
			</main>
		)
	}

	const statusConfig =
		STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]
	const isCompany = application.type === 'COMPANY'
	const subTypeLabel = application.sub_type.replace(/_/g, ' ')

	return (
		<main className="flex flex-col gap-6 px-4 py-8 md:px-8">
			{/* Page header */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Link to="/applications">
						<ArrowLeft className="size-4" />
					</Link>
					<div>
						<h1 className="text-xl font-semibold">{application.name}</h1>
						<TypographyMuted className="text-sm">
							{application.type} · {subTypeLabel}
						</TypographyMuted>
					</div>
				</div>
				<ApplicationStatus application={application} />
			</div>

			<div className="grid grid-cols-12 gap-6">
				{/* Left sidebar — profile card */}
				<div className="col-span-12 lg:col-span-4">
					<Card className="shadow-none">
						<CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
							<Avatar className="size-20">
								<AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
									{getNameInitials(application.name)}
								</AvatarFallback>
							</Avatar>

							<div className="space-y-1">
								<p className="text-base font-semibold">{application.name}</p>
								<TypographyMuted className="text-sm">
									{subTypeLabel}
								</TypographyMuted>
							</div>

							{statusConfig && (
								<Badge variant="outline" className={statusConfig.className}>
									{statusConfig.label}
								</Badge>
							)}

							{application.description && (
								<>
									<Separator className="w-full" />
									<p className="text-muted-foreground text-left text-xs leading-relaxed">
										{application.description}
									</p>
								</>
							)}

							<Separator className="w-full" />

							<div className="flex w-full flex-col gap-3 text-left">
								<InfoRow
									icon={Calendar}
									label="Submitted"
									value={localizedDayjs(application.created_at).format(
										'MMM D, YYYY',
									)}
								/>
								<InfoRow
									icon={Calendar}
									label="Last updated"
									value={localizedDayjs(application.updated_at).fromNow()}
								/>
								<InfoRow
									icon={MapPin}
									label="Location"
									value={[
										application.city,
										application.region,
										application.country,
									]
										.filter(Boolean)
										.join(', ')}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column — detail cards */}
				<div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
					{/* Contact */}
					<SectionCard title="Contact Information" icon={User}>
						<InfoRow
							icon={User}
							label="Contact name"
							value={application.contact_name}
						/>
						<InfoRow
							icon={Mail}
							label="Email"
							value={application.contact_email}
						/>
						<InfoRow
							icon={Phone}
							label="Phone"
							value={application.contact_phone_number}
						/>
						{(application.support_email || application.support_phone) && (
							<>
								<Separator />
								<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
									Support
								</p>
								<InfoRow
									icon={Mail}
									label="Support email"
									value={application.support_email}
								/>
								<InfoRow
									icon={Phone}
									label="Support phone"
									value={application.support_phone}
								/>
							</>
						)}
						<InfoRow
							icon={Globe}
							label="Website"
							value={application.website_url}
							href={application.website_url ?? undefined}
						/>
					</SectionCard>

					{/* Address */}
					<SectionCard title="Address" icon={MapPin}>
						<InfoRow
							icon={MapPin}
							label="Street address"
							value={application.address}
						/>
						<div className="grid grid-cols-2 gap-4">
							<InfoRow icon={MapPin} label="City" value={application.city} />
							<InfoRow
								icon={MapPin}
								label="Region"
								value={application.region}
							/>
						</div>
						<InfoRow
							icon={MapPin}
							label="Country"
							value={application.country}
						/>
					</SectionCard>

					{/* Company or Individual identity */}
					{isCompany && application.registration_number ? (
						<SectionCard title="Business Details" icon={Building2}>
							<InfoRow
								icon={Building2}
								label="Registration number"
								value={application.registration_number}
							/>
						</SectionCard>
					) : !isCompany && (application.id_type ?? application.id_number) ? (
						<SectionCard title="Identity" icon={User}>
							<InfoRow
								icon={User}
								label="ID type"
								value={application.id_type?.replace(/_/g, ' ') ?? null}
							/>
							<InfoRow
								icon={User}
								label="ID number"
								value={application.id_number}
							/>
							<InfoRow
								icon={Calendar}
								label="ID expiry"
								value={
									application.id_expiry
										? localizedDayjs(application.id_expiry).format(
												'MMM D, YYYY',
											)
										: null
								}
							/>
						</SectionCard>
					) : null}

					{/* Rejection reason */}
					{application.status === 'ClientApplication.Status.Rejected' &&
						application.rejected_because && (
							<Card className="border-destructive/30 shadow-none">
								<CardHeader className="pb-3">
									<CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
										Rejection Reason
									</CardTitle>
								</CardHeader>
								<Separator />
								<CardContent className="pt-4">
									<p className="text-muted-foreground text-sm leading-relaxed">
										{application.rejected_because}
									</p>
								</CardContent>
							</Card>
						)}
				</div>
			</div>
		</main>
	)
}
