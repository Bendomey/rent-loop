import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
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
import { Spinner } from '~/components/ui/spinner'
import { toFirstUpperCase } from '~/lib/strings'

const FREQUENCY_LABELS: Record<string, string> = {
	HOURLY: 'Hourly',
	DAILY: 'Daily',
	WEEKLY: 'Weekly',
	MONTHLY: 'Monthly',
}

const ValidationSchema = z.object({
	desired_move_in_date: z.date().optional().nullable(),
	stay_duration_frequency: z
		.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'])
		.optional()
		.nullable(),
	stay_duration: z.number().min(1, 'Must be at least 1').optional().nullable(),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface FieldDisplayProps {
	label: string
	value: string | undefined | null
}

function FieldDisplay({ label, value }: FieldDisplayProps) {
	return (
		<div>
			<p className="text-muted-foreground text-sm">{label}</p>
			<p className="text-sm font-medium">{value || '-'}</p>
		</div>
	)
}

export function PropertyTenantApplicationMoveIn() {
	const { tenantApplication: application } = useTenantApplicationContext()
	const revalidator = useRevalidator()

	const [isEditing, setIsEditing] = useState(false)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			desired_move_in_date: application?.desired_move_in_date
				? new Date(application.desired_move_in_date)
				: undefined,
			stay_duration_frequency:
				(application?.stay_duration_frequency as FormSchema['stay_duration_frequency']) ||
				undefined,
			stay_duration: application?.stay_duration ?? undefined,
		},
	})

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenantApplication()

	const onSubmit = (data: FormSchema) => {
		if (!application?.id) return

		mutate(
			{
				id: application.id,
				data: {
					desired_move_in_date: data.desired_move_in_date
						? (data.desired_move_in_date.toISOString() as unknown as Date)
						: undefined,
					stay_duration_frequency: data.stay_duration_frequency ?? undefined,
					stay_duration: data.stay_duration ?? undefined,
				},
			},
			{
				onError: () => {
					toast.error('Failed to update move-in details. Try again later.')
				},
				onSuccess: () => {
					toast.success('Move-in details updated successfully.')
					void revalidator.revalidate()
					setIsEditing(false)
				},
			},
		)
	}

	const handleCancel = () => {
		reset()
		setIsEditing(false)
	}

	if (!isEditing) {
		const frequencyLabel = application?.stay_duration_frequency
			? (FREQUENCY_LABELS[application.stay_duration_frequency] ??
				toFirstUpperCase(application.stay_duration_frequency))
			: undefined
		return (
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						Move In Setup
						{application?.status !== 'TenantApplication.Status.Cancelled' && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(true)}
							>
								<Pencil className="mr-1 h-4 w-4" />
								Edit
							</Button>
						)}
					</CardTitle>
					<CardDescription>Move-in details for the tenant.</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FieldDisplay
							label="Desired Move-In Date"
							value={
								application?.desired_move_in_date
									? dayjs(application.desired_move_in_date).format(
											'MMM D, YYYY',
										)
									: undefined
							}
						/>
						<FieldDisplay
							label="Stay Duration Frequency"
							value={frequencyLabel}
						/>
						<FieldDisplay
							label={`Stay Duration${frequencyLabel ? ` (${frequencyLabel})` : ''}`}
							value={
								application?.stay_duration != null
									? String(application.stay_duration)
									: undefined
							}
						/>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					Move In Setup
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<X className="mr-1 h-4 w-4" />
						Cancel
					</Button>
				</CardTitle>
				<CardDescription>Setup move-in details for the tenant.</CardDescription>
			</CardHeader>

			{/* default frequency comes from the unit's setting */}
			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form id="move-in-form" onSubmit={handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div className="col-span-2">
								<FormField
									name="desired_move_in_date"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desired Move-In Date</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value ?? undefined}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="stay_duration_frequency"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Stay Duration Frequency</FormLabel>
											<FormControl>
												<Select
													value={field.value ?? undefined}
													onValueChange={field.onChange}
													disabled
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="HOURLY">Hourly</SelectItem>
														<SelectItem value="DAILY">Daily</SelectItem>
														<SelectItem value="WEEKLY">Weekly</SelectItem>
														<SelectItem value="MONTHLY">Monthly</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="stay_duration"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Stay Duration</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													{...field}
													value={field.value ?? undefined}
													onChange={(e) =>
														field.onChange(e.target.valueAsNumber)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</form>
				</Form>
			</CardContent>

			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					<Button variant="outline" onClick={handleCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="move-in-form"
						disabled={isPending || !rhfMethods.formState.isDirty}
					>
						{isPending ? <Spinner /> : null} Save
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
