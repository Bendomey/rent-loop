import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { getRiskLinkPath } from '../lib/risk-link'
import { useGetRiskProperties } from '~/api/insights'
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
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	const initials = parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')
	return initials || '?'
}

function formatRowValue(type: InsightsRiskType, value: number): string {
	return type === 'outstanding_rent'
		? formatAmount(convertPesewasToCedis(value))
		: value.toLocaleString()
}

interface RiskDetailModalProps {
	type: InsightsRiskType
	label: string
	description: string
	totalValue: string
	propertyCount: number
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Set when the Insights filter bar has one or more properties selected. */
	scopedPropertyIds?: string[]
}

export function RiskDetailModal({
	type,
	label,
	description,
	totalValue,
	propertyCount,
	open,
	onOpenChange,
	scopedPropertyIds,
}: RiskDetailModalProps) {
	const { clientUser } = useClient()
	const {
		data,
		isPending,
		isError,
		refetch: refetchProperties,
	} = useGetRiskProperties(
		safeString(clientUser?.client_id),
		type,
		scopedPropertyIds,
		open,
	)

	const properties = data?.properties ?? []

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
					<span className="text-muted-foreground text-sm">
						· {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
					</span>
				</div>

				<div className="-mx-6 max-h-[50vh] overflow-y-auto border-t">
					<div className="px-6">
						{isPending ? (
							<div className="divide-y">
								{[0, 1, 2].map((i) => (
									<div key={i} className="flex items-center gap-3 py-3">
										<Skeleton className="size-9 shrink-0 rounded-md" />
										<div className="flex-1 space-y-1.5">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-40" />
										</div>
										<Skeleton className="h-4 w-12" />
									</div>
								))}
							</div>
						) : isError ? (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<p className="text-muted-foreground text-sm">
									Couldn&apos;t load affected properties.
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => refetchProperties()}
								>
									Try again
								</Button>
							</div>
						) : properties.length === 0 ? (
							<p className="text-muted-foreground py-8 text-center text-sm">
								Nothing to review right now.
							</p>
						) : (
							<div className="divide-y">
								{properties.map((property) => (
									<Link
										key={property.property_id}
										to={getRiskLinkPath(type, property.property_id)}
										onClick={() => onOpenChange(false)}
										className="hover:bg-muted/50 -mx-6 flex items-center gap-3 px-6 py-3"
									>
										<span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-medium">
											{getInitials(property.name)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{property.name}
											</p>
											<p className="text-muted-foreground truncate text-xs">
												{property.address}
											</p>
										</div>
										<span className="shrink-0 text-sm font-semibold tabular-nums">
											{formatRowValue(type, property.value)}
										</span>
										<ChevronRight className="text-muted-foreground size-4 shrink-0" />
									</Link>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="sm:justify-between">
					<p className="text-muted-foreground text-sm">
						Select a property to review and resolve.
					</p>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
