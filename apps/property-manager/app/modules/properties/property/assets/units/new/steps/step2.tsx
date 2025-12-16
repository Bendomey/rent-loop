import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyUnitContext } from '../context'
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
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { cn } from '~/lib/utils'

const ValidationSchema = z.object({
	area: z.number().positive('Area must be a positive number').optional(),

	rent_fee: z.number().positive('Rent fee must be a positive number'),

	rent_fee_currency: z.string().min(1, 'Currency is required'),

	payment_frequency: z.enum(
		['WEEKLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY'],
		{
			error: 'Please select a payment frequency',
		},
	),
})

type FormSchema = z.infer<typeof ValidationSchema>

const paymentFrequencies: Array<{
	label: string
	value: FormSchema['payment_frequency']
}> = [
	{ label: 'Weekly', value: 'WEEKLY' },
	{ label: 'Daily', value: 'DAILY' },
	{ label: 'Monthly', value: 'MONTHLY' },
	{ label: 'Quarterly', value: 'QUARTERLY' },
	{ label: 'Biannually', value: 'BIANNUALLY' },
	{ label: 'Annually', value: 'ANNUALLY' },
]

export function Step2() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyUnitContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			rent_fee_currency: formData?.rent_fee_currency ?? 'GHS',
			payment_frequency: formData?.payment_frequency ?? 'MONTHLY',
		},
	})

	const { control, handleSubmit, watch, formState, setValue } = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			area: data.area,
			rent_fee: data.rent_fee,
			rent_fee_currency: data.rent_fee_currency,
			payment_frequency: data.payment_frequency,
		})
		goNext()
	}

	useEffect(() => {
		if (formData.area) {
			setValue('area', formData.area, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.rent_fee) {
			setValue('rent_fee', formData.rent_fee, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.rent_fee_currency) {
			setValue('rent_fee_currency', formData.rent_fee_currency, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.payment_frequency) {
			setValue('payment_frequency', formData.payment_frequency, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
				{/* Header */}
				<div className="space-y-2">
					<TypographyH2>Rental Information</TypographyH2>
					<TypographyMuted>Set the rent details for this unit</TypographyMuted>
				</div>

				{/* Area */}
				<FormField
					name="area"
					control={control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Area (sq m)</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									placeholder="e.g., 250.50"
									{...field}
									onChange={(e) => field.onChange(e.target.valueAsNumber)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Currency + Rent Fee */}
				<div className="grid grid-cols-5 gap-4">
					<FormField
						name="rent_fee_currency"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Currency</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl className="w-full">
										<SelectTrigger>
											<SelectValue placeholder="Select" />
										</SelectTrigger>
									</FormControl>

									<SelectContent>
										<SelectItem value="GHS">GHS</SelectItem>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						name="rent_fee"
						control={control}
						render={({ field }) => (
							<FormItem className="col-span-4">
								<FormLabel>Rent Fee</FormLabel>
								<FormControl>
									<Input
										type="number"
										step="0.01"
										placeholder="e.g., 5000.00"
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Payment Frequency */}
				<div>
					<Label>Payment Frequency</Label>

					<div className="mt-3 flex flex-wrap gap-3">
						{paymentFrequencies.map((item) => {
							const isSelected = watch('payment_frequency') === item.value

							return (
								<Button
									key={item.value}
									type="button"
									variant={isSelected ? 'default' : 'outline'}
									className={cn({
										'bg-rose-600 text-white': isSelected,
									})}
									onClick={() =>
										setValue('payment_frequency', item.value, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
								>
									{item.label}
								</Button>
							)
						})}
					</div>

					<FormDescription className="mt-2">
						How often rent is paid
					</FormDescription>

					{formState.errors.payment_frequency && (
						<TypographySmall className="text-destructive mt-2">
							{formState.errors.payment_frequency.message}
						</TypographySmall>
					)}
				</div>

				{/* Actions */}
				<div className="mt-10 flex items-center justify-end space-x-5">
					<Button type="button" size="sm" variant="ghost" onClick={goBack}>
						<ArrowLeft />
						Go Back
					</Button>

					<Button
						type="submit"
						size="lg"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next
					</Button>
				</div>
			</form>
		</Form>
	)
}
