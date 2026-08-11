import {
	ChevronRight,
	ExternalLink,
	HouseIcon,
	ImageIcon,
	ScrollText,
	User,
} from 'lucide-react'
import { Link } from 'react-router'
import { DetailField } from './detail-field'
import { Image } from '~/components/Image'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getLeaseEndDate,
	getLeaseTermProgress,
} from '~/lib/lease-checklist.utils'
import { getLeaseStatusClass, getLeaseStatusLabel } from '~/lib/lease.utils'
import { getPaymentFrequencyLabel } from '~/lib/properties.utils'
import { getInitials } from '~/lib/strings'
import { cn } from '~/lib/utils'

interface LeaseSummaryCardProps {
	lease: Lease
	propertyId: string
	tenant: Tenant | undefined
	unit: PropertyUnit | undefined
	application: TenantApplication | undefined
}

export function LeaseSummaryCard({
	lease,
	propertyId,
	tenant,
	unit,
	application,
}: LeaseSummaryCardProps) {
	const termProgress = getLeaseTermProgress(lease)
	const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : null

	return (
		<Card className="overflow-hidden pt-0 shadow-none lg:sticky lg:top-6">
			<div className="h-40 w-full overflow-hidden">
				{unit?.images?.[0] ? (
					<Image
						className="h-full w-full object-cover"
						src={unit.images[0]}
						alt={unit.name}
					/>
				) : (
					<div className="bg-muted flex h-40 w-full items-center justify-center">
						<ImageIcon className="text-muted-foreground size-10" />
					</div>
				)}
			</div>

			<CardContent className="space-y-4 text-sm">
				<div className="flex items-center gap-2">
					<ScrollText className="text-muted-foreground size-5" />
					<p className="font-mono text-sm font-semibold">{lease.code}</p>
					<Badge
						variant="outline"
						className={`ml-auto px-2 py-0.5 text-xs ${getLeaseStatusClass(lease.status)}`}
					>
						{getLeaseStatusLabel(lease.status)}
					</Badge>
				</div>

				<div className="flex flex-col gap-1">
					{tenant ? (
						<Link
							to={`/properties/${propertyId}/occupancy/tenants/${tenant.id}`}
							className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-lg px-2 py-2"
						>
							<Avatar className="size-9">
								<AvatarFallback className="text-primary bg-primary/10 text-xs font-semibold">
									{getInitials(tenantName ?? '?')}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="text-primary truncate text-sm font-medium">
									{tenantName}
								</p>
								<p className="text-muted-foreground text-xs">Tenant</p>
							</div>
							<ChevronRight className="text-muted-foreground size-4 shrink-0" />
						</Link>
					) : (
						<div className="flex items-center gap-2 px-2 py-2">
							<User className="text-muted-foreground size-4 shrink-0" />
							<span className="text-muted-foreground text-sm">—</span>
						</div>
					)}

					{unit ? (
						<Link
							to={`/properties/${propertyId}/assets/units/${unit.id}`}
							className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-lg px-2 py-2"
						>
							<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
								<HouseIcon className="text-muted-foreground size-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-primary truncate text-sm font-medium">
									{unit.name}
								</p>
								<p className="text-muted-foreground text-xs">Unit</p>
							</div>
							<ChevronRight className="text-muted-foreground size-4 shrink-0" />
						</Link>
					) : (
						<div className="flex items-center gap-2 px-2 py-2">
							<HouseIcon className="text-muted-foreground size-4 shrink-0" />
							<span className="text-muted-foreground text-sm">—</span>
						</div>
					)}
				</div>

				<Separator />

				<div className="flex items-end justify-between">
					<div>
						<p className="text-muted-foreground font-mono text-[10px] font-medium tracking-wide uppercase">
							Rent fee
						</p>
						<p className="mt-1.5 font-serif text-3xl">
							{formatAmount(
								convertPesewasToCedis(lease.rent_fee),
								lease.rent_fee_currency,
							)}
						</p>
					</div>
					<span className="text-muted-foreground pb-1 text-xs">
						{getPaymentFrequencyLabel(lease.payment_frequency ?? '')}
					</span>
				</div>

				<Separator />

				{termProgress ? (
					<div className="space-y-2">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground font-mono text-[9px] font-medium tracking-wide uppercase">
									Move-in
								</p>
								<p className="mt-0.5 text-xs font-medium">
									{localizedDayjs(lease.move_in_date).format('LL')}
								</p>
							</div>
							<div className="text-right">
								<p className="text-muted-foreground font-mono text-[9px] font-medium tracking-wide uppercase">
									Move-out
								</p>
								<p className="mt-0.5 text-xs font-medium">
									{localizedDayjs(getLeaseEndDate(lease)).format('LL')}
								</p>
							</div>
						</div>
						<div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
							<div
								className={cn(
									'h-full rounded-full',
									termProgress.isEndingSoon ? 'bg-amber-500' : 'bg-primary',
								)}
								style={{ width: `${termProgress.percent}%` }}
							/>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-[11px]">
								Month {termProgress.monthOf} of {termProgress.monthsTotal}
							</span>
							{/* Past the move-out date there is no time left to count, and
							    the countdown would read "-9 days left". */}
							{termProgress.daysLeft > 0 ? (
								<span
									className={cn(
										'text-[11px] font-semibold',
										termProgress.isEndingSoon
											? 'text-amber-600 dark:text-amber-400'
											: 'text-muted-foreground',
									)}
								>
									{termProgress.daysLeft} days left
									{termProgress.isEndingSoon ? ' · ends soon' : ''}
								</span>
							) : null}
						</div>
					</div>
				) : (
					<div>
						<p className="text-muted-foreground font-mono text-[9px] font-medium tracking-wide uppercase">
							Move-in
						</p>
						<p className="mt-0.5 text-xs font-medium">
							{localizedDayjs(lease.move_in_date).format('LL')}
						</p>
					</div>
				)}

				<Separator />

				<div className="grid grid-cols-2 gap-3">
					<DetailField
						label="Created on"
						value={localizedDayjs(lease.created_at).format('LL')}
					/>
					<DetailField
						label="Updated on"
						value={localizedDayjs(lease.updated_at).format('LL')}
					/>
				</div>

				{application && (
					<>
						<Separator />
						<Link
							to={`/properties/${propertyId}/occupancy/applications/${application.id}`}
							className="text-primary flex items-center gap-1.5 text-xs font-medium hover:underline"
						>
							<ExternalLink className="size-3.5" />
							View application
							<span className="text-muted-foreground font-mono font-normal">
								({application.code})
							</span>
						</Link>
					</>
				)}
			</CardContent>
		</Card>
	)
}
