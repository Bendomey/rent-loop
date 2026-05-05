import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateBooking } from '~/api/bookings'
import { useGetPropertyUnits } from '~/api/units'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
import { Textarea } from '~/components/ui/textarea'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { convertPesewasToCedis } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const schema = z
	.object({
		unit_id: z.string().min(1, 'Select a unit'),
		check_in_date: z.date({ error: 'Check-in date required' }),
		check_out_date: z.date({ error: 'Check-out date required' }),
		rate: z.number().min(1, 'Rate must be greater than 0'),
		currency: z.string().min(1),
		notes: z.string().optional(),
		guest_first_name: z.string().min(1, 'Required'),
		guest_last_name: z.string().min(1, 'Required'),
		guest_phone: z.string().min(1, 'Required'),
		guest_email: z.string().email('Invalid email'),
		guest_id_number: z.string().min(1, 'Required'),
	})
	.refine((d) => d.check_out_date > d.check_in_date, {
		message: 'Check-out must be after check-in',
		path: ['check_out_date'],
	})

type FormValues = z.infer<typeof schema>

export function NewBookingModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()

	const propertyId = clientUserProperty?.property_id ?? ''
	const clientId = safeString(clientUser?.client_id)

	const { data: unitsData } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		pagination: { per: 100 },
		filters: {},
	})

	const units = unitsData?.rows ?? []

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { currency: 'GHS' },
	})

	const { mutateAsync: createBooking, isPending } = useCreateBooking()

	const selectedUnitId = form.watch('unit_id')
	const selectedUnit = units.find((u) => u.id === selectedUnitId)

	const handleUnitChange = (unitId: string) => {
		form.setValue('unit_id', unitId)
		const unit = units.find((u) => u.id === unitId)
		if (unit) {
			form.setValue('rate', convertPesewasToCedis(unit.rent_fee))
			form.setValue('currency', unit.rent_fee_currency)
		}
	}

	const onSubmit = async (values: FormValues) => {
		try {
			const booking = await createBooking({
				clientId,
				propertyId,
				unit_id: values.unit_id,
				check_in_date: values.check_in_date.toISOString(),
				check_out_date: values.check_out_date.toISOString(),
				rate: Math.round(values.rate * 100),
				currency: values.currency,
				notes: values.notes,
				guest_first_name: values.guest_first_name,
				guest_last_name: values.guest_last_name,
				guest_phone: values.guest_phone,
				guest_email: values.guest_email,
				guest_id_number: values.guest_id_number,
			})
			toast.success('Booking created')
			void navigate(`/properties/${propertyId}/bookings/${booking?.id}`)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create booking',
			)
		}
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<div className="mb-6 flex items-center gap-3">
				<Link to={`/properties/${propertyId}/bookings`}>
					<Button size="sm" variant="ghost">
						<ArrowLeft className="size-4" />
					</Button>
				</Link>
				<div>
					<TypographyH4>New Booking</TypographyH4>
					<TypographyMuted>
						Create a booking on behalf of a guest.
					</TypographyMuted>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Unit + Dates */}
					<Card className="shadow-none">
						<CardHeader>
							<CardTitle className="text-base">Stay Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="unit_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Unit</FormLabel>
										<Select
											value={field.value}
											onValueChange={handleUnitChange}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a unit" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{units.map((u) => (
													<SelectItem key={u.id} value={u.id}>
														{u.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="check_in_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Check-in</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
													startMonth={new Date()}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="check_out_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Check-out</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
													startMonth={form.watch('check_in_date') ?? new Date()}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="rate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Rate ({selectedUnit?.rent_fee_currency ?? 'GHS'})
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													value={field.value ?? ''}
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

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes (optional)</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Internal notes about this booking"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Guest info */}
					<Card className="shadow-none">
						<CardHeader>
							<CardTitle className="text-base">Guest Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="guest_first_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="guest_last_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="guest_phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input {...field} placeholder="+233..." />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="guest_email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="guest_id_number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>ID Number</FormLabel>
										<FormControl>
											<Input {...field} placeholder="GHA-XXXXXXXX-X" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-3">
						<Link to={`/properties/${propertyId}/bookings`}>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</Link>
						<Button
							type="submit"
							disabled={isPending}
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							{isPending ? <Spinner /> : null}
							Create Booking
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
