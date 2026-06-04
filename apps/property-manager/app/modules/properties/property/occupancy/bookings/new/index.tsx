import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ArrowLeft, Info, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateBooking, useGetUnitAvailability } from '~/api/bookings'
import { useGetTenantByPhone } from '~/api/tenants'
import { useGetPropertyUnits } from '~/api/units'
import { InternationalPhoneInput } from '~/components/international-phone'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
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
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { getBookingDuration } from '~/lib/booking.utils'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const schema = z
	.object({
		unit_id: z.string({ error: 'Select a unit' }).min(1, 'Select a unit'),
		check_in_date: z.date({ error: 'Check-in date required' }),
		check_out_date: z.date({ error: 'Check-out date required' }),
		rate: z.number({ error: 'Required' }).min(1, 'Rate must be greater than 0'),
		currency: z.string({ error: 'Required' }).min(1),
		notes: z.string().optional(),
		guest_first_name: z.string({ error: 'Required' }).min(1, 'Required'),
		guest_last_name: z.string({ error: 'Required' }).min(1, 'Required'),
		guest_phone: z
			.string({ error: 'Required' })
			.refine(isValidPhoneNumber, { message: 'Enter a valid phone number' }),
		guest_email: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
		guest_id_number: z.string().optional(),
		guest_gender: z.enum(['MALE', 'FEMALE'], { error: 'Required' }),
	})
	.refine((d) => d.check_out_date > d.check_in_date, {
		message: 'Check-out must be after check-in',
		path: ['check_out_date'],
	})

type FormValues = z.infer<typeof schema>

function useIsDesktop() {
	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
	)
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1024px)')
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])
	return isDesktop
}

function blocksToDisabledDates(blocks: UnitDateBlock[]): Date[] {
	const dates: Date[] = []
	for (const block of blocks) {
		const cursor = new Date(block.start_date)
		const end = new Date(block.end_date)
		while (cursor <= end) {
			dates.push(new Date(cursor))
			cursor.setDate(cursor.getDate() + 1)
		}
	}
	return dates
}

function BookingRangeCalendar({
	clientId,
	propertyId,
	unitId,
	selectedRange,
	onRangeSelect,
}: {
	clientId: string
	propertyId: string
	unitId: string
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
}) {
	const isDesktop = useIsDesktop()
	const today = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d
	}, [])
	const ninetyDaysOut = useMemo(() => {
		const d = new Date(today)
		d.setDate(d.getDate() + 90)
		return d
	}, [today])

	const { data: blocks = [], isPending: loadingAvailability } =
		useGetUnitAvailability(clientId, propertyId, unitId, today, ninetyDaysOut)

	const disabledDates = useMemo(
		() => blocksToDisabledDates(blocks),
		[blocks],
	)

	const handleSelect = (
		range: { from?: Date; to?: Date } | undefined,
	) => {
		if (!range?.from || !range.to) {
			onRangeSelect(null)
			return
		}
		onRangeSelect({ from: range.from, to: range.to })
	}

	if (loadingAvailability) {
		return (
			<div className="bg-muted h-64 w-full animate-pulse rounded-xl" />
		)
	}

	const blockedCount = blocks.length

	return (
		<div className="space-y-2">
			{blockedCount > 0 ? (
				<p className="text-muted-foreground text-xs">
					{blockedCount} date block{blockedCount > 1 ? 's' : ''} — greyed out
					dates are unavailable
				</p>
			) : (
				<p className="text-muted-foreground text-xs">
					All dates available for the next 90 days
				</p>
			)}
			<Calendar
				mode="range"
				selected={selectedRange ?? undefined}
				onSelect={handleSelect}
				disabled={[{ before: today }, { after: ninetyDaysOut }, ...disabledDates]}
				startMonth={today}
				endMonth={ninetyDaysOut}
				numberOfMonths={isDesktop ? 2 : 1}
				className="w-full [--cell-size:--spacing(9)]"
			/>
		</div>
	)
}

function DateStatsStrip({
	checkIn,
	checkOut,
}: {
	checkIn: Date
	checkOut: Date
}) {
	const { count, label } = getBookingDuration(checkIn, checkOut, 'DAILY')
	return (
		<div className="bg-muted/40 border rounded-lg">
			<div className="grid grid-cols-3 divide-x">
				<div className="flex flex-col gap-0.5 px-4 py-3">
					<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
						Check-in
					</p>
					<p className="text-sm font-bold font-serif">
						{dayjs(checkIn).format('MMM D, YYYY')}
					</p>
					<p className="text-muted-foreground text-xs">
						{dayjs(checkIn).format('dddd')}
					</p>
				</div>
				<div className="flex flex-col gap-0.5 px-4 py-3">
					<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
						Check-out
					</p>
					<p className="text-sm font-bold font-serif">
						{dayjs(checkOut).format('MMM D, YYYY')}
					</p>
					<p className="text-muted-foreground text-xs">
						{dayjs(checkOut).format('dddd')}
					</p>
				</div>
				<div className="flex flex-col gap-0.5 px-4 py-3">
					<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
						Duration
					</p>
					<p className="text-sm font-bold font-serif">
						{count} {label}
					</p>
				</div>
			</div>
		</div>
	)
}

function GuestSearchModal({
	open,
	onOpenChange,
	onSelect,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (tenant: Tenant) => void
}) {
	const [phone, setPhone] = useState('')
	const {
		mutateAsync: searchByPhone,
		isPending,
		data: result,
		reset,
	} = useGetTenantByPhone()

	const handleSearch = async () => {
		if (!phone.trim()) return
		try {
			await searchByPhone(phone.trim())
		} catch {
			toast.error('No guest found with that phone number')
		}
	}

	const handleClose = (open: boolean) => {
		if (!open) {
			setPhone('')
			reset()
		}
		onOpenChange(open)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Find existing guest</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="flex gap-2">
						<InternationalPhoneInput
							value={phone}
							onChange={setPhone}
							className="flex-1"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => void handleSearch()}
							disabled={isPending || !isValidPhoneNumber(phone ?? '')}
						>
							{isPending ? <Spinner /> : <Search className="size-4" />}
						</Button>
					</div>

					{result ? (
						<div className="border rounded-lg p-4 space-y-3">
							<div className="space-y-1">
								<p className="font-medium">
									{result.first_name} {result.last_name}
								</p>
								<p className="text-muted-foreground text-sm">{result.email}</p>
								<p className="text-muted-foreground text-sm">{result.phone}</p>
							</div>
							<Button
								type="button"
								size="sm"
								className="w-full"
								onClick={() => {
									onSelect(result)
									handleClose(false)
								}}
							>
								Use this guest
							</Button>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	)
}

function LiveSummary({
	unit,
	propertyName,
	checkIn,
	checkOut,
	rate,
	currency,
	guestName,
}: {
	unit?: PropertyUnit
	propertyName?: string
	checkIn?: Date
	checkOut?: Date
	rate?: number
	currency: string
	guestName?: string
}) {
	const nights =
		checkIn && checkOut
			? getBookingDuration(checkIn, checkOut, 'DAILY').count
			: 0
	const total = rate && nights > 0 ? rate * nights : 0

	return (
		<div className="sticky top-6 space-y-4">
			<Card className="shadow-none">
				<CardHeader className="pb-3">
					<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
						Live Summary
					</p>
					<CardTitle className="text-xl font-serif font-bold">
						{unit?.name ?? (
							<span className="text-muted-foreground font-sans text-base font-normal">
								No unit selected
							</span>
						)}
					</CardTitle>
					{propertyName ? (
						<p className="text-muted-foreground flex items-center gap-1 text-xs">
							<MapPin className="size-3" />
							{propertyName}
						</p>
					) : null}
				</CardHeader>

				<CardContent className="space-y-4">
					{checkIn && checkOut ? (
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<p className="text-muted-foreground text-[10px] tracking-widest uppercase">
									Check-in
								</p>
								<p className="font-medium">
									{dayjs(checkIn).format('MMM D, YYYY')}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-[10px] tracking-widest uppercase">
									Check-out
								</p>
								<p className="font-medium">
									{dayjs(checkOut).format('MMM D, YYYY')}
								</p>
							</div>
						</div>
					) : null}

					<Separator />

					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								{currency} {rate ?? 0} × {nights} nights
							</span>
							<span>{formatAmount(total, currency)}</span>
						</div>
						<Separator />
						<div className="flex justify-between font-semibold">
							<span>Total</span>
							<span className="text-base">{formatAmount(total, currency)}</span>
						</div>
					</div>

					<Separator />

					<div>
						<p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">
							Guest
						</p>
						<p
							className={
								guestName
									? 'text-sm font-medium'
									: 'text-muted-foreground text-sm'
							}
						>
							{guestName ?? 'Not added yet'}
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
				<Info className="mt-0.5 size-4 shrink-0 text-yellow-600" />
				<p className="text-xs text-yellow-700 dark:text-yellow-400">
					The guest will receive a confirmation email with check-in instructions.
				</p>
			</div>
		</div>
	)
}

export function NewBookingModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()
	const [guestModalOpen, setGuestModalOpen] = useState(false)

	const propertyId = clientUserProperty?.property_id ?? ''
	const propertyName = clientUserProperty?.property?.name
	const clientId = safeString(clientUser?.client_id)

	const { data: unitsData } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		pagination: { per: 100 },
		filters: {},
	})

	const units = (unitsData?.rows ?? []).filter(
		(u) =>
			u.status === 'Unit.Status.Available' ||
			u.status === 'Unit.Status.PartiallyOccupied',
	)

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { currency: 'GHS' },
	})

	const { mutateAsync: createBooking, isPending } = useCreateBooking()

	const selectedUnitId = form.watch('unit_id')
	const checkIn = form.watch('check_in_date')
	const checkOut = form.watch('check_out_date')
	const rate = form.watch('rate')
	const currency = form.watch('currency') ?? 'GHS'
	const guestFirst = form.watch('guest_first_name')
	const guestLast = form.watch('guest_last_name')

	const selectedUnit = units.find((u) => u.id === selectedUnitId)
	const guestName =
		guestFirst || guestLast
			? `${guestFirst ?? ''} ${guestLast ?? ''}`.trim()
			: undefined

	const selectedRange = checkIn && checkOut ? { from: checkIn, to: checkOut } : null

	const handleUnitChange = (unitId: string) => {
		form.setValue('unit_id', unitId)
		form.setValue('check_in_date', undefined as unknown as Date)
		form.setValue('check_out_date', undefined as unknown as Date)
		const unit = units.find((u) => u.id === unitId)
		if (unit) {
			form.setValue('rate', convertPesewasToCedis(unit.rent_fee))
			form.setValue('currency', unit.rent_fee_currency)
		}
	}

	const handleRangeSelect = (
		range: { from: Date; to: Date } | null,
	) => {
		if (range) {
			form.setValue('check_in_date', range.from)
			form.setValue('check_out_date', range.to)
		} else {
			form.setValue('check_in_date', undefined as unknown as Date)
			form.setValue('check_out_date', undefined as unknown as Date)
		}
	}

	const handleGuestSelect = (tenant: Tenant) => {
		form.setValue('guest_first_name', tenant.first_name)
		form.setValue('guest_last_name', tenant.last_name)
		form.setValue('guest_phone', tenant.phone)
		form.setValue('guest_email', tenant.email)
		if (tenant.id_number) form.setValue('guest_id_number', tenant.id_number)
		if (tenant.gender) form.setValue('guest_gender', tenant.gender)
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
				guest_gender: values.guest_gender,
			})
			toast.success('Booking created')
			void navigate(`/properties/${propertyId}/occupancy/bookings/${booking?.id}`)
		} catch {
			toast.error(
				'Failed to create booking',
			)
		}
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			<div className="mb-6 flex items-center gap-3">
				<Link to={`/properties/${propertyId}/occupancy/bookings`}>
					<Button size="sm" variant="ghost">
						<ArrowLeft className="size-4" />
					</Button>
				</Link>
				<div>
					<TypographyH4>New Booking</TypographyH4>
					<TypographyMuted>
						Create a booking on behalf of a guest. They'll receive a confirmation
						email.
					</TypographyMuted>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
						{/* Left: form cards */}
						<div className="order-1 space-y-6 lg:col-span-3">
							{/* Stay Details */}
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
														<SelectTrigger className="w-full">
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

									{
										!form.watch('unit_id') ? (
											<div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
												<Info className="mt-0.5 size-4 shrink-0 text-yellow-600" />
												<p className="text-xs text-yellow-700 dark:text-yellow-400">
													Only available units are listed. If a unit is missing, make sure
													it's not in draft or occupied state.{' '}
													<a
														href={`/properties/${propertyId}/assets/units`}
														className="underline underline-offset-2"
													>
														Manage units
													</a>
												</p>
											</div>
										) : null
									}

									{selectedUnitId ? (
										<div className="space-y-3">
											<BookingRangeCalendar
												clientId={clientId}
												propertyId={propertyId}
												unitId={selectedUnitId}
												selectedRange={selectedRange}
												onRangeSelect={handleRangeSelect}
											/>
											{/* Show date errors */}
											<FormField
												control={form.control}
												name="check_in_date"
												render={() => <FormMessage />}
											/>
											<FormField
												control={form.control}
												name="check_out_date"
												render={() => <FormMessage />}
											/>
										</div>
									) : (
										<div className="bg-muted/40 flex h-32 items-center justify-center rounded-xl border border-dashed">
											<p className="text-muted-foreground text-sm">
												Select a unit to see availability
											</p>
										</div>
									)}

									{checkIn && checkOut && checkOut > checkIn ? (
										<DateStatsStrip checkIn={checkIn} checkOut={checkOut} />
									) : null}

									<FormField
										control={form.control}
										name="rate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Nightly rate (
													{selectedUnit?.rent_fee_currency ?? 'GHS'})
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

									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Internal notes{' '}
													<span className="text-muted-foreground font-normal">
														optional
													</span>
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														placeholder="e.g. Guest arrives late — share gate code by SMS."
														rows={3}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Guest Information */}
							<Card className="shadow-none">
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-base">
											Guest Information
										</CardTitle>
										<button
											type="button"
											onClick={() => setGuestModalOpen(true)}
											className="text-rose-600 hover:text-rose-700 text-sm flex items-center gap-1"
										>
											<Search className="size-3.5" />
											Find existing guest
										</button>
									</div>
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
											render={({ field, fieldState }) => (
												<FormItem>
													<FormLabel>Phone</FormLabel>
													<FormControl>
														<InternationalPhoneInput
															value={field.value}
															onChange={field.onChange}
															error={!!fieldState.error}
														/>
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
													<FormLabel>
														Email{' '}
														<span className="text-muted-foreground font-normal text-xs">
															optional
														</span>
													</FormLabel>
													<FormControl>
														<Input type="email" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="guest_gender"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Gender</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl className="w-full">
															<SelectTrigger>
																<SelectValue placeholder="Select gender" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="MALE">Male</SelectItem>
															<SelectItem value="FEMALE">Female</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="guest_id_number"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														ID number{' '}
														<span className="text-muted-foreground font-normal text-xs">
															optional
														</span>
													</FormLabel>
													<FormControl>
														<Input {...field} placeholder="GHA-XXXXXXXX-X" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

									</div>
								</CardContent>
							</Card>
						</div>

						{/* Right: live summary — order-2 on mobile so it appears before buttons */}
						<div className="order-2 lg:col-span-2 lg:row-span-2">
							<LiveSummary
								unit={selectedUnit}
								propertyName={propertyName}
								checkIn={checkIn}
								checkOut={checkOut}
								rate={rate}
								currency={currency}
								guestName={guestName}
							/>
						</div>

						{/* Actions — order-3 on mobile so they appear after summary */}
						<div className="order-3 flex justify-end gap-3 lg:col-span-3">
							<Link to={`/properties/${propertyId}/occupancy/bookings`}>
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
								Create booking
							</Button>
						</div>
					</div>
				</form>
			</Form>

			<GuestSearchModal
				open={guestModalOpen}
				onOpenChange={setGuestModalOpen}
				onSelect={handleGuestSelect}
			/>
		</div>
	)
}
