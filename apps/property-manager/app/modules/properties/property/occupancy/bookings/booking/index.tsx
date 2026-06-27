import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLoaderData, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { ActivityCard } from './components/activity-card'
import { BookingHeader } from './components/booking-header'
import { BookingStatsStrip } from './components/booking-stats-strip'
import { EditDatesModal } from './components/edit-dates-modal'
import { GuestCard } from './components/guest-card'
import { NotesCard } from './components/notes-card'
import { PaymentCard } from './components/payment-card'
import { PropertyCard } from './components/property-card'
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.bookings.$bookingId'

const cancelSchema = z.object({
	reason: z.string().min(1, 'Please provide a reason'),
})
type CancelForm = z.infer<typeof cancelSchema>

function ActionDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	confirmClassName,
	isPending,
	onConfirm,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	confirmLabel: string
	confirmClassName?: string
	isPending: boolean
	onConfirm: () => void
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className={confirmClassName}
						disabled={isPending}
						onClick={onConfirm}
					>
						{isPending ? <Spinner /> : null}
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function CancelDialog({
	open,
	isPending,
	onOpenChange,
	onConfirm,
}: {
	open: boolean
	isPending: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: (reason: string) => void
}) {
	const form = useForm<CancelForm>({
		resolver: zodResolver(cancelSchema),
		defaultValues: { reason: '' },
	})
	const handleConfirm = form.handleSubmit((values) => onConfirm(values.reason))

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
										<Textarea
											{...field}
											placeholder="e.g. Guest requested cancellation"
										/>
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

function CheckInDialog({
	open,
	onOpenChange,
	checkInCode,
	isPending,
	onConfirm,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	checkInCode: Nullable<string>
	isPending: boolean
	onConfirm: () => void
}) {
	const [enteredCode, setEnteredCode] = useState('')

	const handleOpenChange = (v: boolean) => {
		if (!v) setEnteredCode('')
		onOpenChange(v)
	}

	const handleConfirm = (e: React.MouseEvent) => {
		if (enteredCode !== checkInCode) {
			e.preventDefault()
			toast.error('Incorrect check-in code. Please try again.')
			return
		}
		onConfirm()
	}

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Check In Guest</AlertDialogTitle>
					<AlertDialogDescription>
						Enter the 5-digit check-in code sent to the guest to verify their
						identity.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div>
					<InputOTP maxLength={5} value={enteredCode} onChange={setEnteredCode}>
						<InputOTPGroup>
							<InputOTPSlot index={0} className="size-12 text-lg" />
							<InputOTPSlot index={1} className="size-12 text-lg" />
							<InputOTPSlot index={2} className="size-12 text-lg" />
							<InputOTPSlot index={3} className="size-12 text-lg" />
							<InputOTPSlot index={4} className="size-12 text-lg" />
						</InputOTPGroup>
					</InputOTP>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-blue-600 text-white hover:bg-blue-700"
						disabled={isPending || enteredCode.length < 5}
						onClick={(e) => handleConfirm(e)}
					>
						{isPending ? <Spinner /> : null}
						Check In
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

	const propertyId = safeString(clientUserProperty?.property_id)
	const clientId = safeString(clientUser?.client_id)
	const bookingId = safeString(params.bookingId)

	const { data: booking, isPending: isLoading } = useGetBooking(
		clientId,
		propertyId,
		bookingId,
		loaderData.booking ?? undefined,
	)

	const [confirmOpen, setConfirmOpen] = useState(false)
	const [checkInOpen, setCheckInOpen] = useState(false)
	const [completeOpen, setCompleteOpen] = useState(false)
	const [cancelOpen, setCancelOpen] = useState(false)
	const [editDatesOpen, setEditDatesOpen] = useState(false)

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.BOOKINGS, clientId, propertyId, bookingId],
		})

	const { mutateAsync: confirm, isPending: isConfirming } = useConfirmBooking()
	const { mutateAsync: checkIn, isPending: isCheckingIn } = useCheckInBooking()
	const { mutateAsync: complete, isPending: isCompleting } =
		useCompleteBooking()
	const { mutateAsync: cancel, isPending: isCancelling } = useCancelBooking()

	const handleConfirm = async () => {
		try {
			await confirm({ clientId, propertyId, bookingId })
			toast.success('Booking confirmed')
			setConfirmOpen(false)
			void invalidate()
		} catch {
			toast.error('Failed to confirm booking')
		}
	}

	const handleCheckIn = async () => {
		try {
			await checkIn({ clientId, propertyId, bookingId })
			toast.success('Guest checked in')
			setCheckInOpen(false)
			void invalidate()
		} catch {
			toast.error('Failed to check in')
		}
	}

	const handleComplete = async () => {
		try {
			await complete({ clientId, propertyId, bookingId })
			toast.success('Booking completed')
			setCompleteOpen(false)
			void invalidate()
		} catch {
			toast.error('Failed to complete booking')
		}
	}

	const handleCancel = async (reason: string) => {
		try {
			await cancel({ clientId, propertyId, bookingId, reason })
			toast.success('Booking cancelled')
			setCancelOpen(false)
			void invalidate()
		} catch {
			toast.error('Failed to cancel booking')
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

	return (
		<div className="mx-auto max-w-4xl space-y-4 p-5">
			<PropertyPermissionGuard roles={['MANAGER']}>
				<BookingHeader
					booking={booking}
					propertyId={propertyId}
					onConfirm={() => setConfirmOpen(true)}
					onCheckIn={() => setCheckInOpen(true)}
					onComplete={() => setCompleteOpen(true)}
					onCancel={() => setCancelOpen(true)}
				/>
			</PropertyPermissionGuard>

			<BookingStatsStrip
				booking={booking}
				onEditDates={
					booking.status === 'PENDING'
						? () => setEditDatesOpen(true)
						: undefined
				}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Left column */}
				<div className="space-y-4">
					<GuestCard guest={booking.tenant} propertyId={propertyId} />
					<PropertyCard unit={booking.unit} propertyId={propertyId} />
				</div>

				{/* Right column */}
				<div className="space-y-4">
					<PaymentCard
						booking={booking}
						clientId={clientId}
						propertyId={propertyId}
					/>
					<ActivityCard booking={booking} />
					<NotesCard
						booking={booking}
						clientId={clientId}
						propertyId={propertyId}
					/>
				</div>
			</div>

			<ActionDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Confirm Booking"
				description="Are you sure you want to confirm this booking? The guest will be notified."
				confirmLabel="Confirm Booking"
				confirmClassName="bg-foreground text-background hover:bg-foreground/90"
				isPending={isConfirming}
				onConfirm={handleConfirm}
			/>
			<CheckInDialog
				open={checkInOpen}
				onOpenChange={setCheckInOpen}
				checkInCode={booking.check_in_code}
				isPending={isCheckingIn}
				onConfirm={handleCheckIn}
			/>
			<ActionDialog
				open={completeOpen}
				onOpenChange={setCompleteOpen}
				title="Mark as Completed"
				description="Are you sure you want to mark this booking as completed?"
				confirmLabel="Mark as Completed"
				isPending={isCompleting}
				onConfirm={handleComplete}
			/>
			<CancelDialog
				open={cancelOpen}
				isPending={isCancelling}
				onOpenChange={setCancelOpen}
				onConfirm={handleCancel}
			/>
			<EditDatesModal
				open={editDatesOpen}
				onOpenChange={setEditDatesOpen}
				booking={booking}
				clientId={clientId}
				propertyId={propertyId}
			/>
		</div>
	)
}
