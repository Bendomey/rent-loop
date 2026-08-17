import { useQueryClient } from '@tanstack/react-query'
import { Info, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useVoidCharge } from '~/api/financial-accounts'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface RemoveChargeDialogProps {
	charge: Nullable<ChargeInstance>
	accountId: string
	clientId: string
	propertyId: string
	onClose: () => void
}

const REASONS = ['Charged in error', 'Waived for the tenant', 'Duplicate']

/**
 * Removal is a void, not a delete — there is no delete endpoint, and the reason
 * stays in the record where include_voided can surface it.
 *
 * A charge an invoice has already claimed cannot be voided at all: the server
 * returns 400 ChargeAlreadyBilled. That is not a toast after the fact — when the
 * charge is billed, the refusal IS the dialog, naming the route out.
 */
export function RemoveChargeDialog({
	charge,
	accountId,
	clientId,
	propertyId,
	onClose,
}: RemoveChargeDialogProps) {
	const queryClient = useQueryClient()
	const { isPending, mutate } = useVoidCharge()
	const [reason, setReason] = useState('Charged in error')

	if (!charge) return null

	const billed = charge.invoiced_amount !== 0
	const money = formatAmount(
		convertPesewasToCedis(charge.amount),
		charge.currency,
	)

	const remove = () => {
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: accountId,
				charge_id: charge.id,
				reason,
			},
			{
				onSuccess: () => {
					toast.success(`${charge.name} removed.`)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					onClose()
				},
				onError: (error: Error) => {
					toast.error(
						error.message === 'ChargeAlreadyBilled'
							? 'That charge is now on an invoice. Void the invoice first.'
							: 'Could not remove the charge. Please try again.',
					)
				},
			},
		)
	}

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				{billed ? (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Lock className="size-4" />
								This charge is already on an invoice
							</DialogTitle>
							<DialogDescription>
								<strong className="text-foreground">{charge.name}</strong> ·{' '}
								{money} has been claimed by an invoice. A billed charge can't be
								removed while that invoice stands.
							</DialogDescription>
						</DialogHeader>
						<Alert>
							<Info className="size-4" />
							<AlertTitle>To remove it</AlertTitle>
							<AlertDescription>
								Void the invoice first. That releases the claim and the charge
								becomes removable again. Any payment already recorded against
								the invoice has to be reversed separately.
							</AlertDescription>
						</Alert>
						<DialogFooter>
							<Button variant="outline" onClick={onClose}>
								Leave it
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Remove this charge?</DialogTitle>
							<DialogDescription>
								<strong className="text-foreground">{charge.name}</strong> ·{' '}
								{money}. It stops counting toward the balance but stays in the
								record, visible under “Show removed charges”.
							</DialogDescription>
						</DialogHeader>

						<div>
							<Label htmlFor="void-reason">
								Reason{' '}
								<span className="text-muted-foreground font-normal">
									— shown in the ledger
								</span>
							</Label>
							<Input
								id="void-reason"
								className="mt-2"
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder="Charged in error"
							/>
							<div className="mt-3 flex flex-wrap gap-2">
								{REASONS.map((preset) => (
									<Button
										key={preset}
										variant={reason === preset ? 'default' : 'outline'}
										size="sm"
										onClick={() => setReason(preset)}
									>
										{preset}
									</Button>
								))}
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={onClose} disabled={isPending}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={remove}
								disabled={isPending || !reason.trim()}
							>
								{isPending ? <Spinner /> : null}
								Remove charge
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
