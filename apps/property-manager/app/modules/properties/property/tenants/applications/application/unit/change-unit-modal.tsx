import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
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
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { formatAmount } from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { cn } from '~/lib/utils'

interface Props {
	applicationId: string
	propertyId: string
	currentUnitId?: string
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export function ChangeUnitModal({
	applicationId,
	propertyId,
	currentUnitId,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
		currentUnitId,
	)

	const { data, isPending: isLoadingUnits } = useGetPropertyUnits({
		property_id: propertyId,
		sorter: { sort: 'desc', sort_by: 'created_at' },
		pagination: { per: 1000 },
	})

	const { isPending, mutate } = useUpdateTenantApplication()

	const handleSubmit = () => {
		if (!selectedUnitId || selectedUnitId === currentUnitId) return

		const unit = data?.rows.find((u) => u.id === selectedUnitId)

		mutate(
			{
				id: applicationId,
				data: {
					desired_unit_id: selectedUnitId,
					rent_fee: unit?.rent_fee,
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
					setOpened(false)
				},
			},
		)
	}

	const units = data?.rows ?? []

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
			<AlertDialogContent className="max-h-[80vh] max-w-lg">
				<AlertDialogHeader>
					<AlertDialogTitle>Change Unit</AlertDialogTitle>
					<AlertDialogDescription>
						Select a new unit for this tenant application.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
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
							const isAvailable =
								unit.status === 'Unit.Status.Available'
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
										!isAvailable && !isCurrent && 'cursor-not-allowed opacity-50',
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
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium truncate">
												{unit.name}
											</span>
											<Badge
												variant="outline"
												className={cn(
													'text-[10px] px-1.5 py-0',
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
										<p className="text-sm text-muted-foreground">
											{formatAmount(unit.rent_fee)}/{unit.payment_frequency?.toLowerCase()}
										</p>
									</div>
									{isSelected && (
										<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
											<Check className="h-3 w-3 text-white" />
										</div>
									)}
								</button>
							)
						})
					)}
				</div>

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
