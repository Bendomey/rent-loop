import { useState } from 'react'
import { useRouteLoaderData } from 'react-router'
import { ChangeUnitModal } from './change-unit-modal'
import { ExternalLink } from '~/components/external-link'
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card"
import { formatAmount } from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

export function PropertyTenantApplicationUnitSetup() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>('routes/_auth.properties.$propertyId.tenants.applications.$applicationId')
	const { clientUserProperty } = useProperty()
	const [changeUnitOpen, setChangeUnitOpen] = useState(false)

	const application = loaderData?.tenantApplication
	const unit = application?.desired_unit
	const coverImage = unit?.images?.[0]
	const propertyId = safeString(clientUserProperty?.property_id)
	const isSingleProperty = clientUserProperty?.property?.type === 'SINGLE'

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
			<div className="mt-20 text-center text-gray-500">
				No unit has been selected for this application.
			</div>
		)
	}

	return (
		<>
			<div>
				<Card className="relative mx-auto w-full max-w-sm pt-0 shadow-none mt-20">
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
							{unit.type && <p className='lowercase'>{unit.type}</p>}
							<p>Market Rent: <b>{formatAmount(unit.rent_fee)}</b>/{unit.payment_frequency?.toLowerCase()}</p>
						</CardDescription>
					</CardHeader>
					<CardFooter className='w-full justify-between space-x-2'>
						<ExternalLink className={isSingleProperty ? 'w-full' : 'w-2/4'} to={`/properties/${clientUserProperty?.property_id}/assets/units/${unit.id}`}>
							<Button className='w-full'>View Unit</Button>
						</ExternalLink>
						{!isSingleProperty && (
							<Button
								className='w-2/4'
								variant='secondary'
								onClick={() => setChangeUnitOpen(true)}
							>
								Change
							</Button>
						)}
					</CardFooter>
				</Card>
			</div>

			<ChangeUnitModal
				applicationId={safeString(application?.id)}
				propertyId={propertyId}
				currentUnitId={unit.id}
				opened={changeUnitOpen}
				setOpened={setChangeUnitOpen}
			/>
		</>
	)
}
