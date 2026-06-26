import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePayInvoice } from '~/api/invoices'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

const RAIL_LABELS: Record<string, string> = {
	MOMO: 'Mobile Money',
	BANK_TRANSFER: 'Bank Transfer',
	OFFLINE: 'Offline Payment',
	CARD: 'Card',
}

interface RecordPaymentDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	invoice: Invoice
	clientId: string
	propertyId: string
	beforeConfirm?: () => Promise<void>
	onSuccess?: () => void
}

export function RecordPaymentDialog({
	open,
	onOpenChange,
	invoice,
	clientId,
	propertyId,
	beforeConfirm,
	onSuccess,
}: RecordPaymentDialogProps) {
	const [selectedAccountId, setSelectedAccountId] = useState('')
	const [reference, setReference] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	
	const { mutateAsync: pay } = usePayInvoice()

	const { data: accountsData } = useGetPaymentAccounts(clientId, {
		pagination: { per: 100 },
		filters: {
			owner_types: ['PROPERTY_OWNER', 'SYSTEM'],
			status: 'ACTIVE',
		},
	})
	const accounts = (accountsData?.rows ?? []).filter(
		(a) =>
			!invoice.allowed_payment_rails?.length ||
			invoice.allowed_payment_rails.includes(a.rail),
	)

	const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

	const handleOpenChange = (v: boolean) => {
		if (!v) {
			setSelectedAccountId('')
			setReference('')
		}
		onOpenChange(v)
	}

	const handleConfirm = async () => {
		if (!selectedAccount) return
		try {
			setIsLoading(true)
			await beforeConfirm?.()
			await pay({
				client_id: clientId,
				property_id: propertyId,
				invoice_id: invoice.id,
				body: {
					amount: invoice.total_amount,
					payment_account_id: selectedAccountId,
					provider: selectedAccount.provider ?? 'CASH',
					reference: reference || undefined,
				},
			})
			toast.success('Payment recorded')
			onSuccess?.()
			handleOpenChange(false)
		} catch {
			toast.error('Failed to record payment')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
					<DialogDescription>
						Recording payment of{' '}
						<span className="text-foreground font-medium">
							{formatAmount(
								convertPesewasToCedis(invoice.total_amount),
								invoice.currency,
							)}
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
						<AlertCircle className="size-4 text-blue-500 dark:text-blue-400" />
						<AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
							We only support offline payments for now. To enable online
							payments, reach out to support.
						</AlertDescription>
					</Alert>

					<div className="space-y-1.5">
						<Label>Payment account</Label>
						<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select an account" />
							</SelectTrigger>
							<SelectContent>
								{accounts.map((account) => (
									<SelectItem key={account.id} value={account.id}>
										{RAIL_LABELS[account.rail] ?? account.rail}
										{account.identifier ? ` · ${account.identifier}` : null}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label>
							Reference{' '}
							<span className="text-muted-foreground font-normal">(optional)</span>
						</Label>
						<Input
							placeholder="e.g. RCP-2024-001"
							value={reference}
							onChange={(e) => setReference(e.target.value)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={() => void handleConfirm()}
						disabled={isLoading || !selectedAccountId}
					>
						{isLoading ? <Spinner /> : null}
						Confirm payment
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
