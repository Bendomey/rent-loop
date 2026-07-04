import { AlertTriangle } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { useVoidInvoice } from '~/api/invoices'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface CancelPaymentDialogProps {
	invoice: Invoice
	clientId: string
	propertyId: string
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	onSuccess?: () => void
}

export function CancelPaymentDialog({
	invoice,
	clientId,
	propertyId,
	opened,
	setOpened,
	onSuccess,
}: CancelPaymentDialogProps) {
	const [reason, setReason] = useState('')
	const { mutate, isPending } = useVoidInvoice()

	const handleOpenChange = (v: boolean) => {
		if (!v) setReason('')
		setOpened(v)
	}

	const handleConfirm = () => {
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				id: invoice.id,
				voided_reason: reason.trim() || undefined,
			},
			{
				onSuccess: () => {
					toast.success('Payment cancelled')
					onSuccess?.()
					handleOpenChange(false)
				},
				onError: (err) => {
					toast.error(
						err instanceof Error ? err.message : 'Failed to cancel payment',
					)
				},
			},
		)
	}

	return (
		<Dialog open={opened} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Cancel Payment</DialogTitle>
					<DialogDescription>
						This will reverse a recorded payment of{' '}
						<span className="text-foreground font-medium">
							{formatAmount(
								convertPesewasToCedis(invoice.total_amount),
								invoice.currency,
							)}
						</span>{' '}
						on invoice {invoice.code}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
						<AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
						<AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
							This action cannot be undone. The invoice status will be updated
							to reflect the reversal.
						</AlertDescription>
					</Alert>

					<div className="space-y-1.5">
						<Label>
							Reason for cancelling{' '}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</Label>
						<Textarea
							placeholder="e.g. Payment recorded in error, wrong amount entered…"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter className="mt-6 flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Keep Payment
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isPending}
					>
						{isPending ? <Spinner /> : null}
						Cancel Payment
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
