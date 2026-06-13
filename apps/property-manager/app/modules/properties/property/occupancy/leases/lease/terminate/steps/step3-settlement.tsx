import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Plus, Receipt, SkipForward, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	type TerminationInvoiceLineItem,
	useCreateTerminationInvoice,
} from '~/api/lease-terminations'
import { useGetInvoices } from '~/api/invoices'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getInvoiceStatusLabel } from '~/lib/invoice'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const lineItemSchema = z.object({
	label: z.string().min(1, 'Label required'),
	category: z.enum([
		'EXPENSE',
		'DEPOSIT_REFUND',
		'EARLY_TERMINATION_FEE',
		'DAMAGE_CHARGE',
	]),
	unit_amount: z.string().min(1, 'Amount required'),
})

const invoiceSchema = z.object({
	payer_type: z.enum(['TENANT', 'PROPERTY_OWNER']),
	payee_type: z.enum(['PROPERTY_OWNER', 'TENANT']),
	line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

const CATEGORY_LABELS: Record<InvoiceLineItemCategory, string> = {
	EXPENSE: 'General Expense',
	DEPOSIT_REFUND: 'Deposit Refund',
	EARLY_TERMINATION_FEE: 'Early Termination Fee',
	DAMAGE_CHARGE: 'Damage Charge',
}

const INVOICE_STATUS_CLASSES: Record<Invoice['status'], string> = {
	DRAFT: 'border-muted-foreground/30 text-muted-foreground',
	ISSUED:
		'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
	PARTIALLY_PAID:
		'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
	PAID: 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
	VOID: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
}

interface Props {
	lease: Lease
	propertyId: string
	terminationId: string
	onBack: () => void
	onNext: () => void
}

export function StepSettlement({
	lease,
	propertyId,
	terminationId,
	onBack,
	onNext,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const [showForm, setShowForm] = useState(false)

	const { data: invoicesData, isLoading: isLoadingInvoices } = useGetInvoices(
		clientId,
		propertyId,
		{
			filters: { context_lease_termination_id: terminationId },
			pagination: { page: 1, per: 50 },
			populate: ['LineItems'],
		},
	)

	const { mutateAsync: createInvoice, isPending: isCreating } =
		useCreateTerminationInvoice()

	const invoices = invoicesData?.rows ?? []

	const form = useForm<InvoiceFormValues>({
		resolver: zodResolver(invoiceSchema),
		defaultValues: {
			payer_type: 'TENANT',
			payee_type: 'PROPERTY_OWNER',
			line_items: [{ label: '', category: 'EXPENSE', unit_amount: '' }],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'line_items',
	})

	const watchedPayerType = form.watch('payer_type')

	const onSubmit = async (values: InvoiceFormValues) => {
		try {
			const lineItems: TerminationInvoiceLineItem[] = values.line_items.map(
				(item) => ({
					label: item.label,
					category: item.category as InvoiceLineItemCategory,
					quantity: 1,
					unit_amount: Math.round(parseFloat(item.unit_amount) * 100),
					currency: 'GHS',
				}),
			)

			await createInvoice({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
				payer_type: values.payer_type,
				payee_type: values.payee_type,
				line_items: lineItems,
			})

			toast.success('Invoice created')
			form.reset()
			setShowForm(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create invoice',
			)
		}
	}

	return (
		<div className="flex flex-col gap-8 p-8">
			<div>
				<h2 className="text-base font-semibold">Financial Settlement</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Optional. Create invoices for any outstanding financial settlements —
					deposit refunds, damage charges, or early termination fees.
				</p>
			</div>

			{/* Existing invoices */}
			{isLoadingInvoices ? (
				<div className="space-y-3">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			) : invoices.length > 0 ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
							Invoices ({invoices.length})
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowForm(true)}
						>
							<Plus className="size-3.5" />
							Add Another
						</Button>
					</div>
					{invoices.map((invoice) => (
						<Link
							key={invoice.id}
							to={`/properties/${propertyId}/financials/invoices/${invoice.id}`}
							className="hover:bg-muted/40 group flex items-center justify-between rounded-xl border p-4 transition-colors"
						>
							<div className="flex min-w-0 items-center gap-3">
								<div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
									<Receipt className="text-muted-foreground size-5" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium">{invoice.code}</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										{invoice.payer_type === 'TENANT'
											? 'Tenant pays'
											: 'Landlord pays'}{' '}
										· {localizedDayjs(invoice.created_at).format('MMM D, YYYY')}
									</p>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-3">
								<p className="text-sm font-semibold">
									{formatAmount(
										convertPesewasToCedis(invoice.total_amount),
										invoice.currency,
									)}
								</p>
								<Badge
									variant="outline"
									className={`text-xs ${INVOICE_STATUS_CLASSES[invoice.status]}`}
								>
									{getInvoiceStatusLabel(invoice.status)}
								</Badge>
								<ExternalLink className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						</Link>
					))}
				</div>
			) : (
				!showForm && (
					<div className="rounded-xl border border-dashed p-8 text-center">
						<div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
							<Receipt className="text-muted-foreground size-6" />
						</div>
						<p className="text-sm font-medium">No settlement invoices yet</p>
						<p className="text-muted-foreground mt-1 text-sm">
							Create an invoice for deposit refunds, damage charges, or fees.
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => setShowForm(true)}
						>
							<Plus className="size-4" />
							Create Invoice
						</Button>
					</div>
				)
			)}

			{/* Create invoice form */}
			{showForm && (
				<div className="rounded-xl border p-6">
					<p className="mb-4 text-sm font-semibold">New Settlement Invoice</p>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="payer_type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Who Pays</FormLabel>
											<Select
												onValueChange={(v) => {
													field.onChange(v)
													form.setValue(
														'payee_type',
														v === 'TENANT' ? 'PROPERTY_OWNER' : 'TENANT',
													)
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="TENANT">Tenant</SelectItem>
													<SelectItem value="PROPERTY_OWNER">
														Landlord
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="payee_type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Who Receives</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem
														value="PROPERTY_OWNER"
														disabled={watchedPayerType === 'PROPERTY_OWNER'}
													>
														Landlord
													</SelectItem>
													<SelectItem
														value="TENANT"
														disabled={watchedPayerType === 'TENANT'}
													>
														Tenant
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<Separator />

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium">Line Items</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												label: '',
												category: 'EXPENSE',
												unit_amount: '',
											})
										}
									>
										<Plus className="size-3.5" />
										Add Item
									</Button>
								</div>

								{fields.map((field, index) => (
									<div
										key={field.id}
										className="grid grid-cols-12 items-start gap-2"
									>
										<FormField
											control={form.control}
											name={`line_items.${index}.label`}
											render={({ field }) => (
												<FormItem className="col-span-4">
													<FormControl>
														<Input {...field} placeholder="Description" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`line_items.${index}.category`}
											render={({ field }) => (
												<FormItem className="col-span-4">
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{(
																Object.keys(
																	CATEGORY_LABELS,
																) as InvoiceLineItemCategory[]
															).map((cat) => (
																<SelectItem key={cat} value={cat}>
																	{CATEGORY_LABELS[cat]}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`line_items.${index}.unit_amount`}
											render={({ field }) => (
												<FormItem className="col-span-3">
													<FormControl>
														<Input
															{...field}
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										{fields.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-destructive hover:text-destructive col-span-1 h-9 w-9"
												onClick={() => remove(index)}
											>
												<Trash2 className="size-3.5" />
											</Button>
										)}
									</div>
								))}
								{form.formState.errors.line_items?.root && (
									<p className="text-destructive text-xs">
										{form.formState.errors.line_items.root.message}
									</p>
								)}
							</div>

							<div className="flex justify-end gap-2 pt-1">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setShowForm(false)
										form.reset()
									}}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isCreating}>
									{isCreating ? <Spinner /> : null}
									Create Invoice
								</Button>
							</div>
						</form>
					</Form>
				</div>
			)}

			<div className="flex items-center justify-between border-t pt-4">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-2">
					{invoices.length === 0 && (
						<Button variant="ghost" onClick={onNext}>
							<SkipForward className="size-4" />
							Skip
						</Button>
					)}
					{invoices.length > 0 && <Button onClick={onNext}>Continue</Button>}
				</div>
			</div>
		</div>
	)
}
