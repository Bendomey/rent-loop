import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import type { loader } from '~/routes/_auth.properties.$propertyId.bookings.$bookingId'
import {
	useCancelBooking,
	useCheckInBooking,
	useCompleteBooking,
	useConfirmBooking,
	useGetBooking,
} from '~/api/bookings'
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

type BookingStatusConfig = {
	label: string
	className: string
}

const STATUS_CONFIG: Record<BookingStatus, BookingStatusConfig> = {
	PENDING: { label: 'Pending', className: 'bg-yellow-500 text-white' },
	CONFIRMED: { label: 'Confirmed', className: 'bg-teal-500 text-white' },
	CHECKED_IN: { label: 'Checked In', className: 'bg-blue-500 text-white' },
	COMPLETED: { label: 'Completed', className: 'bg-zinc-400 text-white' },
	CANCELLED: { label: 'Cancelled', className: 'bg-rose-500 text-white' },
}

const cancelSchema = z.object({
	reason: z.string().min(1, 'Please provide a reason'),
})
type CancelForm = z.infer<typeof cancelSchema>

interface CancelDialogProps {
	open: boolean
	isPending: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: (reason: string) => void
}

function CancelDialog({ open, isPending, onOpenChange, onConfirm }: CancelDialogProps) {
	const form = useForm<CancelForm>({
		resolver: zodResolver(cancelSchema),
		defaultValues: { reason: '' },
	})

	const handleConfirm = form.handleSubmit((values) => {
		onConfirm(values.reason)
	})

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Booking</AlertDialogTitle>
					<AlertDialogDescription>
						This will cancel the booking. Please provide a reason.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Form {...form}>
					<form onSubmit={handleConfirm} id="cancel-form" className="space-y-4">
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reason</FormLabel>
									<FormControl>
										<Textarea {...field} placeholder="e.g. Guest requested cancellation" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<AlertDialogFooter>
					<AlertDialogCancel>Keep Booking</AlertDialogCancel>
					<AlertDialogAction
						form="cancel-form"
						type="submit"
						onClick={handleConfirm}
						className="bg-rose-600 text-white hover:bg-rose-700"
						disabled={isPending}
					>
						{isPending ? <Spinner /> : null}
						Cancel Booking
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function BookingDetailModule() {
	const params = useParams()
	const loaderData = useLoaderData<typeof loader>()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const queryClient = useQueryClient()

	const propertyId = clientUserProperty?.property_id ?? ''
	const clientId = safeString(clientUser?.client_id)
	const bookingId = safeString(params.bookingId)

	const { data: booking, isPending: isLoading } = useGetBooking(
		clientId,
		bookingId,
		loaderData.booking ?? undefined,
	)

	const [cancelOpen, setCancelOpen] = useState(false)

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS, clientId, bookingId] })

	const { mutateAsync: confirm, isPending: isConfirming } = useConfirmBooking()
	const { mutateAsync: checkIn, isPending: isCheckingIn } = useCheckInBooking()
	const { mutateAsync: complete, isPending: isCompleting } = useCompleteBooking()
	const { mutateAsync: cancel, isPending: isCancelling } = useCancelBooking()

	const handleConfirm = async () => {
		try {
			await confirm({ clientId, bookingId })
			toast.success('Booking confirmed')
			void invalidate()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to confirm booking')
		}
	}

	const handleCheckIn = async () => {
		try {
			await checkIn({ clientId, bookingId })
			toast.success('Guest checked in')
			void invalidate()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to check in')
		}
	}

	const handleComplete = async () => {
		try {
			await complete({ clientId, bookingId })
			toast.success('Booking completed')
			void invalidate()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to complete booking')
		}
	}

	const handleCancel = async (reason: string) => {
		try {
			await cancel({ clientId, bookingId, reason })
			toast.success('Booking cancelled')
			setCancelOpen(false)
			void invalidate()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to cancel booking')
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spinner />
			</div>
		)
	}

	if (!booking) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<TypographyMuted>Booking not found.</TypographyMuted>
			</div>
		)
	}

	const status = booking.status
	const cfg = STATUS_CONFIG[status]
	const guest = booking.tenant

	return (
		<div className="mx-auto flex max-w-6xl flex-col">
			<div className="m-5 grid grid-cols-12 gap-6">
				{/* Sidebar */}
				<div className="col-span-12 lg:col-span-4">
					<Card className="shadow-none">
						<CardHeader className="pb-3">
							<div className="mb-1 flex items-center gap-3">
								<Link to={`/properties/${propertyId}/bookings`}>
									<Button size="sm" variant="ghost" className="-ml-2">
										<ArrowLeft className="size-4" />
									</Button>
								</Link>
								<TypographyH4 className="text-sm">{booking.code}</TypographyH4>
							</div>
							<Badge variant="outline" className={`w-fit px-2 ${cfg.className}`}>
								{cfg.label}
							</Badge>
						</CardHeader>
						<CardContent className="space-y-4">
							{booking.check_in_code ? (
								<div>
									<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
										Check-in Code
									</p>
									<p className="font-mono text-2xl font-bold tracking-widest">
										{booking.check_in_code}
									</p>
								</div>
							) : null}

							<Separator />

							<div className="space-y-2">
								<Row label="Unit" value={booking.unit?.name ?? '—'} />
								<Row
									label="Check-in"
									value={localizedDayjs(booking.check_in_date).format('MMM D, YYYY')}
								/>
								<Row
									label="Check-out"
									value={localizedDayjs(booking.check_out_date).format('MMM D, YYYY')}
								/>
								<Row
									label="Rate"
									value={formatAmount(convertPesewasToCedis(booking.rate))}
								/>
							</div>

							<Separator />

							<PropertyPermissionGuard roles={['MANAGER']}>
								<div className="space-y-2">
									{status === 'PENDING' ? (
										<Button
											className="w-full bg-teal-600 text-white hover:bg-teal-700"
											disabled={isConfirming}
											onClick={handleConfirm}
										>
											{isConfirming ? <Spinner /> : null}
											Confirm Booking
										</Button>
									) : null}

									{status === 'CONFIRMED' ? (
										<Button
											className="w-full bg-blue-600 text-white hover:bg-blue-700"
											disabled={isCheckingIn}
											onClick={handleCheckIn}
										>
											{isCheckingIn ? <Spinner /> : null}
											Check In Guest
										</Button>
									) : null}

									{status === 'CHECKED_IN' ? (
										<Button
											className="w-full"
											disabled={isCompleting}
											onClick={handleComplete}
										>
											{isCompleting ? <Spinner /> : null}
											Mark as Completed
										</Button>
									) : null}

									{status === 'PENDING' || status === 'CONFIRMED' ? (
										<Button
											variant="outline"
											className="w-full border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
											onClick={() => setCancelOpen(true)}
										>
											Cancel Booking
										</Button>
									) : null}
								</div>
							</PropertyPermissionGuard>
						</CardContent>
					</Card>
				</div>

				{/* Main content */}
				<div className="col-span-12 space-y-4 lg:col-span-8">
					<Card className="shadow-none">
						<CardHeader>
							<CardTitle className="text-base">Guest Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Row
								label="Name"
								value={guest ? `${guest.first_name} ${guest.last_name}` : '—'}
							/>
							<Row label="Phone" value={guest?.phone ?? '—'} />
							<Row label="Email" value={guest?.email ?? '—'} />
							<Row label="ID Number" value={guest?.id_number ?? '—'} />
						</CardContent>
					</Card>

					<Card className="shadow-none">
						<CardHeader>
							<CardTitle className="text-base">Stay Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Row label="Property" value={booking.unit?.name ?? '—'} />
							<Row
								label="Check-in"
								value={localizedDayjs(booking.check_in_date).format('MMM D, YYYY')}
							/>
							<Row
								label="Check-out"
								value={localizedDayjs(booking.check_out_date).format('MMM D, YYYY')}
							/>
							<Row
								label="Nights"
								value={String(
									localizedDayjs(booking.check_out_date).diff(
										localizedDayjs(booking.check_in_date),
										'day',
									),
								)}
							/>
							<Row
								label="Rate"
								value={`${booking.currency} ${formatAmount(convertPesewasToCedis(booking.rate))}`}
							/>
							<Row label="Source" value={booking.booking_source === 'GUEST_LINK' ? 'Guest Link' : 'Manager'} />
							{booking.notes ? (
								<div>
									<p className="text-muted-foreground text-xs font-medium">Notes</p>
									<p className="text-sm">{booking.notes}</p>
								</div>
							) : null}
						</CardContent>
					</Card>

					{booking.cancellation_reason ? (
						<Card className="shadow-none border-rose-200 dark:border-rose-900">
							<CardHeader>
								<CardTitle className="text-base text-rose-600">Cancellation</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm">{booking.cancellation_reason}</p>
							</CardContent>
						</Card>
					) : null}
				</div>
			</div>

			<CancelDialog
				open={cancelOpen}
				isPending={isCancelling}
				onOpenChange={setCancelOpen}
				onConfirm={handleCancel}
			/>
		</div>
	)
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-xs font-medium">{value}</span>
		</div>
	)
}
