import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormDescription,
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
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

const Schema = z.object({
	rent_fee: z.number({ error: 'Required' }).min(1, 'Must be > 0'),
	rent_fee_currency: z.string({ error: 'Required' }),
	payment_frequency: z
		.enum([
			'HOURLY',
			'DAILY',
			'MONTHLY',
			'QUARTERLY',
			'BIANNUALLY',
			'ANNUALLY',
			'ONETIME',
		])
		.optional(),
	move_in_date: z.date({ error: 'Required' }),
	stay_duration: z.number({ error: 'Required' }).min(1),
	stay_duration_frequency: z.enum(['HOURS', 'DAYS', 'MONTHS'], {
		error: 'Required',
	}),
	rent_payment_status: z.enum(['NONE', 'PARTIAL', 'FULL']),
	periods_paid: z.number().min(1).optional(),
	billing_cycle_start_date: z.date().optional(),
	security_deposit_fee: z.number().min(0),
	security_deposit_fee_currency: z.string({ error: 'Required' }),
})

export type Step3Values = z.infer<typeof Schema>

interface UnitDefaults {
	rent_fee: number
	rent_fee_currency: string
	payment_frequency: string
	stay_duration_frequency: Step3Values['stay_duration_frequency']
}

interface Step3Props {
	initialValues?: Partial<Step3Values>
	unitDefaults?: UnitDefaults
	onNext: (values: Step3Values) => void
	onBack: () => void
	onCancel: () => void
}

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP']
const FREQUENCIES = [
	{ value: 'MONTHLY', label: 'Monthly' },
	{ value: 'QUARTERLY', label: 'Quarterly' },
	{ value: 'BIANNUALLY', label: 'Bi-Annually' },
	{ value: 'ANNUALLY', label: 'Annually' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'HOURLY', label: 'Hourly' },
	{ value: 'ONETIME', label: 'One Time' },
]
const DURATION_FREQUENCIES = [
	{ value: 'MONTHS', label: 'Months' },
	{ value: 'DAYS', label: 'Days' },
	{ value: 'HOURS', label: 'Hours' },
]

export function WizardStep3({
	initialValues,
	unitDefaults,
	onNext,
	onBack,
	onCancel,
}: Step3Props) {
	const form = useForm<Step3Values>({
		resolver: zodResolver(Schema),
		defaultValues: {
			rent_fee: unitDefaults?.rent_fee ?? 0,
			rent_fee_currency: unitDefaults?.rent_fee_currency ?? 'GHS',
			payment_frequency:
				(unitDefaults?.payment_frequency as Step3Values['payment_frequency']) ??
				undefined,
			stay_duration: 0,
			stay_duration_frequency:
				unitDefaults?.stay_duration_frequency ?? 'MONTHS',
			rent_payment_status: 'NONE',
			periods_paid: undefined,
			security_deposit_fee: 0,
			security_deposit_fee_currency: unitDefaults?.rent_fee_currency ?? 'GHS',
			...initialValues,
			move_in_date: initialValues?.move_in_date
				? new Date(initialValues.move_in_date)
				: undefined,
			billing_cycle_start_date: initialValues?.billing_cycle_start_date
				? new Date(initialValues.billing_cycle_start_date)
				: undefined,
		},
	})

	const [rentFee, stayDuration, currency, durationFreq, rentPaymentStatus] =
		form.watch([
			'rent_fee',
			'stay_duration',
			'rent_fee_currency',
			'stay_duration_frequency',
			'rent_payment_status',
		])

	useEffect(() => {
		if (rentPaymentStatus !== 'PARTIAL') {
			form.setValue('periods_paid', undefined)
			form.setValue('billing_cycle_start_date', undefined)
		}
	}, [rentPaymentStatus, form])

	const totalDue =
		rentFee > 0 && stayDuration > 0 ? rentFee * stayDuration : null

	const handleSubmit = form.handleSubmit((values) => {
		if (values.rent_payment_status === 'PARTIAL') {
			let hasError = false
			if (!values.periods_paid || values.periods_paid < 1) {
				form.setError('periods_paid', {
					message: 'Required when partially paid',
				})
				hasError = true
			} else if (values.periods_paid >= values.stay_duration) {
				form.setError('periods_paid', {
					message: 'Must be less than total stay duration',
				})
				hasError = true
			}
			if (!values.billing_cycle_start_date) {
				form.setError('billing_cycle_start_date', {
					message: 'Required when partially paid',
				})
				hasError = true
			}
			if (hasError) return
		}
		onNext(values)
	})

	return (
		<Form {...form}>
			<form
				onSubmit={handleSubmit}
				className="mx-auto mb-10 space-y-6 md:max-w-2xl"
			>
				<div className="mt-10 space-y-2 border-b pb-6">
					<TypographyH2 className="text-2xl font-bold">
						Lease Terms
					</TypographyH2>
					<TypographyMuted>Financial setup and lease duration.</TypographyMuted>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<FormField
						control={form.control}
						name="rent_fee"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Rent Fee *</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="rent_fee_currency"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Currency *</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={!!unitDefaults?.rent_fee_currency}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CURRENCIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Payment frequency is hidden when preset from the unit */}
					{!unitDefaults?.payment_frequency && (
						<FormField
							control={form.control}
							name="payment_frequency"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Payment Frequency</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select frequency" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{FREQUENCIES.map((f) => (
												<SelectItem key={f.value} value={f.value}>
													{f.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
					<div className="col-span-2">
						<FormField
							control={form.control}
							name="move_in_date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Move-In Date *</FormLabel>
									<DatePickerInput
										value={
											field.value
												? localizedDayjs(field.value).toDate()
												: undefined
										}
										onChange={(d) => field.onChange(d)}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="stay_duration"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Stay Duration *</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="stay_duration_frequency"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Duration Unit *</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={!!unitDefaults?.stay_duration_frequency}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{DURATION_FREQUENCIES.map((f) => (
											<SelectItem key={f.value} value={f.value}>
												{f.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					{totalDue !== null && (
						<div className="col-span-2 border-t pt-4">
							<div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
								<p className="text-muted-foreground mb-3 text-sm font-medium">
									Expected total
								</p>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										{currency} {rentFee.toLocaleString()} &times; {stayDuration}{' '}
										{durationFreq?.toLowerCase() ?? 'months'}
									</span>
									<span className="text-lg font-bold">
										{currency}{' '}
										{totalDue.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>
							</div>
						</div>
					)}
					<div className="col-span-2 space-y-2 border-t pt-4">
						<p className="text-base font-semibold">Rent Payments</p>
					</div>
					<div className="space-y-4 md:col-span-2">
						<FormField
							control={form.control}
							name="rent_payment_status"
							render={({ field }) => (
								<FormItem>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="NONE">No payments made</SelectItem>
											<SelectItem value="PARTIAL">Partially paid</SelectItem>
											<SelectItem value="FULL">Fully paid</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										How much rent has already been collected from this tenant.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{rentPaymentStatus === 'PARTIAL' && (
							<div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="periods_paid"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Periods already paid *</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													max={stayDuration - 1}
													{...field}
													value={field.value ?? ''}
													onChange={(e) =>
														field.onChange(
															e.target.value === ''
																? undefined
																: e.target.valueAsNumber,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												out of {stayDuration}{' '}
												{durationFreq?.toLowerCase() ?? 'periods'} total
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="billing_cycle_start_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Billing cycle start date *</FormLabel>
											<DatePickerInput
												value={
													field.value
														? localizedDayjs(field.value).toDate()
														: undefined
												}
												onChange={(d) => field.onChange(d)}
											/>
											<FormDescription>
												When the tenant&apos;s first billing period began.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
					</div>
				</div>

				<div className="space-y-2 border-t pt-4">
					<p className="text-base font-semibold">Security Deposit (Optional)</p>
					<p className="text-muted-foreground text-sm">
						Leave at 0 if no security deposit was collected.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="security_deposit_fee"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Security Deposit</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="security_deposit_fee_currency"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Currency</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={!!unitDefaults?.rent_fee_currency}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CURRENCIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex items-center justify-between border-t pt-6">
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onCancel}>
							Back to Overview
						</Button>
						<Button type="button" variant="ghost" onClick={onBack}>
							<ArrowLeft className="mr-1 h-4 w-4" /> Back
						</Button>
					</div>
					<Button
						type="submit"
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
