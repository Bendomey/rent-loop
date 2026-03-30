import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, FileText, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	type GenerateExpenseInvoicePayer,
	useCreateExpense,
	useDeleteExpense,
	useGenerateExpenseInvoice,
	useGetLeaseExpenses,
} from '~/api/expenses'
import { useDeleteInvoice, useVoidInvoice } from '~/api/invoices'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
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
import { Switch } from '~/components/ui/switch'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { getInvoiceStatusLabel } from '~/lib/invoice'

const payerRowSchema = z.object({
	payer_type: z.enum(['TENANT', 'PROPERTY_OWNER']),
	payee_type: z.enum(['TENANT', 'PROPERTY_OWNER', 'EXTERNAL']),
	amount: z.string().min(1, 'Required'),
})

const expenseSchema = z.object({
	description: z.string().min(1, 'Description is required'),
	amount: z.string().min(1, 'Amount is required'),
	generate_invoice: z.boolean(),
	payers: z.array(payerRowSchema),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>
type PayerRow = z.infer<typeof payerRowSchema>

interface PayerFormProps {
	totalAmount: number
	payers: PayerRow[]
	onChange: (payers: PayerRow[]) => void
}

function PayerForm({ totalAmount, payers, onChange }: PayerFormProps) {
	const canAddRow = payers.length < 2

	const handlePayerChange = (
		index: number,
		field: keyof PayerRow,
		value: string,
	) => {
		const updated: PayerRow[] = payers.map((p, i) => {
			if (i !== index) return p
			if (field === 'payer_type')
				return { ...p, payer_type: value as PayerRow['payer_type'] }
			if (field === 'payee_type')
				return { ...p, payee_type: value as PayerRow['payee_type'] }
			return { ...p, amount: value }
		})

		if (field === 'amount' && updated.length === 2) {
			const edited = parseFloat(value) || 0
			const remaining = Math.max(0, totalAmount - edited)
			const otherIdx = index === 0 ? 1 : 0
			const other = updated[otherIdx]
			if (other) updated[otherIdx] = { ...other, amount: remaining.toFixed(2) }
		}

		onChange(updated)
	}

	const addRow = () => {
		if (payers.length >= 2) return
		const existingTotal = payers.reduce(
			(sum, p) => sum + (parseFloat(p.amount) || 0),
			0,
		)
		const remaining = Math.max(0, totalAmount - existingTotal)
		onChange([
			...payers,
			{
				payer_type: 'TENANT',
				payee_type: 'PROPERTY_OWNER',
				amount: remaining.toFixed(2),
			},
		])
	}

	const removeRow = (index: number) => {
		const updated: PayerRow[] = payers.filter((_, i) => i !== index)
		const first = updated[0]
		if (updated.length === 1 && first) {
			updated[0] = { ...first, amount: totalAmount.toFixed(2) }
		}
		onChange(updated)
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium">
					Invoice{payers.length > 1 ? 's' : ''}
				</p>
				{canAddRow && (
					<Button type="button" variant="outline" size="sm" onClick={addRow}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Add Row
					</Button>
				)}
			</div>
			{payers.map((payer, index) => (
				<div
					key={index}
					className="bg-background grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3"
				>
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Who Pays</label>
						<Select
							value={payer.payer_type}
							onValueChange={(v) => handlePayerChange(index, 'payer_type', v)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="TENANT">Tenant</SelectItem>
								<SelectItem value="PROPERTY_OWNER">Property Manager</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Who receives payment</label>
						<Select
							value={payer.payee_type}
							onValueChange={(v) => handlePayerChange(index, 'payee_type', v)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="TENANT">Tenant</SelectItem>
								<SelectItem value="PROPERTY_OWNER">Property Manager</SelectItem>
								<SelectItem value="EXTERNAL">External/Vendor</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end gap-2">
						<div className="flex min-w-0 flex-1 flex-col gap-1.5">
							<label className="text-sm font-medium">Amount (GHS)</label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={payer.amount}
								disabled={payers.length === 1}
								onChange={(e) =>
									handlePayerChange(index, 'amount', e.target.value)
								}
							/>
						</div>
						{payers.length > 1 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-destructive hover:text-destructive mb-0.5 h-8 w-8 shrink-0"
								onClick={() => removeRow(index)}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			))}
		</div>
	)
}

interface InvoiceFormSheetProps {
	expenseId: string
	expenseAmount: number
	leaseId: string
	propertyId: string
	onClose: () => void
}

function InvoiceFormSheet({
	expenseId,
	expenseAmount,
	leaseId,
	propertyId,
	onClose,
}: InvoiceFormSheetProps) {
	const queryClient = useQueryClient()
	const generateInvoice = useGenerateExpenseInvoice()
	const [payers, setPayers] = useState<PayerRow[]>([
		{
			payer_type: 'TENANT',
			payee_type: 'PROPERTY_OWNER',
			amount: expenseAmount.toFixed(2),
		},
	])

	const handleGenerate = () => {
		const apiPayers: GenerateExpenseInvoicePayer[] = payers.map((p) => ({
			payer_type: p.payer_type,
			payee_type: p.payee_type,
			amount: Math.round(parseFloat(p.amount) * 100),
		}))

		generateInvoice.mutate(
			{
				property_id: propertyId,
				expense_id: expenseId,
				payers: apiPayers,
			},
			{
				onSuccess: () => {
					toast.success('Invoice created')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.LEASES, propertyId, leaseId, 'expenses'],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
					onClose()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to generate invoice',
					),
			},
		)
	}

	return (
		<div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
			<PayerForm
				totalAmount={expenseAmount}
				payers={payers}
				onChange={setPayers}
			/>
			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" size="sm" onClick={onClose}>
					Cancel
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={handleGenerate}
					disabled={generateInvoice.isPending}
				>
					{generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
				</Button>
			</div>
		</div>
	)
}

interface LeaseExpensesTabProps {
	leaseId: string
	propertyId: string
}

export function LeaseExpensesTab({
	leaseId,
	propertyId,
}: LeaseExpensesTabProps) {
	const queryClient = useQueryClient()
	const [showForm, setShowForm] = useState(false)
	const [activeInvoiceExpenseId, setActiveInvoiceExpenseId] = useState<
		string | null
	>(null)
	const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)

	const {
		data: expensesData,
		isLoading,
		isError,
		refetch,
	} = useGetLeaseExpenses(propertyId, leaseId, {
		pagination: { page: 1, per: 100 },
		filters: {},
		populate: ['Invoices'],
	})
	const expenses = expensesData?.rows
	const createExpense = useCreateExpense()
	const deleteExpense = useDeleteExpense()
	const generateInvoice = useGenerateExpenseInvoice()
	const voidInvoice = useVoidInvoice()
	const deleteInvoice = useDeleteInvoice()

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			description: '',
			amount: '',
			generate_invoice: false,
			payers: [
				{ payer_type: 'TENANT', payee_type: 'PROPERTY_OWNER', amount: '' },
			],
		},
	})

	const generateInvoiceOn = form.watch('generate_invoice')
	const expenseAmountValue = form.watch('amount')

	const invalidateExpenses = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.LEASES, propertyId, leaseId, 'expenses'],
		})
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.EXPENSES, propertyId],
		})
	}

	const onSubmit = (values: ExpenseFormValues) => {
		const amount = parseFloat(values.amount)
		if (isNaN(amount) || amount <= 0) {
			form.setError('amount', { message: 'Amount must be positive' })
			return
		}

		const amountPesewas = Math.round(amount * 100)

		createExpense.mutate(
			{
				property_id: propertyId,
				context_type: 'LEASE',
				context_lease_id: leaseId,
				description: values.description,
				amount: amountPesewas,
			},
			{
				onSuccess: (expense) => {
					if (!values.generate_invoice || !expense) {
						toast.success('Expense added')
						form.reset()
						setShowForm(false)
						invalidateExpenses()
						return
					}

					const apiPayers: GenerateExpenseInvoicePayer[] = values.payers.map(
						(p) => ({
							payer_type: p.payer_type,
							payee_type: p.payee_type,
							amount: Math.round(parseFloat(p.amount) * 100),
						}),
					)

					generateInvoice.mutate(
						{
							property_id: propertyId,
							expense_id: expense.id,
							payers: apiPayers,
						},
						{
							onSuccess: () => {
								toast.success('Expense added and invoice draft created')
								form.reset()
								setShowForm(false)
								invalidateExpenses()
								void queryClient.invalidateQueries({
									queryKey: [QUERY_KEYS.INVOICES],
								})
							},
							onError: (err) => {
								toast.warning('Expense added, but invoice generation failed')
								toast.error(
									err instanceof Error
										? err.message
										: 'Failed to generate invoice',
								)
								form.reset()
								setShowForm(false)
								invalidateExpenses()
							},
						},
					)
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to add expense',
					),
			},
		)
	}

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return
		const expense = pendingDelete
		setPendingDelete(null)

		try {
			if (expense.invoices.length > 0) {
				await Promise.all(
					expense.invoices.map((inv) =>
						voidInvoice.mutateAsync({
							property_id: propertyId,
							id: inv.id,
							voided_reason: `Associated expense - ${expense.code} was deleted`,
						}),
					),
				)
				await Promise.all(
					expense.invoices.map((inv) =>
						deleteInvoice.mutateAsync({ property_id: propertyId, id: inv.id }),
					),
				)
				void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
			}

			deleteExpense.mutate(
				{
					property_id: propertyId,
					expense_id: expense.id,
				},
				{
					onSuccess: () => {
						toast.success('Expense removed')
						invalidateExpenses()
					},
					onError: (err) =>
						toast.error(
							err instanceof Error ? err.message : 'Failed to remove expense',
						),
				},
			)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to void invoice(s)',
			)
		}
	}

	const total = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0

	const expenseAmountFloat = parseFloat(expenseAmountValue) || 0
	const currentPayers = form.watch('payers')

	return (
		<>
			<div className="flex flex-col gap-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{expenses && expenses.length > 0 && (
							<p className="text-sm font-medium">
								Total:{' '}
								<span className="text-foreground font-semibold">
									{formatAmount(total / 100)}
								</span>
							</p>
						)}
					</div>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button size="sm" onClick={() => setShowForm((v) => !v)}>
							{showForm ? 'Cancel' : 'Add Expense'}
						</Button>
					</PropertyPermissionGuard>
				</div>

				{showForm && (
					<div className="bg-muted/30 rounded-lg border p-4">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="Labour, materials..."
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Amount (GHS)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														step="0.01"
														min="0"
														placeholder="0.00"
														onChange={(e) => {
															field.onChange(e)
															if (currentPayers.length === 1) {
																form.setValue('payers.0.amount', e.target.value)
															}
														}}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="generate_invoice"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg sm:col-span-2">
												<div className="flex flex-col gap-0.5">
													<FormLabel>Generate Invoice</FormLabel>
													<TypographyMuted className="text-xs">
														Create an invoice draft for this expense
													</TypographyMuted>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={(checked) => {
															field.onChange(checked)
															if (checked) {
																form.setValue('payers', [
																	{
																		payer_type: 'TENANT',
																		payee_type: 'PROPERTY_OWNER',
																		amount:
																			expenseAmountFloat > 0
																				? expenseAmountFloat.toFixed(2)
																				: '',
																	},
																])
															}
														}}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>

								{generateInvoiceOn && (
									<PayerForm
										totalAmount={expenseAmountFloat}
										payers={currentPayers}
										onChange={(updated) => form.setValue('payers', updated)}
									/>
								)}

								<PropertyPermissionGuard roles={['MANAGER']}>
									<div className="flex justify-end">
										<Button
											type="submit"
											size="sm"
											disabled={
												createExpense.isPending || generateInvoice.isPending
											}
										>
											{createExpense.isPending || generateInvoice.isPending
												? 'Saving...'
												: 'Add Expense'}
										</Button>
									</div>
								</PropertyPermissionGuard>
							</form>
						</Form>
					</div>
				)}

				<Separator />

				{isError ? (
					<div className="flex flex-col items-center gap-2 py-6">
						<AlertCircle className="text-destructive h-5 w-5" />
						<TypographyMuted className="text-sm">
							Failed to load expenses.
						</TypographyMuted>
						<button
							onClick={() => void refetch()}
							className="text-primary text-xs underline underline-offset-2"
						>
							Try again
						</button>
					</div>
				) : isLoading ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
						))}
					</div>
				) : !expenses?.length ? (
					<TypographyMuted className="py-4 text-center text-sm">
						No expenses recorded.
					</TypographyMuted>
				) : (
					<div className="flex flex-col gap-2">
						{expenses.map((expense) => {
							const hasInvoices = expense.invoices.length > 0
							const isGeneratingForThis = activeInvoiceExpenseId === expense.id

							return (
								<div key={expense.id} className="flex flex-col gap-2">
									<div className="flex items-center justify-between rounded-lg border px-4 py-3">
										<div className="flex min-w-0 flex-col gap-0.5">
											<p className="truncate text-sm font-medium">
												{expense.description}
											</p>
											<div className="flex items-center gap-2">
												{hasInvoices ? (
													expense.invoices.map((inv) => (
														<Link
															key={inv.id}
															to={`/properties/${propertyId}/financials/invoices/${inv.id}`}
															className="hover:underline"
														>
															<Badge
																variant="outline"
																className={`px-1.5 py-0 text-[10px] ${
																	inv.status === 'PAID'
																		? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400'
																		: inv.status === 'ISSUED'
																			? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
																			: inv.status === 'PARTIALLY_PAID'
																				? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
																				: inv.status === 'VOID'
																					? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
																					: 'border-muted-foreground/30 text-muted-foreground'
																}`}
															>
																{inv.code} · {getInvoiceStatusLabel(inv.status)}
															</Badge>
														</Link>
													))
												) : (
													<Badge
														variant="outline"
														className="border-muted-foreground/30 px-1.5 py-0 text-[10px]"
													>
														Not invoiced
													</Badge>
												)}
												<TypographyMuted className="text-xs">
													{localizedDayjs(expense.created_at).format(
														'MMM D, YYYY',
													)}
												</TypographyMuted>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-3">
											<p className="text-sm font-semibold">
												{formatAmount(expense.amount / 100)}
											</p>
											<PropertyPermissionGuard roles={['MANAGER']}>
												<div className="flex items-center gap-1">
													{!hasInvoices && (
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="text-muted-foreground hover:text-foreground h-7 w-7"
																	onClick={() =>
																		setActiveInvoiceExpenseId(
																			isGeneratingForThis ? null : expense.id,
																		)
																	}
																>
																	<FileText className="h-3.5 w-3.5" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>Generate invoice</TooltipContent>
														</Tooltip>
													)}
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive hover:text-destructive h-7 w-7"
																onClick={() => setPendingDelete(expense)}
																disabled={
																	deleteExpense.isPending ||
																	voidInvoice.isPending
																}
															>
																<Trash2 className="h-3.5 w-3.5" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>Delete expense</TooltipContent>
													</Tooltip>
												</div>
											</PropertyPermissionGuard>
										</div>
									</div>
									{isGeneratingForThis && (
										<InvoiceFormSheet
											expenseId={expense.id}
											expenseAmount={expense.amount / 100}
											leaseId={leaseId}
											propertyId={propertyId}
											onClose={() => setActiveInvoiceExpenseId(null)}
										/>
									)}
								</div>
							)
						})}
					</div>
				)}
			</div>

			<AlertDialog
				open={!!pendingDelete}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete expense?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDelete && pendingDelete.invoices.length > 0 ? (
								<>
									This expense has{' '}
									<strong>
										{pendingDelete.invoices.length} invoice
										{pendingDelete.invoices.length > 1 ? 's' : ''}
									</strong>{' '}
									associated with it. They will be <strong>voided</strong>{' '}
									before the expense is deleted. This action cannot be undone.
								</>
							) : (
								'Are you sure you want to delete this expense? This action cannot be undone.'
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90 text-white"
							onClick={() => void handleConfirmDelete()}
						>
							{pendingDelete && pendingDelete.invoices.length > 0
								? 'Void & Delete'
								: 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
