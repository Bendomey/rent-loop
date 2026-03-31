import { Mail, Phone, MapPin, User, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

interface Props {
	data: Invoice
}

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

export function PropertyFinancialsPaymentPayerModule({ data }: Props) {
	const tenant =
		data.payer_type === 'TENANT_APPLICATION'
			? data?.context_tenant_application
			: data?.payer_lease?.tenant
	const isTenantApplication = data.payer_type === 'TENANT_APPLICATION'
	const tenantApplication = isTenantApplication
		? (tenant as typeof data.context_tenant_application)
		: null

	if (!tenant) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground">No tenant information available</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-4">
								{tenant.profile_photo_url && (
									<img
										src={tenant.profile_photo_url}
										alt={`${tenant.first_name} ${tenant.last_name}`}
										className="h-16 w-16 rounded-lg object-cover"
									/>
								)}
								<div>
									<h2 className="text-2xl font-bold">
										{tenant.first_name}{' '}
										{tenant.other_names ? `${tenant.other_names} ` : ''}
										{tenant.last_name}
									</h2>
									<p className="text-muted-foreground text-sm">
										{tenant.occupation}
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow
							icon={<Mail size={18} />}
							label="Email"
							value={tenant.email}
						/>
						<InfoRow
							icon={<Phone size={18} />}
							label="Phone"
							value={tenant.phone}
						/>
						<InfoRow
							icon={<User size={18} />}
							label="Gender"
							value={tenant.gender}
						/>
						<InfoRow
							icon={<Calendar size={18} />}
							label="Date of Birth"
							value={
								tenant.date_of_birth
									? localizedDayjs(tenant.date_of_birth).format('DD MMM YYYY')
									: 'N/A'
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
					<InfoRow
						icon={<MapPin size={18} />}
						label="Current Address"
						value={tenant.current_address}
					/>
					<div className="pt-2">
						<TypographyMuted>Emergency Contact</TypographyMuted>
						<div className="mt-2 space-y-2">
							<p className="text-foreground font-medium">
								{tenant.emergency_contact_name}
							</p>
							<div className="text-muted-foreground flex gap-2 text-sm">
								<span>{tenant.emergency_contact_phone}</span>
								<span>•</span>
								<span>{tenant.relationship_to_emergency_contact}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
