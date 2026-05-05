import { Calendar, Filter, MapPin, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

function InfoRow({
	icon,
	label,
	value,
}: {
	icon?: React.ReactNode
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex gap-3">
			{icon && (
				<div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-muted-foreground text-xs font-semibold">{label}</p>
				<p className="text-foreground text-sm font-medium">{value || 'N/A'}</p>
			</div>
		</div>
	)
}

export function TenantProfileModule({ tenant }: { tenant: Tenant }) {
	return (
		<div className="mt-3 space-y-3">
			<div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
				<Card className="@container/card col-span-2 shadow-none lg:col-span-1">
					<CardHeader>
						<CardDescription>Total Payments</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							GHS1,250.00
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="@container/card shadow-none">
					<CardHeader>
						<CardDescription>Total Leases</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							1
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="@container/card shadow-none">
					<CardHeader>
						<CardDescription>Total Requests</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							10
						</CardTitle>
					</CardHeader>
				</Card>
			</div>
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						Basic Information
					</CardTitle>
					<CardAction>
						<Button variant="ghost" size="icon">
							<Filter className="h-4 w-4" />
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow
							icon={<Calendar size={18} />}
							label="Date of Birth"
							value={
								tenant?.date_of_birth
									? localizedDayjs(tenant.date_of_birth).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
						<InfoRow
							icon={<User size={18} />}
							label="Marital Status"
							value={tenant?.marital_status}
						/>
						<InfoRow
							icon={<MapPin size={18} />}
							label="Nationality"
							value={tenant?.nationality}
						/>
						<InfoRow
							icon={<Calendar size={18} />}
							label="Record Created"
							value={
								tenant?.created_at
									? localizedDayjs(tenant.created_at).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
						<InfoRow
							icon={<Calendar size={18} />}
							label="Last Updated"
							value={
								tenant?.updated_at
									? localizedDayjs(tenant.updated_at).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TypographyH4>Identification</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow label="ID Type" value={tenant?.id_type} />
						<InfoRow label="ID Number" value={tenant?.id_number} />
						<InfoRow
							label="ID Front"
							value={
								tenant?.id_front_url ? (
									<a
										href={tenant.id_front_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
						<InfoRow
							label="ID Back"
							value={
								tenant?.id_back_url ? (
									<a
										href={tenant.id_back_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TypographyH4>Employment</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow label="Employer" value={tenant?.employer} />
						<InfoRow label="Occupation" value={tenant?.occupation} />
						<InfoRow label="Work Address" value={tenant?.occupation_address} />
						<InfoRow
							label="Proof of Income"
							value={
								tenant?.proof_of_income_url ? (
									<a
										href={tenant.proof_of_income_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Contact & Address */}
			<Card>
				<CardHeader>
					<TypographyH4>Contact & Address</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />

					<div className="pt-2">
						<TypographyMuted>Emergency Contact</TypographyMuted>
						<div className="mt-2 space-y-2">
							<p className="text-foreground font-medium">
								{tenant?.emergency_contact_name}
							</p>
							<div className="text-muted-foreground flex gap-2 text-sm">
								<span>{tenant?.emergency_contact_phone}</span>
								<span>•</span>
								<span>{tenant?.relationship_to_emergency_contact}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
