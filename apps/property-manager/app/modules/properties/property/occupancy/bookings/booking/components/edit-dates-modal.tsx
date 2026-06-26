import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import { toast } from 'sonner'
import { BookingRangeCalendar } from '../../new/components/booking-range-calendar'
import { useUpdateBooking } from '~/api/bookings'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'
import { getBookingDuration } from '~/lib/booking.utils'
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	booking: Booking
	clientId: string
	propertyId: string
}

export function EditDatesModal({
	open,
	onOpenChange,
	booking,
	clientId,
	propertyId,
}: Props) {
	const queryClient = useQueryClient()
	const { mutateAsync: updateBooking, isPending } = useUpdateBooking()

	const [selectedRange, setSelectedRange] = useState<{
		from: Date
		to: Date
	} | null>(() => ({
		from: new Date(booking.check_in_date),
		to: new Date(booking.check_out_date),
	}))

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setSelectedRange({
				from: new Date(booking.check_in_date),
				to: new Date(booking.check_out_date),
			})
		}
		onOpenChange(next)
	}

	const handleSave = async () => {
		if (!selectedRange) return
		try {
			await updateBooking({
				clientId,
				propertyId,
				bookingId: booking.id,
				data: {
					check_in_date: selectedRange.from.toISOString(),
					check_out_date: selectedRange.to.toISOString(),
				},
			})
			toast.success('Dates updated')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.BOOKINGS, clientId, propertyId, booking.id],
			})
			onOpenChange(false)
		} catch {
			toast.error('Failed to update dates')
		}
	}

	const hasChanged =
		selectedRange &&
		(dayjs(selectedRange.from).format('YYYY-MM-DD') !==
			dayjs(booking.check_in_date).format('YYYY-MM-DD') ||
			dayjs(selectedRange.to).format('YYYY-MM-DD') !==
				dayjs(booking.check_out_date).format('YYYY-MM-DD'))

	const { count, label } = selectedRange
		? getBookingDuration(
				selectedRange.from,
				selectedRange.to,
				booking.stay_frequency,
			)
		: { count: 0, label: '' }

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Edit Dates</DialogTitle>
				</DialogHeader>

				<BookingRangeCalendar
					clientId={clientId}
					propertyId={propertyId}
					unitId={booking.unit_id}
					paymentFrequency={booking.stay_frequency}
					selectedRange={selectedRange}
					onRangeSelect={setSelectedRange}
				/>

				{selectedRange ? (
					<div className="bg-muted/40 rounded-lg border">
						<div className="grid grid-cols-3 divide-x">
							<div className="flex flex-col gap-0.5 px-4 py-3">
								<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
									Check-in
								</p>
								<p className="font-serif text-sm font-bold">
									{dayjs(selectedRange.from).format('MMM D, YYYY')}
								</p>
								<p className="text-muted-foreground text-xs">
									{dayjs(selectedRange.from).format('dddd')}
								</p>
							</div>
							<div className="flex flex-col gap-0.5 px-4 py-3">
								<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
									Check-out
								</p>
								<p className="font-serif text-sm font-bold">
									{dayjs(selectedRange.to).format('MMM D, YYYY')}
								</p>
								<p className="text-muted-foreground text-xs">
									{dayjs(selectedRange.to).format('dddd')}
								</p>
							</div>
							<div className="flex flex-col gap-0.5 px-4 py-3">
								<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
									Duration
								</p>
								<p className="font-serif text-sm font-bold">
									{count} {label}
								</p>
							</div>
						</div>
					</div>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!hasChanged || !selectedRange || isPending}
						onClick={() => void handleSave()}
					>
						{isPending ? <Spinner /> : null}
						Save dates
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
