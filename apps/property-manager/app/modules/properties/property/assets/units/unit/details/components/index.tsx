import dayjs, { type Dayjs } from 'dayjs'
import { CalendarIcon, ListIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { AvailabilityCalendarView } from './calendar-view'
import {
	buildStretches,
	currentStretch,
	daysWord,
	longDate,
	nextStretch,
	stretchByDay,
	type Stretch,
} from './helpers'
import { HoldDatesDialog } from './hold-dates-dialog'
import { AvailabilityListView } from './list-view'
import { useGetUnitAvailability } from '~/api/bookings'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

function AvailabilitySentence({
	unit,
	stretches,
	today,
}: {
	unit: PropertyUnit
	stretches: Stretch[]
	today: Dayjs
}) {
	const here = currentStretch(stretches, today)
	const next = nextStretch(stretches, today)

	let head: ReactNode
	let sub: string

	if (here) {
		const left = here.to.diff(today, 'day') + 1
		head =
			here.kind === 'MAINTENANCE' ? (
				<>
					{unit.name} is{' '}
					<b className="text-orange-600 dark:text-orange-400">being fixed</b> up
					to and including {longDate(here.to)}.
				</>
			) : here.kind === 'PERSONAL' || here.kind === 'OTHER' ? (
				<>
					You have {unit.name} <b>held back</b> up to and including{' '}
					{longDate(here.to)}.
				</>
			) : here.kind === 'LEASE' ? (
				<>
					{unit.name} is <b>rented out</b> up to and including {longDate(here.to)}
					.
				</>
			) : (
				<>
					{unit.name} is <b>booked</b> up to and including {longDate(here.to)}.
				</>
			)
		const goesFree = here.to.add(1, 'day')
		sub = `${left === 1 ? 'Today is the last night' : `That is ${daysWord(left)}, counting today`}. It goes free on ${longDate(goesFree)}${next ? `, and stays free until ${longDate(next.from)}.` : '.'}`
	} else if (next) {
		const free = next.from.diff(today, 'day')
		head =
			free === 1 ? (
				<>
					{unit.name} is{' '}
					<b className="text-emerald-600 dark:text-emerald-400">
						free today only
					</b>
					.
				</>
			) : (
				<>
					{unit.name} is{' '}
					<b className="text-emerald-600 dark:text-emerald-400">
						free for {daysWord(free)}
					</b>{' '}
					— today up to and including {longDate(next.from.subtract(1, 'day'))}.
				</>
			)
		const lead =
			next.kind === 'MAINTENANCE'
				? `It goes in for repairs on ${longDate(next.from)}.`
				: next.kind === 'LEASE'
					? `A lease starts on ${longDate(next.from)}.`
					: next.kind === 'BOOKING'
						? `A booking starts on ${longDate(next.from)}.`
						: `You have it held back from ${longDate(next.from)}.`
		sub = `${lead} Anyone can have it up to the night before.`
	} else {
		head = (
			<>
				{unit.name} is{' '}
				<b className="text-emerald-600 dark:text-emerald-400">free</b>, with
				nothing booked at all.
			</>
		)
		sub = 'Nothing is on this room as far ahead as your calendar goes.'
	}

	return (
		<div>
			<div className="font-serif text-2xl leading-snug tracking-tight text-pretty">
				{head}
			</div>
			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed text-pretty">
				{sub}
			</p>
		</div>
	)
}

export function UnitAvailabilityCard({ unit }: { unit: PropertyUnit }) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)

	const { today, rangeFrom, rangeTo } = useMemo(() => {
		const t = dayjs().startOf('day')
		return {
			today: t,
			rangeFrom: t.startOf('month').subtract(6, 'month').toDate(),
			rangeTo: t.startOf('month').add(12, 'month').endOf('month').toDate(),
		}
	}, [])

	const { data: blocks, isPending } = useGetUnitAvailability(
		clientId,
		unit.property_id,
		unit.id,
		rangeFrom,
		rangeTo,
	)

	const stretches = useMemo(() => buildStretches(blocks), [blocks])
	const byDay = useMemo(() => stretchByDay(stretches), [stretches])

	const [view, setView] = useState<'calendar' | 'list'>('calendar')
	const [holdOpen, setHoldOpen] = useState(false)

	return (
		<Card className="shadow-none">
			<CardContent>
				<div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
					<h2 className="flex-1 font-serif text-xl">Is it free?</h2>
					<ToggleGroup
						type="single"
						variant="outline"
						value={view}
						onValueChange={(next) =>
							next && setView(next as 'calendar' | 'list')
						}
					>
						<ToggleGroupItem value="calendar" className="gap-1.5 py-1.5 px-3.5">
							<CalendarIcon className="size-4" />
							Calendar
						</ToggleGroupItem>
						<ToggleGroupItem value="list" className="gap-1.5 py-1.5 px-3.5">
							<ListIcon className="size-4" />
							List
						</ToggleGroupItem>
					</ToggleGroup>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button
							className="bg-rose-600 text-white hover:bg-rose-700"
							onClick={() => setHoldOpen(true)}
						>
							Hold some dates
						</Button>
					</PropertyPermissionGuard>
				</div>

				{isPending ? (
					<div className="space-y-4">
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-4 w-2/3" />
						<Skeleton className="h-64 w-full" />
					</div>
				) : (
					<>
						<AvailabilitySentence
							unit={unit}
							stretches={stretches}
							today={today}
						/>
						{view === 'calendar' ? (
							<AvailabilityCalendarView
								stretches={stretches}
								byDay={byDay}
								today={today}
							/>
						) : (
							<AvailabilityListView
								unit={unit}
								stretches={stretches}
								today={today}
							/>
						)}
					</>
				)}
			</CardContent>

			<HoldDatesDialog
				unit={unit}
				stretches={stretches}
				open={holdOpen}
				onOpenChange={setHoldOpen}
			/>
		</Card>
	)
}
