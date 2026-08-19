import { ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { getRiskRecordPath } from '../lib/risk-link'
import { useGetInvoicesAcrossPropertiesInfinite } from '~/api/invoices'
import { useGetLeasesAcrossPropertiesInfinite } from '~/api/leases'
import { useGetMaintenanceRequestsAcrossPropertiesInfinite } from '~/api/maintenance-requests'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const PAGE_SIZE = 10
const EXPIRING_WINDOW_DAYS = 60

/** One modal row, flattened from whichever resource the risk type maps to. */
interface RiskRecord {
	id: string
	propertyId: string
	propertyName: string
	title: string
	subtitle: string
	value: string
}

function fullName(
	first: Nullable<string> | undefined,
	last: Nullable<string> | undefined,
): string {
	return `${safeString(first)} ${safeString(last)}`.trim()
}

// A request can cover several units and blocks, so the subtitle names the first
// asset and counts the rest rather than pretending there is a single unit.
function assetSummary(assets: MaintenanceRequestAsset[] | undefined): string {
	const first = assets?.[0]
	if (!first) return ''
	const label =
		first.asset_type === 'UNIT'
			? (first.unit?.name ?? 'Unit')
			: (first.property_block?.name ?? 'Block')
	const rest = (assets?.length ?? 0) - 1
	return rest > 0 ? `${label} +${rest}` : label
}

function useRiskRecords(
	type: InsightsRiskType,
	open: boolean,
	scopedPropertyIds?: string[],
) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const propertyId = scopedPropertyIds?.length ? scopedPropertyIds : undefined

	const today = localizedDayjs().format('YYYY-MM-DD')
	const windowEnd = localizedDayjs()
		.add(EXPIRING_WINDOW_DAYS, 'day')
		.format('YYYY-MM-DD')

	// Ordering rides on `filters` rather than `sorter`: getQueryParams emits
	// sorter as sort/sort_by, but the API reads order/order_by.
	const invoices = useGetInvoicesAcrossPropertiesInfinite(
		clientId,
		{
			pagination: { page: 1, per: PAGE_SIZE },
			populate: ['Property', 'PayeeTenant'],
			filters: {
				status: ['ISSUED', 'PARTIALLY_PAID'],
				payee_type: 'PROPERTY_OWNER',
				property_id: propertyId,
				order_by: 'invoices.total_amount',
				order: 'desc',
			},
		},
		open && type === 'outstanding_rent',
	)

	const leases = useGetLeasesAcrossPropertiesInfinite(
		clientId,
		{
			pagination: { page: 1, per: PAGE_SIZE },
			populate: ['Unit', 'Unit.Property', 'Tenant'],
			filters: {
				status: 'Lease.Status.Active',
				move_out_date_from: today,
				move_out_date_to: windowEnd,
				// Matches Leases.expiringCount, which the card above reports.
				// Without it the list contradicts its own number: a renewed
				// lease is still Active until its term runs out.
				exclude_renewed: true,
				property_id: propertyId,
				order_by: 'leases.move_out_date',
				order: 'asc',
			},
		},
		open && type === 'expiring_leases',
	)

	const maintenance = useGetMaintenanceRequestsAcrossPropertiesInfinite(
		clientId,
		{
			pagination: { page: 1, per: PAGE_SIZE },
			populate: ['Property', 'Assets', 'Assets.Unit', 'Assets.PropertyBlock'],
			filters: {
				status: ['NEW', 'IN_PROGRESS', 'IN_REVIEW'],
				property_id: propertyId,
				order_by: 'maintenance_requests.created_at',
				order: 'desc',
			},
		},
		open && type === 'maintenance',
	)

	const query =
		type === 'outstanding_rent'
			? invoices
			: type === 'expiring_leases'
				? leases
				: maintenance

	const records: RiskRecord[] = []

	if (type === 'outstanding_rent') {
		for (const page of invoices.data?.pages ?? []) {
			for (const invoice of page?.rows ?? []) {
				records.push({
					id: invoice.id,
					propertyId: safeString(invoice.property_id),
					propertyName: safeString(invoice.property?.name),
					title: invoice.code,
					subtitle: fullName(
						invoice.payee_tenant?.first_name,
						invoice.payee_tenant?.last_name,
					),
					value: formatAmount(convertPesewasToCedis(invoice.total_amount)),
				})
			}
		}
	} else if (type === 'expiring_leases') {
		for (const page of leases.data?.pages ?? []) {
			for (const lease of page?.rows ?? []) {
				records.push({
					id: lease.id,
					propertyId: safeString(lease.unit?.property_id),
					propertyName: safeString(lease.unit?.property?.name),
					title: lease.code,
					subtitle: [
						fullName(lease.tenant?.first_name, lease.tenant?.last_name),
						safeString(lease.unit?.name),
					]
						.filter(Boolean)
						.join(' · '),
					value: lease.move_out_date
						? localizedDayjs(lease.move_out_date).format('MMM D, YYYY')
						: '—',
				})
			}
		}
	} else {
		for (const page of maintenance.data?.pages ?? []) {
			for (const request of page?.rows ?? []) {
				records.push({
					id: request.id,
					// The request carries its own property now, so this no longer
					// depends on a unit being populated — a block-only request has
					// no unit at all.
					propertyId: safeString(request.property_id),
					propertyName: safeString(request.property?.name),
					title: request.title,
					subtitle: assetSummary(request.assets),
					value: request.priority,
				})
			}
		}
	}

	return {
		records,
		total: query.data?.pages?.[0]?.meta?.total ?? 0,
		isPending: query.isPending,
		isError: query.isError,
		refetch: query.refetch,
		fetchNextPage: query.fetchNextPage,
		hasNextPage: query.hasNextPage,
		isFetchingNextPage: query.isFetchingNextPage,
	}
}

function RowSkeleton() {
	return (
		<div className="flex items-center gap-3 py-3">
			<div className="flex-1 space-y-1.5">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-40" />
			</div>
			<Skeleton className="h-4 w-16" />
		</div>
	)
}

interface RiskDetailModalProps {
	type: InsightsRiskType
	label: string
	description: string
	totalValue: string
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Set when the card is scoped to one or more specific properties. */
	scopedPropertyIds?: string[]
}

export function RiskDetailModal({
	type,
	label,
	description,
	totalValue,
	open,
	onOpenChange,
	scopedPropertyIds,
}: RiskDetailModalProps) {
	const {
		records,
		total,
		isPending,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useRiskRecords(type, open, scopedPropertyIds)

	// Redundant when every row belongs to the property you're already looking at.
	const showPropertyName = scopedPropertyIds?.length !== 1

	const sentinelRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const node = sentinelRef.current
		if (!node || !hasNextPage || isFetchingNextPage) return

		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) void fetchNextPage()
		})
		observer.observe(node)

		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, records.length])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<span className="size-2 shrink-0 rounded-full bg-amber-500" />
						<DialogTitle>{label}</DialogTitle>
					</div>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex items-baseline gap-1.5">
					<span className="text-2xl font-semibold tabular-nums">
						{totalValue}
					</span>
					{!isPending ? (
						<span className="text-muted-foreground text-sm">
							· {total} {total === 1 ? 'record' : 'records'}
						</span>
					) : null}
				</div>

				<div className="-mx-6 max-h-[50vh] overflow-y-auto border-t">
					<div className="px-6">
						{isPending ? (
							<div className="divide-y">
								{[0, 1, 2].map((i) => (
									<RowSkeleton key={i} />
								))}
							</div>
						) : isError ? (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<p className="text-muted-foreground text-sm">
									Couldn&apos;t load the affected records.
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => refetch()}
								>
									Try again
								</Button>
							</div>
						) : records.length === 0 ? (
							<p className="text-muted-foreground py-8 text-center text-sm">
								Nothing to review right now.
							</p>
						) : (
							<div className="divide-y">
								{records.map((record) => {
									const body = (
										<>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{record.title}
												</p>
												{record.subtitle ? (
													<p className="text-muted-foreground truncate text-xs">
														{record.subtitle}
													</p>
												) : null}
												{showPropertyName && record.propertyName ? (
													<p className="text-muted-foreground truncate text-xs">
														{record.propertyName}
													</p>
												) : null}
											</div>
											<span className="shrink-0 text-sm font-semibold tabular-nums">
												{record.value}
											</span>
										</>
									)

									// Without a property we cannot build a valid route, so the
									// row stays inert rather than linking somewhere broken.
									return record.propertyId ? (
										<Link
											key={record.id}
											to={getRiskRecordPath(type, record.propertyId, record.id)}
											onClick={() => onOpenChange(false)}
											className="hover:bg-muted/50 -mx-6 flex items-center gap-3 px-6 py-3"
										>
											{body}
											<ChevronRight className="text-muted-foreground size-4 shrink-0" />
										</Link>
									) : (
										<div
											key={record.id}
											className="-mx-6 flex items-center gap-3 px-6 py-3"
										>
											{body}
										</div>
									)
								})}

								{hasNextPage ? (
									<div ref={sentinelRef}>
										<RowSkeleton />
									</div>
								) : null}
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="sm:justify-between">
					<p className="text-muted-foreground text-sm">
						Select a record to review and resolve.
					</p>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
