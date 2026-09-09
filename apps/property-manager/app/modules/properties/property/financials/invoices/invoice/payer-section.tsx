import { ArrowRight, Building, Mail, Phone, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { getInvoicePayerTypeLabel } from '~/lib/invoice'

interface Props {
	invoice: Invoice
	propertyId?: string
}

function Row({
	icon,
	label,
	value,
}: {
	icon: ReactNode
	label: string
	value?: ReactNode
}) {
	if (!value) return null
	return (
		<div className="flex gap-3">
			<div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
			<div className="min-w-0">
				<p className="text-muted-foreground text-xs">{label}</p>
				<p className="text-foreground text-sm font-medium">{value}</p>
			</div>
		</div>
	)
}

export function InvoicePayerSection({ invoice, propertyId }: Props) {
	const tenant = invoice.payer_lease?.tenant
	const lease = invoice.payer_lease
	const unit = lease?.unit

	const name = tenant
		? [tenant.first_name, tenant.other_names, tenant.last_name]
				.filter(Boolean)
				.join(' ')
		: invoice.payer_client?.name

	if (!name) return null

	return (
		<Card className="shadow-none print:hidden">
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-foreground text-lg font-semibold tracking-tight">
						Who is paying
					</h2>
					{lease && propertyId && (
						<Button variant="outline" size="sm" asChild>
							<Link
								to={`/properties/${propertyId}/occupancy/leases/${lease.id}`}
							>
								Open agreement
								<ArrowRight />
							</Link>
						</Button>
					)}
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Row
						icon={<User className="size-4" />}
						label="Name"
						value={`${name} · ${getInvoicePayerTypeLabel(invoice.payer_type)}`}
					/>
					<Row
						icon={<Phone className="size-4" />}
						label="Phone"
						value={tenant?.phone}
					/>
					<Row
						icon={<Mail className="size-4" />}
						label="Email"
						value={tenant?.email}
					/>
					<Row
						icon={<Building className="size-4" />}
						label="Room"
						value={
							unit
								? [
										unit.property_block?.name &&
											`${unit.property_block.name} block`,
										unit.name,
									]
										.filter(Boolean)
										.join(' · ')
								: undefined
						}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
