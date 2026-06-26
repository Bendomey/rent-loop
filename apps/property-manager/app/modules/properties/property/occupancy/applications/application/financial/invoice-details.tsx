import dayjs from 'dayjs'
import {
	CalendarClock,
	CheckCircle2,
	Clock,
	CreditCard,
	Receipt,
} from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useDeleteInvoice, useVoidInvoice } from '~/api/invoices'
import { usePayInvoice } from '~/api/invoices'
import { RecordPaymentDialog } from '~/components/blocks/record-payment-dialog'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const STATUS_CONFIG: Record<
	Invoice['status'],
	{ label: string; icon: typeof CheckCircle2; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		icon: Clock,
		className: 'bg-zinc-50 text-zinc-600 border-zinc-200',
	},
	ISSUED: {
		label: 'Waiting for payment',
		icon: Clock,
		className: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	PARTIALLY_PAID: {
		label: 'Partially paid',
		icon: Clock,
		className: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	PAID: {
		label: 'Paid',
		icon: CheckCircle2,
		className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	VOID: {
		label: 'Voided',
		icon: Clock,
		className: 'bg-zinc-50 text-zinc-500 border-zinc-200',
	},
}

const RAIL_LABELS: Record<PAYMENT_RAIL, string> = {
	MOMO: 'Mobile Money',
	BANK_TRANSFER: 'Bank Transfer',
	OFFLINE: 'Cash / Offline',
	CARD: 'Card',
}

interface InvoiceDetailsProps {
	invoice: Invoice
	propertyId: string
}

export function InvoiceDetails({
	invoice,
	propertyId,
}: InvoiceDetailsProps) {
	const revalidator = useRevalidator()
	const { clientUser } = useClient()
	const [showReconfigureAlert, setShowReconfigureAlert] = useState(false)
	const [showPayDialog, setShowPayDialog] = useState(false)

	const { isPending: isVoiding, mutate: voidInvoiceMutation } = useVoidInvoice()
	const { mutate: deleteInvoiceMutation } = useDeleteInvoice()
	const { isPending: isRecordingPayment, mutate: payInvoiceMutation } =
		usePayInvoice()

	const handleVoidConfirm = () => {
		voidInvoiceMutation(
			{
				client_id: safeString(clientUser?.client_id),
				property_id: propertyId,
				id: invoice.id,
			},
			{
				onError: () => {
					toast.error('Failed to void invoice. Please try again.')
				},
				onSuccess: () => {
					deleteInvoiceMutation(
						{
							client_id: safeString(clientUser?.client_id),
							property_id: propertyId,
							id: invoice.id,
						},
						{
							onError: () => {
								toast.error('Invoice voided but could not be deleted.')
								void revalidator.revalidate()
							},
							onSuccess: () => {
								toast.success(
									'Invoice cancelled. You can now update the payment setup.',
								)
								setShowReconfigureAlert(false)
								void revalidator.revalidate()
							},
						},
					)
				},
			},
		)
	}

	const handleRecordPayment = ({
		payment_account_id,
		provider,
		reference,
	}: {
		payment_account_id: string
		provider: string
		reference?: string
	}) => {
		payInvoiceMutation(
			{
				client_id: safeString(clientUser?.client_id),
				property_id: propertyId,
				invoice_id: invoice.id,
				body: { amount: invoice.total_amount, payment_account_id, provider: provider as 'MTN' | 'VODAFONE' | 'AIRTELTIGO' | 'PAYSTACK' | 'BANK_API' | 'CASH', reference },
			},
			{
				onError: () => {
					toast.error('Failed to record payment. Please try again.')
				},
				onSuccess: () => {
					toast.success('Payment recorded successfully.')
					setShowPayDialog(false)
					void revalidator.revalidate()
				},
			},
		)
	}

	const statusConfig = STATUS_CONFIG[invoice.status]
	const StatusIcon = statusConfig.icon
	const isActive =
		invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID'
	const isPaid = invoice.status === 'PAID'
	const isVoided = invoice.status === 'VOID'

	return (
		<>
			<Card className="shadow-none">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<CardTitle>Initial Payment Invoice</CardTitle>
							<CardDescription>
								Invoice generated for the tenant.
							</CardDescription>
						</div>
						<Badge variant="outline" className={statusConfig.className}>
							<StatusIcon className="mr-1 size-3" />
							{statusConfig.label}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Invoice metadata */}
					<div className="space-y-3 rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<CalendarClock className="size-4 text-zinc-500" />
							<h3 className="text-sm font-medium">Invoice Info</h3>
						</div>

						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-500">Reference</span>
								<span className="font-mono">{invoice.code}</span>
							</div>

							<div className="flex justify-between">
								<span className="text-zinc-500">Currency</span>
								<span>{invoice.currency}</span>
							</div>

							{invoice.issued_at && (
								<div className="flex justify-between">
									<span className="text-zinc-500">Issued On</span>
									<span>{dayjs(invoice.issued_at).format('MMM D, YYYY')}</span>
								</div>
							)}

							{invoice.due_date && (
								<div className="flex justify-between">
									<span className="text-zinc-500">Due Date</span>
									<span>{dayjs(invoice.due_date).format('MMM D, YYYY')}</span>
								</div>
							)}

							{isPaid && invoice.paid_at && (
								<div className="flex justify-between">
									<span className="text-zinc-500">Paid on</span>
									<span className="text-emerald-600">
										{dayjs(invoice.paid_at).format('MMM D, YYYY')}
									</span>
								</div>
							)}

							{isVoided && invoice.voided_at && (
								<div className="flex justify-between">
									<span className="text-zinc-500">Voided on</span>
									<span className="text-zinc-500">
										{dayjs(invoice.voided_at).format('MMM D, YYYY')}
									</span>
								</div>
							)}
						</div>

						{invoice.allowed_payment_rails.length > 0 && (
							<>
								<Separator />
								<div className="space-y-1.5">
									<p className="text-xs text-zinc-500">
										Accepted payment methods
									</p>
									<div className="flex flex-wrap gap-1.5">
										{invoice.allowed_payment_rails.map((rail) => (
											<Badge key={rail} variant="outline" className="text-xs">
												{RAIL_LABELS[rail]}
											</Badge>
										))}
									</div>
								</div>
							</>
						)}
					</div>

					{/* Line items */}
					<div className="space-y-3 rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<Receipt className="size-4 text-zinc-500" />
							<h3 className="text-sm font-medium">Items</h3>
						</div>

						<div className="space-y-2">
							{invoice.line_items.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between text-sm"
								>
									<span className="text-zinc-500">{item.label}</span>
									<span>
										{formatAmount(
											convertPesewasToCedis(item.total_amount),
											item.currency,
										)}
									</span>
								</div>
							))}

							<Separator />

							<div className="flex items-center justify-between text-sm font-semibold">
								<span>Total</span>
								<span>
									{formatAmount(
										convertPesewasToCedis(invoice.total_amount),
										invoice.currency,
									)}
								</span>
							</div>
						</div>
					</div>
				</CardContent>

				<CardFooter className="flex justify-between">
					<div>
						{!isPaid && !isVoided && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowReconfigureAlert(true)}
							>
								Change Payment Setup
							</Button>
						)}
					</div>
					<div>
						{isActive && (
							<Button size="sm" onClick={() => setShowPayDialog(true)}>
								<CreditCard className="size-4" />
								Record Payment
							</Button>
						)}
					</div>
				</CardFooter>
			</Card>

			{/* Reconfigure (void) confirmation */}
			<AlertDialog
				open={showReconfigureAlert}
				onOpenChange={setShowReconfigureAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Change the payment setup?</AlertDialogTitle>
						<AlertDialogDescription>
							This will cancel the current invoice so you can update the payment
							details. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isVoiding}
							onClick={(e) => {
								e.preventDefault()
								handleVoidConfirm()
							}}
						>
							{isVoiding ? <Spinner /> : null}
							Void Invoice
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<RecordPaymentDialog
				open={showPayDialog}
				onOpenChange={setShowPayDialog}
				invoice={invoice}
				clientId={safeString(clientUser?.client_id)}
				isPending={isRecordingPayment}
				onConfirm={handleRecordPayment}
			/>
		</>
	)
}
