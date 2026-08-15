import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { useGetPropertyUnits } from '~/api/units'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

interface Props {
	applicationId: string
	propertyId: string
	currentUnitId?: string
	/**
	 * How many charges already exist on the application's account. Changing the
	 * unit rebuilds the rent schedule, so the landlord is told before it happens
	 * rather than discovering it afterwards.
	 */
	chargeCount?: number
	/**
	 * The rent already agreed for this lease, in pesewas, if one has been
	 * stated. Rent is stated rather than inherited from the unit, so moving to
	 * another unit must not silently re-price the lease — the landlord is asked
	 * which figure the rebuilt charges use, defaulting to the one they agreed.
	 *
	 * Null before any rent is stated, where there is nothing to preserve and the
	 * new unit's listed rent is the sensible starting point.
	 */
	currentRent?: Nullable<number>
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export function ChangeUnitModal({
	applicationId,
	propertyId,
	currentUnitId,
	chargeCount = 0,
	currentRent,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { clientUser } = useClient()
	const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
		currentUnitId,
	)

	// Defaults to the agreed figure, so the safe outcome is also the fastest.
	const [rent, setRent] = useState(
		currentRent == null ? '' : String(convertPesewasToCedis(currentRent)),
	)

	const { data, isPending: isLoadingUnits } = useGetPropertyUnits(
		safeString(clientUser?.client_id),
		{
			property_id: propertyId,
			sorter: { sort: 'desc', sort_by: 'created_at' },
			pagination: { per: 1000 },
		},
	)

	const { isPending, mutate } = useAdminUpdateTenantApplication()

	const handleSubmit = () => {
		if (!selectedUnitId || selectedUnitId === currentUnitId) return

		const unit = data?.rows.find((u) => u.id === selectedUnitId)

		mutate(
			{
				client_id: safeString(clientUser?.client_id),
				id: applicationId,
				property_id: propertyId,
				data: {
					desired_unit_id: selectedUnitId,
					// Currency and frequency are properties of the unit and follow it.
					// Rent is not — it is the figure the lease is written against, so
					// it carries over unless the landlord says otherwise here.
					rent_fee:
						currentRent == null
							? unit?.rent_fee
							: convertCedisToPesewas(
									Number.parseFloat(rent.replace(/,/g, '')) || 0,
								),
					rent_fee_currency: unit?.rent_fee_currency,
					payment_frequency: unit?.payment_frequency,
					stay_duration_frequency: unit?.payment_frequency,
				},
			},
			{
				onError: () => {
					toast.error('Failed to change unit. Try again later.')
				},
				onSuccess: () => {
					toast.success('Unit has been updated successfully.')

					void revalidator.revalidate()
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
					setOpened(false)
				},
			},
		)
	}

	const units = data?.rows ?? []
	const selectedUnit = units.find((u) => u.id === selectedUnitId)
	const listedRent = convertPesewasToCedis(selectedUnit?.rent_fee ?? 0)
	const enteredRent = Number.parseFloat(rent.replace(/,/g, '')) || 0

	const statusColor = (status: PropertyUnit['status']) => {
		switch (status) {
			case 'Unit.Status.Available':
				return 'bg-teal-500 text-white'
			case 'Unit.Status.Maintenance':
				return 'bg-yellow-500 text-white'
			case 'Unit.Status.Occupied':
				return 'bg-rose-500 text-white'
			default:
				return 'bg-zinc-400 text-white'
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
				<AlertDialogHeader>
					<AlertDialogTitle>Change Unit</AlertDialogTitle>
					<AlertDialogDescription>
						Select a new unit for this lease application.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{chargeCount > 0 ? (
					<Alert>
						<AlertTriangle className="size-4" />
						<AlertTitle>Rent charges will be rebuilt</AlertTitle>
						<AlertDescription>
							The {chargeCount} charge{chargeCount === 1 ? '' : 's'} on this
							application were worked out against the current unit. Moving to
							another unit rebuilds the rent schedule from the agreed terms.
							Charges you added yourself are kept.
						</AlertDescription>
					</Alert>
				) : null}

				<div className="max-h-[38vh] space-y-2 overflow-y-auto pr-1">
					{isLoadingUnits ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : units.length === 0 ? (
						<div className="py-8 text-center text-sm text-gray-500">
							No units available for this property.
						</div>
					) : (
						units.map((unit) => {
							const isSelected = selectedUnitId === unit.id
							const isAvailable = unit.status === 'Unit.Status.Available'
							const isCurrent = currentUnitId === unit.id

							return (
								<button
									key={unit.id}
									type="button"
									disabled={!isAvailable && !isCurrent}
									onClick={() => setSelectedUnitId(unit.id)}
									className={cn(
										'relative flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
										isSelected
											? 'border-primary bg-primary/5 ring-primary ring-1'
											: 'hover:bg-gray-50',
										!isAvailable &&
											!isCurrent &&
											'cursor-not-allowed opacity-50',
									)}
								>
									{unit.images?.[0] ? (
										<img
											src={unit.images[0]}
											alt={unit.name}
											className="h-14 w-14 rounded-md object-cover"
										/>
									) : (
										<div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
											No img
										</div>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate font-medium">{unit.name}</span>
											<Badge
												variant="outline"
												className={cn(
													'px-1.5 py-0 text-[10px]',
													statusColor(unit.status),
												)}
											>
												{getPropertyUnitStatusLabel(unit.status)}
											</Badge>
											{isCurrent && (
												<span className="text-[10px] text-gray-400">
													(current)
												</span>
											)}
										</div>
										<p className="text-muted-foreground text-sm">
											{formatAmount(
												convertPesewasToCedis(unit.rent_fee),
												unit.rent_fee_currency,
											)}
											/{unit.payment_frequency?.toLowerCase()}
										</p>
									</div>
									{isSelected && (
										<div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
											<Check className="h-3 w-3 text-white" />
										</div>
									)}
								</button>
							)
						})
					)}
				</div>

				{/*
				 * Only once another unit is picked, and only when a rent has been
				 * agreed — before that there is nothing to preserve and the unit's
				 * listing is the right starting point.
				 */}
				{currentRent != null &&
				selectedUnitId &&
				selectedUnitId !== currentUnitId ? (
					<div className="rounded-lg border p-3">
						<Label htmlFor="change-unit-rent">Rent for this lease</Label>
						<div className="mt-2 flex items-center gap-2">
							<span className="text-muted-foreground text-sm font-semibold">
								{selectedUnit?.rent_fee_currency ?? 'GH₵'}
							</span>
							<Input
								id="change-unit-rent"
								inputMode="decimal"
								className="w-40 font-semibold"
								value={rent}
								disabled={isPending}
								onChange={(event) => setRent(event.target.value)}
							/>
							{listedRent > 0 && listedRent !== enteredRent ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setRent(String(listedRent))}
								>
									Use listed rent (
									{formatAmount(listedRent, selectedUnit?.rent_fee_currency)})
								</Button>
							) : null}
						</div>
						<p className="text-muted-foreground mt-2 text-xs">
							Carried over from the current agreement. The rebuilt charges use
							this figure, not the unit&apos;s listing.
						</p>
					</div>
				) : null}

				<AlertDialogFooter>
					<Button
						type="button"
						disabled={isPending}
						variant="outline"
						onClick={() => setOpened(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={
							isPending || !selectedUnitId || selectedUnitId === currentUnitId
						}
						onClick={handleSubmit}
					>
						{isPending ? <Spinner /> : null} Save
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
