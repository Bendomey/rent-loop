import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { AlertTriangleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	HOLD_KINDS,
	KIND_LABEL,
	nightsWord,
	shortDate,
	type Stretch,
} from './helpers'
import { useCreateDateBlock } from '~/api/bookings'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

type HoldKind = (typeof HOLD_KINDS)[number]['value']

export function HoldDatesDialog({
	unit,
	stretches,
	open,
	onOpenChange,
}: {
	unit: PropertyUnit
	stretches: Stretch[]
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const queryClient = useQueryClient()
	const { mutateAsync: createBlock, isPending } = useCreateDateBlock()

	const [kind, setKind] = useState<HoldKind | null>(null)
	const [from, setFrom] = useState<Date | undefined>()
	const [to, setTo] = useState<Date | undefined>()
	const [note, setNote] = useState('')

	const reset = () => {
		setKind(null)
		setFrom(undefined)
		setTo(undefined)
		setNote('')
	}

	const nightly = convertPesewasToCedis(unit.rent_fee)
	const fromD = from ? dayjs(from).startOf('day') : null
	const toD = to ? dayjs(to).startOf('day') : null
	const nights =
		fromD && toD && !toD.isBefore(fromD) ? toD.diff(fromD, 'day') + 1 : 0
	const clashes =
		fromD && toD
			? stretches.filter((s) => !s.from.isAfter(toD) && !s.to.isBefore(fromD))
			: []
	const ready = !!kind && nights > 0 && clashes.length === 0

	const handleSubmit = async () => {
		if (!ready || !from || !to || !kind) return
		try {
			await createBlock({
				clientId,
				propertyId: unit.property_id,
				unitId: unit.id,
				block_type: kind,
				start_date: from.toISOString(),
				end_date: to.toISOString(),
				reason: note || undefined,
			})
			toast.success('Dates held')
			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.DATE_BLOCKS, clientId, unit.property_id, unit.id],
			})
			reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to hold dates')
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) reset()
				onOpenChange(next)
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-serif text-xl">
						Hold some dates
					</DialogTitle>
					<DialogDescription>
						These nights stop being free. Nobody can book them until you let
						them go again.
					</DialogDescription>
				</DialogHeader>

				<div className="bg-muted text-foreground flex items-center gap-2 rounded-md px-3 py-2.5 text-sm">
					<span className="font-semibold">{unit.name}</span>
					<span className="text-muted-foreground ml-auto text-xs">
						{formatAmount(nightly, unit.rent_fee_currency)} a night
					</span>
				</div>

				<div className="space-y-2">
					<p className="text-sm font-semibold">Why are you holding it?</p>
					<div className="flex flex-col gap-2">
						{HOLD_KINDS.map((option) => {
							const on = option.value === kind
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setKind(option.value)}
									className={cn(
										'flex items-start gap-3 rounded-lg border p-3 text-left',
										on
											? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
											: 'hover:bg-muted/50',
									)}
								>
									<span
										className={cn(
											'mt-0.5 size-4 shrink-0 rounded-full border-2',
											on
												? 'border-rose-500 bg-rose-500 ring-2 ring-inset ring-white dark:ring-zinc-950'
												: 'border-muted-foreground/40',
										)}
									/>
									<span>
										<span className="block text-sm font-medium">
											{option.label}
										</span>
										<span className="text-muted-foreground block text-xs">
											{option.hint}
										</span>
									</span>
								</button>
							)
						})}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<p className="text-sm font-semibold">First night</p>
						<DatePickerInput
							value={from}
							onChange={setFrom}
							placeholder="Pick a day"
						/>
					</div>
					<div className="space-y-1.5">
						<p className="text-sm font-semibold">Last night</p>
						<DatePickerInput
							value={to}
							onChange={setTo}
							startMonth={from ?? new Date()}
							placeholder="Pick a day"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<p className="text-sm font-semibold">
						Note{' '}
						<span className="text-muted-foreground font-normal">
							— you can leave this out
						</span>
					</p>
					<Textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="e.g. Repainting the ceiling after the leak"
					/>
				</div>

				{clashes.length > 0 ? (
					<div className="rounded-lg border border-rose-500 bg-rose-50 p-3 dark:bg-rose-950/40">
						<div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
							<AlertTriangleIcon className="size-4" />
							Someone already has these nights
						</div>
						<p className="text-foreground mt-1.5 text-sm">
							{clashes
								.map(
									(s) =>
										`${KIND_LABEL[s.kind]}: ${shortDate(s.from)} → ${shortDate(s.to)}`,
								)
								.join(', and ')}
							. Pick other days, or clear that first — holding these would leave
							two claims on the same night.
						</p>
					</div>
				) : fromD && toD && nights > 0 && kind ? (
					<div className="rounded-lg border p-3">
						<p className="font-serif text-base">
							That is {nightsWord(nights)} off the market — {shortDate(fromD)} up
							to and including {shortDate(toD)}.
						</p>
						<p className="text-muted-foreground mt-1.5 text-sm">
							{formatAmount(nightly * nights, unit.rent_fee_currency)} you will
							not take in bookings. It shows as “
							{KIND_LABEL[kind]}” on the calendar.
						</p>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{!kind
							? 'Say why you are holding it, then pick the first and last night.'
							: 'Pick the first and last night to see how many nights it takes off the market.'}
					</p>
				)}

				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Leave it
					</Button>
					<Button
						className="bg-rose-600 text-white hover:bg-rose-700"
						disabled={!ready || isPending}
						onClick={() => void handleSubmit()}
					>
						{isPending ? <Spinner /> : null}
						{ready ? `Hold these ${nightsWord(nights)}` : 'Hold these nights'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
