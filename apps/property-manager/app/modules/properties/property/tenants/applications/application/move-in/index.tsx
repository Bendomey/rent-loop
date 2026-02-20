import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
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
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

const FREQUENCY_LABELS: Record<string, string> = {
	HOURS: 'Hours',
	DAYS: 'Days',
	MONTHS: 'Months',
}

const ValidationSchema = z.object({
	desired_move_in_date: z.date({ error: 'Move-in date is required' }),
	stay_duration_frequency: z.enum(['HOURS', 'DAYS', 'MONTHS'], {
		error: 'Please select a frequency',
	}),
	stay_duration: z
		.number({ error: 'Stay duration is required' })
		.min(1, 'Must be at least 1'),
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
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.tenants.applications.$applicationId',
	)
	const revalidator = useRevalidator()
	const application = loaderData?.tenantApplication
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
					desired_move_in_date:
						data.desired_move_in_date.toISOString() as unknown as Date,
					stay_duration_frequency: data.stay_duration_frequency,
					stay_duration: data.stay_duration,
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
							value={
								application?.stay_duration_frequency
									? (FREQUENCY_LABELS[application.stay_duration_frequency] ??
										toFirstUpperCase(application.stay_duration_frequency))
									: undefined
							}
						/>
						<FieldDisplay
							label="Stay Duration"
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
											<FormLabel>
												Desired Move-In Date{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
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
											<FormLabel>
												Stay Duration Frequency{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
													disabled
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="HOURS">Hours</SelectItem>
														<SelectItem value="DAYS">Days</SelectItem>
														<SelectItem value="MONTHS">Months</SelectItem>
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
											<FormLabel>
												Stay Duration <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													{...field}
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
