import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateMRFinancial,
	useGetMRFinancials,
	useVoidMRFinancial,
} from '~/api/maintenance-request-financials'
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
import { Switch } from '~/components/ui/switch'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const SETTLEMENT_LABELS: Record<SettlementType, string> = {
	RECORD_ONLY: 'No one pays',
	TENANT_CHARGE: 'Tenant',
	VENDOR_EXPENSE: 'Vendor',
}

const STATUS_LABELS: Record<FinancialStatus, string> = {
	RECORDED: 'Recorded',
	OUTSTANDING: 'Outstanding',
	INVOICED: 'Invoiced',
	PARTIALLY_SETTLED: 'Part settled',
	SETTLED: 'Settled',
	VOIDED: 'Voided',
}

const STATUS_CLASSES: Record<FinancialStatus, string> = {
	RECORDED: 'bg-muted text-muted-foreground',
	OUTSTANDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
	INVOICED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
	PARTIALLY_SETTLED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
	SETTLED: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
	VOIDED: 'bg-destructive/10 text-destructive',
}

const TENANT_CHARGE_CATEGORIES: {
	value: TenantChargeCategory
	label: string
}[] = [
	{ value: 'MAINTENANCE_CHARGE', label: 'Maintenance charge' },
	{ value: 'DAMAGE_CHARGE', label: 'Damage charge' },
	{ value: 'UTILITY', label: 'Utility' },
	{ value: 'OTHER', label: 'Other' },
]

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
	{ value: 'REPAIRS', label: 'Repairs' },
	{ value: 'UTILITIES', label: 'Utilities' },
	{ value: 'INSURANCE', label: 'Insurance' },
	{ value: 'LANDSCAPING', label: 'Landscaping' },
	{ value: 'SECURITY', label: 'Security' },
	{ value: 'MANAGEMENT', label: 'Management' },
	{ value: 'OTHER', label: 'Other' },
]

const financialSchema = z
	.object({
		description: z.string().min(1, 'Description is required'),
		amount: z.string().min(1, 'Amount is required'),
		settlement_type: z.enum(['RECORD_ONLY', 'TENANT_CHARGE', 'VENDOR_EXPENSE']),
		charge_category: z.enum([
			'MAINTENANCE_CHARGE',
			'DAMAGE_CHARGE',
			'UTILITY',
			'OTHER',
		]),
		expense_category: z.enum([
			'REPAIRS',
			'UTILITIES',
			'INSURANCE',
			'LANDSCAPING',
			'SECURITY',
			'MANAGEMENT',
			'OTHER',
		]),
		vendor_name: z.string(),
		vendor_contact: z.string(),
		already_paid: z.boolean(),
	})
	.refine(
		(v) =>
			v.settlement_type !== 'VENDOR_EXPENSE' || v.vendor_name.trim() !== '',
		{ path: ['vendor_name'], message: 'Vendor name is required' },
	)

type FinancialFormValues = z.infer<typeof financialSchema>

interface FinancialsTabProps {
	requestId: string
	propertyId: string
	leaseId: Nullable<string>
}

export function FinancialsTab({
	requestId,
	propertyId,
	leaseId,
}: FinancialsTabProps) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const [showForm, setShowForm] = useState(false)
	const [pendingVoid, setPendingVoid] =
		useState<MaintenanceRequestFinancial | null>(null)

	const {
		data: financialsData,
		isLoading,
		isError,
		refetch,
	} = useGetMRFinancials(clientId, propertyId, requestId, {
		pagination: { page: 1, per: 100 },
		filters: {},
	})
	const financials = financialsData?.rows

	const createFinancial = useCreateMRFinancial()
	const voidFinancial = useVoidMRFinancial()

	const form = useForm<FinancialFormValues>({
		resolver: zodResolver(financialSchema),
		defaultValues: {
			description: '',
			amount: '',
			settlement_type: 'RECORD_ONLY',
			charge_category: 'MAINTENANCE_CHARGE',
			expense_category: 'REPAIRS',
			vendor_name: '',
			vendor_contact: '',
			already_paid: false,
		},
	})

	const settlementType = form.watch('settlement_type')

	const invalidate = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.MR_FINANCIALS],
		})
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] })
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})
	}

	const onSubmit = (values: FinancialFormValues) => {
		const amount = parseFloat(values.amount)
		if (isNaN(amount) || amount <= 0) {
			form.setError('amount', { message: 'Amount must be positive' })
			return
		}

		createFinancial.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				request_id: requestId,
				description: values.description,
				// The API works in pesewas throughout.
				amount: Math.round(amount * 100),
				settlement_type: values.settlement_type,
				...(values.settlement_type === 'TENANT_CHARGE' && {
					charge_category: values.charge_category,
				}),
				...(values.settlement_type === 'VENDOR_EXPENSE' && {
					expense_category: values.expense_category,
					vendor_name: values.vendor_name,
					vendor_contact: values.vendor_contact || undefined,
					already_paid: values.already_paid,
				}),
			},
			{
				onSuccess: () => {
					toast.success('Financial logged')
					form.reset()
					setShowForm(false)
					invalidate()
				},
				onError: (err: Error) => toast.error(err.message),
			},
		)
	}

	const onVoid = () => {
		if (!pendingVoid) return
		voidFinancial.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				request_id: requestId,
				financial_id: pendingVoid.id,
				reason: 'Voided from the maintenance request',
			},
			{
				onSuccess: () => {
					toast.success('Financial voided')
					setPendingVoid(null)
					invalidate()
				},
				onError: (err: Error) => {
					toast.error(err.message)
					setPendingVoid(null)
				},
			},
		)
	}

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2 py-2">
				{[0, 1].map((i) => (
					<div key={i} className="bg-muted h-14 animate-pulse rounded-lg" />
				))}
			</div>
		)
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center gap-3 py-10">
				<AlertCircle className="text-muted-foreground size-6" />
				<TypographyMuted>Couldn&apos;t load financials.</TypographyMuted>
				<Button size="sm" variant="outline" onClick={() => void refetch()}>
					Retry
				</Button>
			</div>
		)
	}

	const total =
		financials
			?.filter((f) => f.status !== 'VOIDED')
			.reduce((sum, f) => sum + f.amount, 0) ?? 0

	return (
		<>
			<div className="flex flex-col gap-4 py-2">
				<div className="flex items-center justify-between">
					{financials && financials.length > 0 ? (
						<p className="text-sm font-medium">
							Total:{' '}
							<span className="text-foreground font-semibold">
								{formatAmount(total / 100)}
							</span>
						</p>
					) : (
						<span />
					)}
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button size="sm" onClick={() => setShowForm((v) => !v)}>
							{showForm ? 'Cancel' : 'Log financial'}
						</Button>
					</PropertyPermissionGuard>
				</div>

				{showForm && (
					<div className="bg-card rounded-xl border p-5">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Labour, parts..." />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Amount (GHS)</FormLabel>
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

								<FormField
									control={form.control}
									name="settlement_type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Settled by</FormLabel>
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
													<SelectItem value="RECORD_ONLY">
														No one — just record the cost
													</SelectItem>
													{/* Absent, not disabled: without a lease there is
													    no tenant to charge, and nothing on this screen
													    can change that. */}
													{leaseId ? (
														<SelectItem value="TENANT_CHARGE">
															Tenant on this lease
														</SelectItem>
													) : null}
													<SelectItem value="VENDOR_EXPENSE">
														Landlord pays a vendor
													</SelectItem>
												</SelectContent>
											</Select>
											{!leaseId && (
												<TypographyMuted className="text-xs">
													This request has no lease, so it can&apos;t be charged
													to a tenant.
												</TypographyMuted>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>

								{settlementType === 'TENANT_CHARGE' && (
									<FormField
										control={form.control}
										name="charge_category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Charge category</FormLabel>
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
														{TENANT_CHARGE_CATEGORIES.map((c) => (
															<SelectItem key={c.value} value={c.value}>
																{c.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{settlementType === 'VENDOR_EXPENSE' && (
									<>
										<FormField
											control={form.control}
											name="vendor_name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Vendor name</FormLabel>
													<FormControl>
														<Input {...field} placeholder="Kwame Plumbing" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="vendor_contact"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Vendor contact (optional)</FormLabel>
													<FormControl>
														<Input {...field} placeholder="024 000 0000" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="expense_category"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Expense category</FormLabel>
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
															{EXPENSE_CATEGORIES.map((c) => (
																<SelectItem key={c.value} value={c.value}>
																	{c.label}
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
											name="already_paid"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg">
													<div className="flex flex-col gap-0.5">
														<FormLabel>Already paid</FormLabel>
														<TypographyMuted className="text-xs">
															Records the payment at the same time, so this
															expense lands settled.
														</TypographyMuted>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</>
								)}

								<Button
									type="submit"
									size="sm"
									className="self-end"
									disabled={createFinancial.isPending}
								>
									{createFinancial.isPending ? 'Saving...' : 'Save'}
								</Button>
							</form>
						</Form>
					</div>
				)}

				{!financials || financials.length === 0 ? (
					<div className="flex flex-col items-center gap-1 py-10">
						<TypographyMuted>No financials recorded.</TypographyMuted>
						<TypographyMuted className="text-xs">
							Log what this request cost, and who settles it.
						</TypographyMuted>
					</div>
				) : (
					<div className="divide-border divide-y rounded-xl border">
						{financials.map((financial) => (
							<div
								key={financial.id}
								className="flex items-start justify-between gap-4 p-4"
							>
								<div className="flex flex-col gap-1">
									<p className="text-sm font-medium">{financial.description}</p>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{SETTLEMENT_LABELS[financial.settlement_type]}
										</Badge>
										<Badge
											variant="outline"
											className={`text-xs ${STATUS_CLASSES[financial.status]}`}
										>
											{STATUS_LABELS[financial.status]}
										</Badge>
										{financial.expense?.vendor_name && (
											<TypographyMuted className="text-xs">
												{financial.expense.vendor_name}
											</TypographyMuted>
										)}
									</div>
								</div>
								<div className="flex flex-col items-end gap-2">
									<p className="text-sm font-semibold">
										{formatAmount(financial.amount / 100)}
									</p>
									{/* is_editable is the server's own guard, so the action
									    disappears exactly when the API would refuse it. */}
									{financial.is_editable && (
										<PropertyPermissionGuard roles={['MANAGER']}>
											<Button
												size="sm"
												variant="ghost"
												className="text-destructive h-auto p-0 text-xs"
												onClick={() => setPendingVoid(financial)}
											>
												Void
											</Button>
										</PropertyPermissionGuard>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<AlertDialog
				open={!!pendingVoid}
				onOpenChange={(open) => !open && setPendingVoid(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Void this financial?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingVoid?.settlement_type === 'TENANT_CHARGE'
								? 'The charge on the tenant’s account is voided with it.'
								: pendingVoid?.settlement_type === 'VENDOR_EXPENSE'
									? 'The expense and the bill raised for it are voided with it.'
									: 'This removes the recorded cost.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={onVoid}
							disabled={voidFinancial.isPending}
						>
							{voidFinancial.isPending ? 'Voiding...' : 'Void'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
