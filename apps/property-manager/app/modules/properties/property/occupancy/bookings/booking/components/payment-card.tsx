import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { usePayBookingInvoice } from '~/api/bookings'
import {
	useAddLineItem,
	useRemoveLineItem,
	useUpdateLineItem,
} from '~/api/invoices'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
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
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH1 } from '~/components/ui/typography'
import { getBookingDuration, getBookingRateLabel } from '~/lib/booking.utils'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { useClient } from '~/providers/client-provider'

const INVOICE_STATUS_CONFIG: Record<
	string,
	{ label: string; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
	},
	ISSUED: {
		label: 'Unpaid',
		className:
			'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
	},
	PARTIALLY_PAID: {
		label: 'Partial',
		className:
			'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	},
	PAID: {
		label: 'Paid',
		className:
			'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
	},
	VOID: {
		label: 'Void',
		className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
	},
}

const RAIL_LABELS: Record<string, string> = {
	MOMO: 'Mobile Money',
	BANK_TRANSFER: 'Bank Transfer',
	OFFLINE: 'Cash / Offline',
	CARD: 'Card',
}

interface LineItemFormValues {
	label: string
	category: string
	quantity: number
	unit_amount: number
}

function LineItemDialog({
	open,
	onOpenChange,
	initial,
	isFeeItem,
	currency,
	onSave,
	isPending,
}: {
	open: boolean
	onOpenChange: (v: boolean) => void
	initial?: LineItemFormValues
	isFeeItem?: boolean
	currency: string
	onSave: (values: LineItemFormValues) => void
	isPending: boolean
}) {
	const { register, handleSubmit, watch, reset } =
		useForm<LineItemFormValues>({
			defaultValues: initial ?? {
				label: '',
				category: 'OTHER',
				quantity: 1,
				unit_amount: 0,
			},
		})

	useEffect(() => {
		if (open) {
			reset(initial ?? { label: '', category: 'OTHER', quantity: 1, unit_amount: 0 })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	const quantity = watch('quantity') || 1
	const unitAmount = watch('unit_amount') || 0
	const total = quantity * unitAmount

	const handleOpen = (v: boolean) => {
		if (!v) reset()
		onOpenChange(v)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{isFeeItem ? 'Edit booking fee' : initial ? 'Edit line item' : 'Add line item'}
					</DialogTitle>
				</DialogHeader>

				<form
					id="line-item-form"
					onSubmit={handleSubmit(onSave)}
					className="space-y-3"
				>
					{!isFeeItem && (
						<>
							<div className="space-y-1.5">
								<Label>Label</Label>
								<Input
									{...register('label', { required: true })}
									placeholder="e.g. Cleaning fee"
								/>
							</div>

							<div className="space-y-1.5">
								<Label>Quantity</Label>
								<Input
									type="number"
									min={1}
									step={1}
									{...register('quantity', { valueAsNumber: true, min: 1 })}
								/>
							</div>
						</>
					)}

					<div className="space-y-1.5">
						<Label>Unit amount ({currency})</Label>
						<Input
							type="number"
							min={0}
							step={0.01}
							{...register('unit_amount', { valueAsNumber: true })}
						/>
					</div>

					<div className="bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
						<span className="text-muted-foreground">Total</span>
						<span className="font-medium">{formatAmount(total, currency)}</span>
					</div>
				</form>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => handleOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" form="line-item-form" disabled={isPending}>
						{isPending ? <Spinner /> : null}
						{initial ? 'Save' : 'Add'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function RecordPaymentDialog({
	open,
	onOpenChange,
	invoice,
	clientId,
	propertyId,
	bookingId,
	onSuccess,
}: {
	open: boolean
	onOpenChange: (v: boolean) => void
	invoice: Invoice
	clientId: string
	propertyId: string
	bookingId: string
	onSuccess: () => void
}) {
	const [selectedAccountId, setSelectedAccountId] = useState('')
	const [reference, setReference] = useState('')
	const { mutateAsync: pay, isPending } = usePayBookingInvoice()

	const { data: accountsData } = useGetPaymentAccounts(clientId, {
		pagination: { per: 100 },
		filters: {
			owner_types: ['PROPERTY_MANAGER', 'SYSTEM'],
			status: 'ACTIVE',
			rail: invoice.allowed_payment_rails?.[0],
		},
	})
	const accounts = accountsData?.rows ?? []

	const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

	const handlePay = async () => {
		if (!selectedAccount) return
		try {
			await pay({
				clientId,
				propertyId,
				bookingId,
				invoiceId: invoice.id,
				body: {
					amount: invoice.total_amount,
					payment_account_id: selectedAccountId,
					provider: selectedAccount.rail,
					reference: reference || undefined,
				},
			})
			toast.success('Payment recorded')
			onSuccess()
			onOpenChange(false)
		} catch {
			toast.error('Failed to record payment')
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<p className="text-muted-foreground text-sm">
						Recording offline payment of{' '}
						<span className="text-foreground font-medium">
							{formatAmount(convertPesewasToCedis(invoice.total_amount), invoice.currency)}
						</span>
					</p>

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
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={() => void handlePay()}
						disabled={isPending || !selectedAccountId}
					>
						{isPending ? <Spinner /> : null}
						Confirm payment
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export function PaymentCard({
	booking,
	clientId,
	propertyId,
}: {
	booking: Booking
	clientId: string
	propertyId: string
}) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const resolvedClientId = clientId || (clientUser?.client_id ?? '')

	const [editMode, setEditMode] = useState(false)
	const [addOpen, setAddOpen] = useState(false)
	const [editingItem, setEditingItem] = useState<InvoiceLineItem | null>(null)
	const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
	const [payOpen, setPayOpen] = useState(false)

	const { mutateAsync: addLineItem, isPending: isAdding } = useAddLineItem()
	const { mutateAsync: updateLineItem, isPending: isUpdating } = useUpdateLineItem()
	const { mutateAsync: removeLineItem, isPending: isRemoving } = useRemoveLineItem()

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.BOOKINGS, resolvedClientId, propertyId, booking.id],
		})

	const { count, label: periodLabel } = getBookingDuration(
		booking.check_in_date,
		booking.check_out_date,
		booking.stay_frequency,
	)
	const rateLabel = getBookingRateLabel(booking.stay_frequency)

	const invoice = booking.invoice
	const lineItems = invoice?.line_items ?? []
	const bookingFeeItem = lineItems.find((item) => item.category === 'BOOKING_FEE')
	const currency = invoice?.currency ?? 'GHS'
	const periodRate = convertPesewasToCedis(bookingFeeItem?.unit_amount ?? 0)

	const invoiceTotal = invoice
		? convertPesewasToCedis(invoice.total_amount)
		: convertPesewasToCedis(bookingFeeItem?.total_amount ?? 0)
	const invoiceTaxes = invoice ? convertPesewasToCedis(invoice.taxes) : 0

	// Status badge: PENDING booking always shows Draft; confirmed+ uses invoice status
	const statusCfg =
		booking.status === 'PENDING'
			? INVOICE_STATUS_CONFIG['DRAFT']
			: invoice
				? INVOICE_STATUS_CONFIG[invoice.status]
				: INVOICE_STATUS_CONFIG['ISSUED']

	const isPayable =
		booking.status !== 'PENDING' &&
		!!invoice &&
		invoice.status !== 'PAID' &&
		invoice.status !== 'VOID'

	const isEditable =
		!!invoice &&
		invoice.status !== 'PAID' &&
		invoice.status !== 'VOID'

	const handleAddLineItem = async (values: LineItemFormValues) => {
		if (!invoice) return
		try {
			await addLineItem({
				client_id: resolvedClientId,
				property_id: propertyId,
				invoice_id: invoice.id,
				label: values.label,
				category: values.category,
				quantity: values.quantity,
				unit_amount: Math.round(values.unit_amount * 100),
				total_amount: Math.round(values.quantity * values.unit_amount * 100),
				currency: currency,
			})
			toast.success('Line item added')
			void invalidate()
			setAddOpen(false)
		} catch {
			toast.error('Failed to add line item')
		}
	}

	const handleUpdateLineItem = async (values: LineItemFormValues) => {
		if (!editingItem || !invoice) return
		try {
			await updateLineItem({
				client_id: resolvedClientId,
				property_id: propertyId,
				invoice_id: invoice.id,
				line_item_id: editingItem.id,
				label: values.label,
				category: values.category,
				quantity: values.quantity,
				unit_amount: Math.round(values.unit_amount * 100),
				total_amount: Math.round(values.quantity * values.unit_amount * 100),
			})
			toast.success('Line item updated')
			void invalidate()
			setEditingItem(null)
		} catch {
			toast.error('Failed to update line item')
		}
	}

	const handleRemoveLineItem = async (lineItemId: string) => {
		if (!invoice) return
		try {
			await removeLineItem({
				client_id: resolvedClientId,
				property_id: propertyId,
				invoice_id: invoice.id,
				line_item_id: lineItemId,
			})
			toast.success('Line item removed')
			void invalidate()
		} catch {
			toast.error('Failed to remove line item')
		}
	}

	return (
		<>
			<Card className="shadow-none">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
							Payment
						</CardTitle>
						<div className="flex items-center gap-2">
							{isEditable && !editMode && (
								<button
									type="button"
									onClick={() => setEditMode(true)}
									className="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="Edit invoice"
								>
									<Pencil className="size-3.5" />
								</button>
							)}
							{editMode && (
								<button
									type="button"
									onClick={() => setEditMode(false)}
									className="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="Close edit mode"
								>
									<X className="size-3.5" />
								</button>
							)}
							<Badge
								variant="outline"
								className={`text-[10px] tracking-wide uppercase ${statusCfg?.className}`}
							>
								{statusCfg?.label}
							</Badge>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<div>
						<p className="text-muted-foreground text-xs font-light">
							Booking total
						</p>
						<TypographyH1 className="text-2xl font-light">
							{formatAmount(invoiceTotal, currency)}
						</TypographyH1>
					</div>

					<Separator />

					<div className="space-y-2">
						{lineItems.length > 0 ? (
							lineItems.map((item) => (
								<div key={item.id} className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
										{item.label}
										{item.quantity > 1 ? ` ×${item.quantity}` : ''}
									</span>
									<div className="flex items-center gap-1">
										<span className="text-xs font-medium">
											{formatAmount(convertPesewasToCedis(item.total_amount), currency)}
										</span>
										{editMode && (
											<>
												<button
													type="button"
													onClick={() => setEditingItem(item)}
													className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
												>
													<Pencil className="size-3" />
												</button>
												{item.category !== 'BOOKING_FEE' && (
													<button
														type="button"
														onClick={() => setDeletingItemId(item.id)}
														className="text-muted-foreground hover:text-destructive transition-colors"
													>
														<Trash2 className="size-3" />
													</button>
												)}
											</>
										)}
									</div>
								</div>
							))
						) : (
							<div className="flex items-center justify-between gap-4">
								<span className="text-muted-foreground text-xs">
									{rateLabel} × {count} {periodLabel}
								</span>
								<span className="text-xs font-medium">
									{formatAmount(periodRate * count, currency)}
								</span>
							</div>
						)}

						{invoiceTaxes > 0 && !editMode ? (
							<div className="flex items-center justify-between gap-4">
								<span className="text-muted-foreground text-xs">Taxes</span>
								<span className="text-xs font-medium">
									{formatAmount(invoiceTaxes, currency)}
								</span>
							</div>
						) : null}

						{editMode ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => setAddOpen(true)}
							>
								<Plus className="size-3.5" />
								Add line item
							</Button>
						) : null}

						<Separator />

						<div className="flex items-center justify-between gap-4">
							<span className="text-xs font-semibold">Total due</span>
							<span className="text-xs font-bold">
								{formatAmount(invoiceTotal, currency)}
							</span>
						</div>
					</div>

					{isPayable && !editMode ? (
						<Button
							type="button"
							size="sm"
							className="w-full"
							onClick={() => setPayOpen(true)}
						>
							Record payment
						</Button>
					) : null}
				</CardContent>
			</Card>

			<LineItemDialog
				open={addOpen}
				onOpenChange={setAddOpen}
				currency={currency}
				onSave={(v) => void handleAddLineItem(v)}
				isPending={isAdding}
			/>

			<LineItemDialog
				open={!!editingItem}
				onOpenChange={(v) => { if (!v) setEditingItem(null) }}
				initial={
					editingItem
						? {
								label: editingItem.label,
								category: editingItem.category,
								quantity: editingItem.quantity,
								unit_amount: convertPesewasToCedis(editingItem.unit_amount),
							}
						: undefined
				}
				isFeeItem={editingItem?.category === 'BOOKING_FEE'}
				currency={currency}
				onSave={(v) => void handleUpdateLineItem(v)}
				isPending={isUpdating}
			/>

			{invoice ? (
				<RecordPaymentDialog
					open={payOpen}
					onOpenChange={setPayOpen}
					invoice={invoice}
					clientId={resolvedClientId}
					propertyId={propertyId}
					bookingId={booking.id}
					onSuccess={invalidate}
				/>
			) : null}

			<AlertDialog
				open={!!deletingItemId}
				onOpenChange={(v) => { if (!v) setDeletingItemId(null) }}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove line item?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the line item from the invoice.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							disabled={isRemoving}
							onClick={() => {
								if (deletingItemId) void handleRemoveLineItem(deletingItemId)
								setDeletingItemId(null)
							}}
						>
							{isRemoving ? <Spinner /> : null}
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
