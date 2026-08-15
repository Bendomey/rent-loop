import { useState } from 'react'
import { useTenantApplicationContext } from '../context'
import { ChangeUnitModal } from './change-unit-modal'
import { ExternalLink } from '~/components/external-link'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationUnitSetup() {
	const { clientUserProperty } = useProperty()
	const [changeUnitOpen, setChangeUnitOpen] = useState(false)
	const { tenantApplication: application } = useTenantApplicationContext()

	const unit = application?.desired_unit
	const coverImage = unit?.images?.[0]
	const propertyId = safeString(clientUserProperty?.property_id)
	const isSingleProperty = clientUserProperty?.property?.type === 'SINGLE'

	// Changing the unit rebuilds the rent schedule, so it is refused once a rent
	// charge has been billed. Read the server's own flag rather than inferring
	// from totals: `total_settled > 0` is account-wide, so it blocked on a paid
	// deposit the service would have allowed, and stayed open when rent was
	// invoiced-but-unpaid, which the service refuses.
	const rentTermsLocked = Boolean(
		application?.financial_account?.rent_terms_locked,
	)
	const isDocSigned = ['SIGNED', 'SIGNING'].includes(
		safeString(application?.lease_agreement_document_status),
	)
	const isChangeLocked = rentTermsLocked || isDocSigned

	const statusLabel = unit ? getPropertyUnitStatusLabel(unit.status) : ''
	const statusColor =
		unit?.status === 'Unit.Status.Available'
			? 'bg-teal-500 text-white'
			: unit?.status === 'Unit.Status.Maintenance'
				? 'bg-yellow-500 text-white'
				: unit?.status === 'Unit.Status.Occupied'
					? 'bg-rose-500 text-white'
					: 'bg-zinc-400 text-white'

	if (!unit) {
		return (
			<>
				<div className="mt-20 flex flex-col items-center justify-center gap-3 text-center">
					<p className="text-muted-foreground text-sm">
						No unit has been assigned to this application yet.
					</p>
					{!isSingleProperty && (
						<Button variant="outline" onClick={() => setChangeUnitOpen(true)}>
							Assign Unit
						</Button>
					)}
				</div>
				<ChangeUnitModal
					applicationId={safeString(application?.id)}
					propertyId={propertyId}
					chargeCount={application?.financial_account?.charge_count ?? 0}
					currentRent={application?.rent_fee ?? null}
					opened={changeUnitOpen}
					setOpened={setChangeUnitOpen}
				/>
			</>
		)
	}

	const canChangeUnit =
		!isSingleProperty &&
		application?.status === 'TenantApplication.Status.InProgress'

	return (
		<>
			<div>
				<Card className="relative mx-auto mt-8 w-full max-w-sm pt-0 shadow-none md:mt-20">
					{coverImage ? (
						<img
							src={coverImage}
							alt={unit.name}
							className="relative z-20 aspect-video w-full rounded-t-lg object-cover"
						/>
					) : (
						<div className="relative z-20 flex aspect-video w-full items-center justify-center rounded-t-lg bg-gray-100 text-sm text-gray-400">
							No image
						</div>
					)}
					<CardHeader>
						<CardAction>
							<Badge variant="outline" className={cn(statusColor)}>
								{statusLabel}
							</Badge>
						</CardAction>
						<CardTitle>{unit.name}</CardTitle>
						<CardDescription>
							{unit.type && <p className="lowercase">{unit.type}</p>}
							<p>
								Market Rent:{' '}
								<b>
									{formatAmount(
										convertPesewasToCedis(unit.rent_fee),
										unit.rent_fee_currency,
									)}
								</b>
								/{unit.payment_frequency?.toLowerCase()}
							</p>
						</CardDescription>
					</CardHeader>
					<CardFooter className="w-full justify-between space-x-2">
						<ExternalLink
							className={!canChangeUnit ? 'w-full' : 'w-2/4'}
							to={`/properties/${clientUserProperty?.property_id}/assets/units/${unit.id}`}
						>
							<Button className="w-full">View Unit</Button>
						</ExternalLink>
						{canChangeUnit && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="w-2/4">
										<Button
											className="w-full"
											variant="secondary"
											disabled={isChangeLocked}
											onClick={() => setChangeUnitOpen(true)}
										>
											Change
										</Button>
									</span>
								</TooltipTrigger>
								{isChangeLocked && (
									<TooltipContent>
										{rentTermsLocked
											? 'Rent has already been billed on this application. Void or refund those invoices before changing the unit.'
											: 'The lease agreement has been signed, so the unit can no longer change.'}
									</TooltipContent>
								)}
							</Tooltip>
						)}
					</CardFooter>
				</Card>
			</div>

			<ChangeUnitModal
				applicationId={safeString(application?.id)}
				propertyId={propertyId}
				currentUnitId={unit.id}
				chargeCount={application?.financial_account?.charge_count ?? 0}
				currentRent={application?.rent_fee ?? null}
				opened={changeUnitOpen}
				setOpened={setChangeUnitOpen}
			/>
		</>
	)
}
