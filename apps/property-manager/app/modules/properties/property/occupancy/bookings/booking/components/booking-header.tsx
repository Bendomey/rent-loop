import dayjs from 'dayjs'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'

const STATUS_CONFIG: Record<
	BookingStatus,
	{ label: string; className: string }
> = {
	PENDING: {
		label: 'Pending',
		className:
			'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
	},
	CONFIRMED: {
		label: 'Confirmed',
		className:
			'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
	},
	CHECKED_IN: {
		label: 'Checked In',
		className:
			'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
	},
	COMPLETED: {
		label: 'Completed',
		className:
			'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
	},
	CANCELLED: {
		label: 'Cancelled',
		className:
			'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
	},
}

const STATUS_MESSAGE: Record<BookingStatus, string> = {
	PENDING: 'Awaiting your confirmation',
	CONFIRMED: 'Booking confirmed',
	CHECKED_IN: 'Guest is currently checked in',
	COMPLETED: 'Stay completed',
	CANCELLED: 'Booking cancelled',
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)
	const handleCopy = () => {
		void navigator.clipboard.writeText(text).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		})
	}
	return (
		<button
			onClick={handleCopy}
			className="text-muted-foreground hover:text-foreground transition-colors"
		>
			{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
		</button>
	)
}

function DatePill({
	date,
	label,
	highlighted,
}: {
	date: Date
	label?: string
	highlighted: boolean
}) {
	const d = localizedDayjs(date)
	return (
		<div
			className={cn(
				'flex min-w-[48px] flex-col items-center rounded-lg px-3 py-2',
				highlighted
					? 'bg-foreground text-background'
					: 'bg-muted text-muted-foreground',
			)}
		>
			<span className="text-[10px] font-medium tracking-wide uppercase opacity-70">
				{d.format('ddd')}
			</span>
			<span className="text-xl leading-tight font-bold">{d.format('D')}</span>
			{label ? (
				<span className="mt-0.5 text-[9px] font-semibold tracking-wider uppercase opacity-80">
					{label}
				</span>
			) : null}
		</div>
	)
}

export function BookingHeader({
	booking,
	propertyId,
	onConfirm,
	onCheckIn,
	onComplete,
	onCancel,
}: {
	booking: Booking
	propertyId: string
	onConfirm: () => void
	onCheckIn: () => void
	onComplete: () => void
	onCancel: () => void
}) {
	const cfg = STATUS_CONFIG[booking.status]
	const nights = localizedDayjs(booking.check_out_date).diff(
		localizedDayjs(booking.check_in_date),
		'day',
	)

	const checkIn = dayjs(booking.check_in_date)
	const checkOut = dayjs(booking.check_out_date)
	const datePills = [
		checkIn.subtract(1, 'day').toDate(),
		checkIn.toDate(),
		...(nights > 1
			? Array.from({ length: nights - 1 }, (_, i) =>
					checkIn.add(i + 1, 'day').toDate(),
				)
			: []),
		checkOut.toDate(),
		checkOut.add(1, 'day').toDate(),
	]

	return (
		<Card className="shadow-none">
			<CardContent className="space-y-4">
				{/* Top row */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link to={`/properties/${propertyId}/occupancy/bookings`}>
							<Button size="icon" variant="ghost" className="size-7">
								<ArrowLeft className="size-4" />
							</Button>
						</Link>
						<div className="flex flex-col items-start gap-1">
							<p className="text-[10px] font-light tracking-widest text-zinc-400 uppercase">
								Booking
							</p>
							<div className="flex items-center gap-3">
								<p className="font-mono text-2xl font-semibold">
									#{booking.code}
								</p>
								<CopyButton text={booking.code} />
								<Badge
									variant="outline"
									className={cn('text-xs', cfg.className)}
								>
									{cfg.label}
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<Separator />

				{/* Stay summary */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-1">
						<p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
							Stay Summary
						</p>
						<h2 className="text-2xl leading-tight font-bold sm:text-3xl">
							<span className="text-rose-600">{nights}</span>{' '}
							{nights === 1 ? 'night' : 'nights'} at {booking.unit?.name ?? '—'}
						</h2>
						<div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
							{booking.unit?.property?.name ? (
								<span>{booking.unit.property.name}</span>
							) : null}
							<span>
								via{' '}
								{booking.booking_source === 'GUEST_LINK'
									? 'Guest Link'
									: 'Manager'}
							</span>
						</div>
					</div>

					{/* Date pills */}
					<div className="flex items-center gap-1">
						{datePills.map((d, i) => {
							const isCheckIn = dayjs(d).isSame(checkIn, 'day')
							const isCheckOut = dayjs(d).isSame(checkOut, 'day')
							return (
								<DatePill
									key={i}
									date={d}
									label={
										isCheckIn
											? 'Check-in'
											: isCheckOut
												? 'Check-out'
												: undefined
									}
									highlighted={isCheckIn || isCheckOut}
								/>
							)
						})}
					</div>
				</div>

				<Separator />

				{/* Status message + actions */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-zinc-400">
						{STATUS_MESSAGE[booking.status]} · received{' '}
						{localizedDayjs(booking.created_at).fromNow()}
					</p>
					<div className="flex items-center gap-2">
						{booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
							<Button
								size="sm"
								variant="outline"
								className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
								onClick={onCancel}
							>
								Cancel booking
							</Button>
						) : null}
						{booking.status === 'PENDING' ? (
							<Button
								size="sm"
								// className="bg-foreground text-background hover:bg-foreground/90"
								onClick={onConfirm}
							>
								Confirm booking
							</Button>
						) : null}
						{booking.status === 'CONFIRMED' ? (
							<Button
								size="sm"
								className="bg-blue-600 text-white hover:bg-blue-700"
								onClick={onCheckIn}
							>
								Check in guest
							</Button>
						) : null}
						{booking.status === 'CHECKED_IN' ? (
							<Button size="sm" onClick={onComplete}>
								Mark as completed
							</Button>
						) : null}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
