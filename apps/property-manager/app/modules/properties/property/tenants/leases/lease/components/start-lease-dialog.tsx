import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useActivateLease, useUpdateLease } from '~/api/leases'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getPaymentFrequencyLabel } from '~/lib/properties.utils'
import { cn } from '~/lib/utils'

interface Props {
	lease: Lease
	propertyId: string
	opened: boolean
	setOpened: (open: boolean) => void
}

function toDateTimeLocalString(date: Date) {
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function StartLeaseDialog({
	lease,
	propertyId,
	opened,
	setOpened,
}: Props) {
	const { revalidate } = useRevalidator()
	const { mutateAsync: updateLease, isPending: isUpdating } = useUpdateLease()
	const { mutateAsync: activateLease, isPending: isActivating } =
		useActivateLease()

	const [utilityTransferDone, setUtilityTransferDone] = useState(
		!!lease.utility_transfers_date,
	)
	const [utilityTransfersDateStr, setUtilityTransfersDateStr] = useState(
		toDateTimeLocalString(
			lease.utility_transfers_date
				? new Date(lease.utility_transfers_date)
				: new Date(),
		),
	)

	const isPending = isUpdating || isActivating
	const canActivate = utilityTransferDone

	function handleUtilityCheckChange(checked: boolean) {
		setUtilityTransferDone(checked)
		if (checked && !lease.utility_transfers_date) {
			setUtilityTransfersDateStr(toDateTimeLocalString(new Date()))
		}
	}

	async function handleSave() {
		try {
			await updateLease({
				propertyId,
				leaseId: lease.id,
				utility_transfers_date: utilityTransferDone
					? new Date(utilityTransfersDateStr)
					: undefined,
			})
			toast.success('Lease updated')
			setOpened(false)
			void revalidate()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update lease')
		}
	}

	async function handleActivate() {
		try {
			await updateLease({
				propertyId,
				leaseId: lease.id,
				utility_transfers_date: new Date(utilityTransfersDateStr),
			})
			await activateLease({ propertyId, leaseId: lease.id })
			toast.success('Lease activated')
			setOpened(false)
			void revalidate()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to activate lease',
			)
		}
	}

	const tenant = lease.tenant
	const unit = lease.unit

	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Start Lease</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Summary */}
					<div className="bg-muted/40 space-y-1 rounded-md border p-3 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tenant</span>
							<span className="font-medium">
								{tenant?.first_name} {tenant?.last_name}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Unit</span>
							<span className="font-medium">{unit?.name}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Rent</span>
							<span className="font-medium">
								{formatAmount(convertPesewasToCedis(lease.rent_fee))} /{' '}
								{getPaymentFrequencyLabel(lease.payment_frequency ?? '')}
							</span>
						</div>
					</div>

					{/* Utility transfer */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Checkbox
								id="utility-transfer-done"
								checked={utilityTransferDone}
								onCheckedChange={(checked) =>
									handleUtilityCheckChange(checked === true)
								}
								disabled={isPending}
							/>
							<Label htmlFor="utility-transfer-done" className="cursor-pointer">
								Has utility transfer been completed?
							</Label>
						</div>

						{utilityTransferDone && (
							<div className="space-y-1.5 pl-6">
								<Label className="text-muted-foreground text-xs">
									Date &amp; time completed
								</Label>
								<input
									type="datetime-local"
									value={utilityTransfersDateStr}
									onChange={(e) => setUtilityTransfersDateStr(e.target.value)}
									disabled={isPending}
									className={cn(
										'border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
									)}
								/>
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="space-x-2">
					<Button
						variant="outline"
						onClick={() => setOpened(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="outline"
						onClick={handleSave}
						disabled={isPending || !canActivate}
					>
						{isUpdating && !isActivating
							? 'Saving…'
							: 'Save And Continue Later'}
					</Button>
					<Button onClick={handleActivate} disabled={isPending || !canActivate}>
						{isPending && isActivating ? 'Activating…' : 'Activate'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
