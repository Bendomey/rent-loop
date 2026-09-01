import {
	ArrowLeft,
	Calendar,
	Check,
	Minus,
	Plus,
	TriangleAlert,
	X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { toast } from 'sonner'
import {
	formatDay,
	lastDayOfTerm,
} from '../../../applications/application/move-in/term'
import { AskRoom } from './ask-room'
import { Chip, MoneyField, Notice, Question, TermBar } from './parts'
import { SummaryRail } from './summary-rail'
import { useGetUnitAvailability } from '~/api/bookings'
import { type RenewLeaseFee, useRenewLease } from '~/api/leases'
import { DatePickerInput } from '~/components/date-picker-input'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { dayIsSaturated, termIsSaturated } from '~/lib/availability'
import { formatAmount } from '~/lib/format-amount'
import { type PaymentFrequency, termEndDate } from '~/lib/schedule'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.leases.$leaseId_.renew'

type Step = 'term' | 'room' | 'review'

const STEPS: [Step, string][] = [
	['term', 'New term'],
	['room', 'Room & rent'],
	['review', 'Check it over'],
]

const money = (minor: number, currency: string) =>
	formatAmount(minor / 100, currency)

/** "a year" reads better than "12 months" in a sentence. */
const durationWords = (n: number) =>
	n === 12
		? 'a year'
		: n === 24
			? 'two years'
			: n === 6
				? 'six months'
				: `${n} months`
const durationBare = (n: number) => durationWords(n).replace(/^a /, '')

const DURATIONS = [
	{ n: 6, label: '6 months' },
	{ n: 12, label: '1 year', tag: 'Most renewals' },
	{ n: 24, label: '2 years' },
]

function StepRail({ step }: { step: Step }) {
	const at = STEPS.findIndex(([key]) => key === step)
	return (
		<ol className="flex flex-wrap items-center gap-2.5">
			{STEPS.map(([key, label], index) => {
				const done = index < at
				const on = index === at
				return (
					<li key={key} className="flex items-center gap-2.5">
						{index > 0 && (
							<span
								className={cn(
									'h-[1.5px] w-[26px]',
									done || on ? 'bg-primary/25' : 'bg-border',
								)}
							/>
						)}
						<span className="flex items-center gap-[9px]">
							<span
								className={cn(
									'flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold',
									on
										? 'bg-primary text-primary-foreground'
										: done
											? 'bg-success-bg text-success'
											: 'bg-muted text-muted-foreground/60 border',
								)}
							>
								{done ? <Check className="size-3.5" /> : index + 1}
							</span>
							<span
								className={cn(
									'text-sm',
									on
										? 'text-foreground font-bold'
										: done
											? 'text-foreground-soft font-semibold'
											: 'text-muted-foreground/60 font-semibold',
								)}
							>
								{label}
							</span>
						</span>
					</li>
				)
			})}
		</ol>
	)
}

/**
 * Renewing a lease — a move-in for a new term.
 *
 * Laid out as the design has it: the questions on the left, a plain-words rail
 * on the right that reads back what has been set and carries the one button
 * that commits it.
 *
 * The renewal is created Pending; the daily lifecycle sweeps activate it and
 * complete the parent on the changeover day, so nothing here schedules
 * anything.
 */
export function LeaseRenewalModule() {
	const { lease, propertyId } = useLoaderData<typeof loader>()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const renew = useRenewLease()

	const frequency = (lease?.payment_frequency ?? 'MONTHLY') as PaymentFrequency
	const currency = lease?.rent_fee_currency ?? 'GHS'
	const parentEnd = lease?.move_out_date ? new Date(lease.move_out_date) : null

	const [step, setStep] = useState<Step>('term')
	const [date, setDate] = useState<Nullable<Date>>(parentEnd)
	const [duration, setDuration] = useState<number>(12)
	const [custom, setCustom] = useState(false)
	const [rent, setRent] = useState<string>(String((lease?.rent_fee ?? 0) / 100))
	const [fees, setFees] = useState<RenewLeaseFee[]>([])
	const [unitId, setUnitId] = useState<string>(lease?.unit?.id ?? '')
	const [signed, setSigned] = useState<Nullable<Lease>>(null)

	/*
	 * Fixed on first render. A window recomputed each render would be a new
	 * query key each render, and `new Date()` alone would never settle.
	 */
	const [availabilityWindow] = useState(() => {
		const from = lease?.move_out_date
			? new Date(lease.move_out_date)
			: new Date()
		const to = new Date(from)
		to.setFullYear(to.getFullYear() + 5)
		return { from, to }
	})

	/*
	 * The parent's own chain is excluded server-side. Without that a same-unit
	 * renewal would be refused by the term it continues, and a third term by
	 * the second.
	 */
	const {
		data: availability,
		isPending: availabilityPending,
		isError: availabilityFailed,
	} = useGetUnitAvailability(
		clientId,
		propertyId,
		unitId,
		availabilityWindow.from,
		availabilityWindow.to,
		lease?.id,
	)

	// Every hook is above this line: the guard cannot sit any earlier without
	// changing hook order between renders.
	if (!lease) return null

	// Fail open — the server guard still refuses a bad term.
	const ranges = availability?.saturated_ranges ?? []

	const rentMinor = Math.round(Number(rent || 0) * 100)
	const feeTotal = fees.reduce((sum, fee) => sum + fee.amount, 0)
	const currentUnitId = lease.unit?.id ?? ''
	const unitChanged = !!unitId && unitId !== currentUnitId
	const early = !!date && !!parentEnd && date < parentEnd
	const end = date ? termEndDate(date, duration, frequency) : null
	const parentLastDay = parentEnd ? lastDayOfTerm(parentEnd) : null
	const parentPeriods = lease.stay_duration || 1

	/*
	 * The earliest day a renewal may start — the same floor the API enforces,
	 * so the picker cannot offer a date the server would refuse.
	 *
	 * It is the parent's move-out, NOT today: a lease that already ended can
	 * still be renewed continuously from the day it ended, and that day is in
	 * the past. Flooring at today would make the correct answer unpickable.
	 */
	const earliestStart = parentEnd ?? new Date()
	/*
	 * Compared by calendar day, not by instant. Stored dates are UTC midnight
	 * while the calendar hands back local dates, so a raw `<` can disable the
	 * move-out day itself — which would make "Straight after", the common
	 * answer, the one day nobody can pick.
	 */
	const dayKey = (value: Date) =>
		Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
	// Far enough out for a long term, near enough that the year dropdown stays
	// usable. Without an endMonth the dropdown stops at the current year, which
	// is what made a 2027 start unreachable.
	const latestStart = new Date(earliestStart)
	latestStart.setFullYear(latestStart.getFullYear() + 5)

	// Saturation is an additional constraint on the parent-end floor, never a
	// looser one.
	const termClashes = Boolean(date && end && termIsSaturated(date, end, ranges))

	const ready =
		!!date && !early && !termClashes && (step === 'term' || rentMinor > 0)
	const actionLabel =
		step === 'term'
			? 'Next: room & rent'
			: step === 'room'
				? 'Next: check it over'
				: 'Sign the renewal'

	const submit = async () => {
		if (!date) return
		if (step !== 'review') {
			setStep(step === 'term' ? 'room' : 'review')
			return
		}
		try {
			const created = await renew.mutateAsync({
				clientId,
				propertyId,
				leaseId: lease.id,
				body: {
					move_in_date: date.toISOString(),
					stay_duration: duration,
					stay_duration_frequency: frequency,
					rent_fee: rentMinor,
					...(unitChanged
						? { unit_id: unitId, carry_financial_account: true }
						: {}),
					fees: fees.filter((fee) => fee.amount > 0),
				},
			})
			toast.success('Renewed — the new term starts when this one ends')
			setSigned(created ?? null)
		} catch (error) {
			// A lease can only be renewed once, so another manager may have got
			// there first. Their reason is the useful thing to show.
			toast.error(
				error instanceof Error ? error.message : 'That renewal was refused',
			)
		}
	}

	if (signed) {
		const hasMoney = !!lease.financial_account?.id
		return (
			<div className="mx-auto flex max-w-3xl flex-col gap-[18px] p-5">
				<div className="bg-card rounded-xl border p-8">
					<div className="flex items-start gap-3.5">
						<span className="bg-success-bg text-success flex size-[42px] shrink-0 items-center justify-center rounded-full">
							<Check className="size-[22px]" />
						</span>
						<div className="min-w-0">
							<h1 className="text-2xl font-bold tracking-[-0.5px]">
								They’re staying on
							</h1>
							<p className="text-muted-foreground mt-1.5 text-[15px]">
								New lease{' '}
								<b className="text-foreground-soft font-mono text-sm">
									{signed.code}
								</b>
								{date ? ` · from ${formatDay(date)}` : ''} ·{' '}
								{money(rentMinor, currency)} a {frequency.toLowerCase()}
							</p>
						</div>
					</div>
					<div className="border-border/60 mt-[22px] border-t pt-5">
						{hasMoney ? (
							<>
								<p className="text-base font-bold">Did they pay at signing?</p>
								<p className="text-muted-foreground mt-[7px] max-w-[560px] text-[14.5px] leading-[1.6]">
									Most renewals are paid on the spot. Record it and the new term
									starts clean — or leave it, and it shows as still owed on
									their Money page.
								</p>
								<div className="mt-[18px] flex flex-wrap gap-2.5">
									<Button asChild>
										<Link
											to={`/properties/${propertyId}/occupancy/leases/${signed.id}?tab=financials`}
										>
											They paid — record it
										</Link>
									</Button>
									<Button variant="outline" asChild>
										<Link
											to={`/properties/${propertyId}/occupancy/leases/${signed.id}`}
										>
											Not yet, open the new lease
										</Link>
									</Button>
								</div>
							</>
						) : (
							<Notice
								tone="neutral"
								icon={<TriangleAlert className="size-[17px]" />}
								title="There’s nothing to collect yet"
								body={
									<span className="flex flex-wrap items-center gap-3">
										<span>
											Rent for this tenancy was never set up as bills, so there
											is no first payment to take.
										</span>
										<Button variant="outline" size="sm" asChild>
											<Link
												to={`/properties/${propertyId}/occupancy/leases/${signed.id}`}
											>
												Open the new lease
											</Link>
										</Button>
									</span>
								}
							/>
						)}
					</div>
				</div>
			</div>
		)
	}

	const sentence = early ? (
		<>
			The new term starts{' '}
			<b className="text-foreground">{date ? formatDay(date) : ''}</b>, but they
			are still under their current lease then. A renewal picks up where that
			one leaves off.
		</>
	) : (
		<>
			<b className="text-foreground">
				{lease.tenant?.first_name ?? 'This tenant'}
			</b>{' '}
			stays on in{' '}
			<b className="text-foreground">{lease.unit?.name ?? 'their room'}</b> for
			another <b className="text-foreground">{durationBare(duration)}</b>, from{' '}
			<b className="text-foreground">{date ? formatDay(date) : '—'}</b> to{' '}
			<b className="text-foreground">
				{end ? formatDay(lastDayOfTerm(end)) : '—'}
			</b>
			{step === 'term' ? (
				'.'
			) : (
				<>
					, at <b className="text-foreground">{money(rentMinor, currency)}</b> a{' '}
					{frequency.toLowerCase()}.
				</>
			)}
			{step !== 'term' && (
				<>
					{unitChanged
						? ' Their deposit and running balance come with them.'
						: ' Their deposit and balance carry on untouched.'}
				</>
			)}
		</>
	)

	const rows: [string, string][] =
		step === 'term' || !date
			? []
			: [
					['Whole new term', money(rentMinor * duration + feeTotal, currency)],
					...(feeTotal > 0
						? ([['One-off amounts', money(feeTotal, currency)]] as [
								string,
								string,
							][])
						: []),
					['Renewal talk again', end ? formatDay(lastDayOfTerm(end)) : '—'],
				]

	return (
		<div className="mx-auto flex max-w-[1200px] flex-col px-10 py-[30px]">
			<div className="mb-[22px] flex flex-wrap items-start justify-between gap-6">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-3.5">
						<h1 className="text-[32px] font-bold tracking-[-1px]">
							Keep {lease.tenant?.first_name ?? 'this tenant'} on
						</h1>
						<Badge
							variant="outline"
							className={cn(
								'border-transparent px-3 py-1 text-[13px] font-bold',
								early
									? 'bg-warning-bg text-warning'
									: 'bg-muted text-muted-foreground',
							)}
						>
							{early
								? 'Start date clashes'
								: `Step ${STEPS.findIndex(([key]) => key === step) + 1} of 3`}
						</Badge>
					</div>
					<p className="text-muted-foreground mt-[9px] text-[15.5px]">
						{parentLastDay
							? `This lease ends ${formatDay(parentLastDay)}. A renewal is a fresh contract for the next term — same tenant, same tenancy.`
							: 'A renewal is a fresh contract for the next term — same tenant, same tenancy.'}
					</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<Link
						to={
							step === 'term'
								? `/properties/${propertyId}/occupancy/leases/${lease.id}`
								: '#'
						}
						onClick={(event) => {
							if (step === 'term') return
							event.preventDefault()
							setStep(step === 'review' ? 'room' : 'term')
						}}
					>
						<ArrowLeft className="size-4" />
						{step === 'term' ? 'Back to the lease' : 'Back a step'}
					</Link>
				</Button>
			</div>

			<div className="mb-6">
				<StepRail step={step} />
			</div>

			<div className="flex items-start gap-[26px]">
				<div className="flex min-w-0 flex-1 flex-col gap-[18px]">
					<div className="bg-card rounded-xl border px-7 pt-1 pb-6">
						{step === 'term' && (
							<>
								<Question
									q="When does the new term start?"
									done={!!date && !early}
									help={
										parentLastDay ? (
											<>
												The current term’s last day is{' '}
												<b className="text-foreground">
													{formatDay(parentLastDay)}
												</b>
												, so the new one carries on from there. Pick a later day
												if they are taking a break — the two terms cannot
												overlap.
											</>
										) : (
											'Pick the day the new term begins.'
										)
									}
								>
									<div className="flex flex-wrap items-center gap-3">
										{parentEnd && (
											<button
												type="button"
												onClick={() => setDate(parentEnd)}
												className={cn(
													'rounded-[13px] border-[1.5px] px-[15px] py-[11px] text-left',
													date && date.getTime() === parentEnd.getTime()
														? 'border-primary bg-primary/8'
														: 'bg-card',
												)}
											>
												<span className="block text-[14.5px] font-bold">
													Straight after
												</span>
												<span className="text-success mt-0.5 block text-[12.5px] font-bold">
													{formatDay(parentEnd)} · no gap
												</span>
											</button>
										)}
										<span className="text-muted-foreground text-[13.5px]">
											Or pick any day
										</span>
										<DatePickerInput
											value={date ?? undefined}
											onChange={(next) => setDate(next ?? null)}
											startMonth={earliestStart}
											readOnly={availabilityPending}
											endMonth={latestStart}
											disabled={(day) =>
												dayKey(day) < dayKey(earliestStart) ||
												dayIsSaturated(day, ranges)
											}
										/>
									</div>
									{availabilityFailed && (
										<div className="mt-4">
											<Notice
												tone="warning"
												icon={<TriangleAlert className="size-[17px]" />}
												title="Couldn’t check what this room already has booked"
												body={
													<>
														Every date is selectable, but a clash will be
														refused when the renewal is created.
													</>
												}
											/>
										</div>
									)}
									{termClashes && !early && (
										<div className="mt-4">
											<Notice
												tone="warning"
												icon={<TriangleAlert className="size-[17px]" />}
												title="The room fills up partway through this term"
												body={
													<>
														The start date is free, but a later part of the term
														is not. Shorten it or start later.
													</>
												}
											/>
										</div>
									)}
									{early && parentEnd && parentLastDay && (
										<div className="mt-4">
											<Notice
												tone="warning"
												icon={<TriangleAlert className="size-[17px]" />}
												title="That day is still inside the current term"
												body={
													<>
														They are under {lease.code} until{' '}
														{formatDay(parentLastDay)}. A renewal starts where
														that one ends — if the term really is changing
														early, end the current lease first, then renew.
													</>
												}
												action={
													<Button
														variant="outline"
														size="sm"
														onClick={() => setDate(parentEnd)}
													>
														<Calendar className="size-4" />
														Use {formatDay(parentEnd)}
													</Button>
												}
											/>
										</div>
									)}
								</Question>

								<Question
									q="How long for?"
									dim={!date}
									done={!!date}
									help="This is a new contract, so the length is yours to set again. They can renew again after it."
									foot={
										custom
											? 'Anything from 1 to 60 periods. An odd length is fine — rent still falls on the same day each period.'
											: undefined
									}
								>
									<div className="flex flex-wrap gap-3">
										{DURATIONS.map((option) => {
											const on = !custom && duration === option.n
											return (
												<button
													key={option.n}
													type="button"
													onClick={() => {
														setDuration(option.n)
														setCustom(false)
													}}
													className={cn(
														'min-w-[152px] rounded-[14px] border-[1.5px] px-5 py-[15px] text-left',
														on ? 'border-primary bg-primary/8' : 'bg-card',
													)}
												>
													<span className="block text-[17.5px] font-bold tracking-[-0.3px]">
														{option.label}
													</span>
													<span
														className={cn(
															'mt-1 block text-[12.5px]',
															option.tag
																? 'text-success font-bold'
																: 'text-muted-foreground',
														)}
													>
														{option.tag ?? `${option.n} rent payments`}
													</span>
												</button>
											)
										})}
										<button
											type="button"
											onClick={() => setCustom(true)}
											className={cn(
												'min-w-[152px] rounded-[14px] border-[1.5px] px-5 py-[15px] text-left',
												custom ? 'border-primary bg-primary/8' : 'bg-card',
											)}
										>
											<span className="block text-[17.5px] font-bold tracking-[-0.3px]">
												Something else
											</span>
											<span className="text-muted-foreground mt-1 block text-[12.5px]">
												Set the length yourself
											</span>
										</button>
									</div>
									{custom && (
										<div className="bg-muted mt-4 flex flex-wrap items-center gap-3.5 rounded-[13px] px-[18px] py-[15px]">
											<span className="text-[14.5px] font-semibold">
												They stay for
											</span>
											<div className="bg-card flex items-center rounded-[10px] border-[1.5px]">
												<button
													type="button"
													aria-label="One less"
													onClick={() => setDuration(Math.max(1, duration - 1))}
													className="flex h-11 w-10 items-center justify-center"
												>
													<Minus className="text-muted-foreground size-[17px]" />
												</button>
												<span className="min-w-[38px] text-center font-mono text-lg font-bold">
													{duration}
												</span>
												<button
													type="button"
													aria-label="One more"
													onClick={() =>
														setDuration(Math.min(60, duration + 1))
													}
													className="flex h-11 w-10 items-center justify-center"
												>
													<Plus className="text-muted-foreground size-[17px]" />
												</button>
											</div>
											<span className="text-muted-foreground text-[14.5px]">
												periods — that’s{' '}
												<b className="text-foreground">
													{duration} rent payments
												</b>
												{end ? `, ending ${formatDay(lastDayOfTerm(end))}` : ''}
											</span>
										</div>
									)}
								</Question>
							</>
						)}

						{step === 'room' && (
							<>
								<AskRoom
									clientId={clientId}
									propertyId={propertyId}
									currentUnitId={currentUnitId}
									currentUnitName={lease.unit?.name ?? '—'}
									unitId={unitId}
									onUnitChange={setUnitId}
									currency={currency}
									parentEnd={parentLastDay}
									onRentSuggestion={(minor) => setRent(String(minor / 100))}
								/>
								<Question
									q="What’s the rent for the new term?"
									done={rentMinor > 0}
									help={
										<>
											They pay{' '}
											<b className="text-foreground">
												{money(lease.rent_fee, currency)}
											</b>{' '}
											at the moment. Most renewals keep it or lift it a little —
											the new figure only applies from the new term.
										</>
									}
								>
									<div className="flex flex-wrap items-center gap-3.5">
										<MoneyField
											id="renewal-rent"
											value={rent}
											onChange={setRent}
											per={frequency.toLowerCase()}
											big
											width={300}
										/>
										{rentMinor !== lease.rent_fee && (
											<Chip
												onClick={() => setRent(String(lease.rent_fee / 100))}
											>
												Keep it at {money(lease.rent_fee, currency)}
											</Chip>
										)}
									</div>
									{rentMinor > 0 && rentMinor !== lease.rent_fee && (
										<p className="text-muted-foreground mt-3.5 text-[13.5px]">
											That’s{' '}
											<b className="text-foreground">
												{rentMinor > lease.rent_fee
													? `${money(rentMinor - lease.rent_fee, currency)} more`
													: `${money(lease.rent_fee - rentMinor, currency)} less`}
											</b>{' '}
											a {frequency.toLowerCase()} than now —{' '}
											{money(rentMinor * duration, currency)} over the whole
											term.
										</p>
									)}
								</Question>
								<RenewalFees
									fees={fees}
									onChange={setFees}
									rentMinor={rentMinor}
									currency={currency}
								/>
							</>
						)}

						{step === 'review' && date && end && parentLastDay && (
							<Question
								q="The term being finished, and the one being signed"
								done
							>
								<div className="grid gap-4 sm:grid-cols-2">
									<TermColumn
										title={`${lease.code} · finishing`}
										rows={[
											[
												'Dates',
												`${formatDay(new Date(lease.move_in_date))} – ${formatDay(parentLastDay)}`,
											],
											['Rent', money(lease.rent_fee, currency)],
											['Room', lease.unit?.name ?? '—'],
										]}
									/>
									<TermColumn
										tone
										title="The new term"
										rows={[
											[
												'Dates',
												`${formatDay(date)} – ${formatDay(lastDayOfTerm(end))}`,
												true,
											],
											[
												'Rent',
												money(rentMinor, currency),
												rentMinor !== lease.rent_fee,
											],
											[
												'Room',
												unitChanged
													? 'A move to another room'
													: `${lease.unit?.name ?? '—'} — no change`,
												unitChanged,
											],
											[
												feeTotal > 0 ? 'One-off amounts' : 'Anything else',
												feeTotal > 0
													? `${money(feeTotal, currency)} at the start`
													: 'Just rent',
												feeTotal > 0,
											],
											...(unitChanged
												? ([['Their money', 'Carries over', false]] as [
														string,
														string,
														boolean,
													][])
												: []),
										]}
									/>
								</div>
							</Question>
						)}
					</div>

					{step === 'term' && !early && date && end && (
						<div className="bg-card rounded-xl border px-7 py-6">
							<p className="mb-[18px] text-lg font-bold tracking-[-0.2px]">
								How the two terms sit together
							</p>
							<TermBar
								startLabel={formatDay(date)}
								endLabel={formatDay(lastDayOfTerm(end))}
								durationLabel={durationWords(duration)}
								oldPeriods={parentPeriods}
								newPeriods={duration}
								oldEndLabel={parentLastDay ? formatDay(parentLastDay) : '—'}
								rentLabel={money(rentMinor, currency)}
							/>
						</div>
					)}

					{step === 'review' && date && end && (
						<div className="bg-card rounded-xl border px-7 py-6">
							<TermBar
								startLabel={formatDay(date)}
								endLabel={formatDay(lastDayOfTerm(end))}
								durationLabel={durationWords(duration)}
								oldPeriods={parentPeriods}
								newPeriods={duration}
								oldEndLabel={parentLastDay ? formatDay(parentLastDay) : '—'}
								rentLabel={money(rentMinor, currency)}
							/>
						</div>
					)}
				</div>

				<SummaryRail
					sentence={sentence}
					rows={rows}
					actionLabel={actionLabel}
					onAction={() => void submit()}
					ready={ready}
					pending={renew.isPending}
					tone={early ? 'warning' : 'primary'}
					foot={
						step === 'review'
							? 'This writes a new lease under the same tenancy. Nothing goes out to the tenant until they are billed.'
							: early
								? `Move the start date to on or after ${parentEnd ? formatDay(parentEnd) : 'the current term’s end'} and this turns on.`
								: 'Nothing is saved yet — you can change any of this on the last step.'
					}
				/>
			</div>
		</div>
	)
}

function TermColumn({
	title,
	rows,
	tone,
}: {
	title: string
	rows: [string, string, boolean?][]
	tone?: boolean
}) {
	return (
		<div
			className={cn(
				'overflow-hidden rounded-2xl border',
				tone ? 'border-primary/25' : '',
			)}
		>
			<div
				className={cn(
					'border-border/60 border-b px-5 py-3.5',
					tone ? 'bg-primary/8' : 'bg-muted',
				)}
			>
				<p
					className={cn(
						'text-[15px] font-bold',
						tone ? 'text-primary' : 'text-foreground-soft',
					)}
				>
					{title}
				</p>
			</div>
			<div className="px-5 pt-1.5 pb-3.5">
				{rows.map(([label, value, highlight], index) => (
					<div
						key={label}
						className={cn(
							'flex items-baseline justify-between gap-3.5 py-3',
							index > 0 ? 'border-border/60 border-t' : '',
						)}
					>
						<span className="text-muted-foreground text-[13.5px]">{label}</span>
						<span
							className={cn(
								'text-right text-[15px] font-bold',
								highlight ? 'text-primary' : '',
							)}
						>
							{value}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

/**
 * The one-off amounts due at the start of a term.
 *
 * A deposit top-up lives here rather than being raised automatically when rent
 * rises: a renewal never re-charges a deposit on its own, because a tenant who
 * renews should never appear to owe a second one.
 */
function RenewalFees({
	fees,
	onChange,
	rentMinor,
	currency,
}: {
	fees: RenewLeaseFee[]
	onChange: (next: RenewLeaseFee[]) => void
	rentMinor: number
	currency: string
}) {
	const suggestions = [
		{
			category: 'SECURITY_DEPOSIT' as const,
			name: 'Deposit top-up',
			why: 'Add to the deposit already held, if the new rent raises it',
		},
		{
			category: 'AGENCY_FEE' as const,
			name: 'Renewal fee',
			why: 'What you charge for drawing up the new term',
		},
		{
			category: 'UTILITY' as const,
			name: 'Water or electricity',
			why: 'If you bill it separately from rent',
		},
	]
	const total = fees.reduce((sum, fee) => sum + fee.amount, 0)

	return (
		<Question
			q="Do they pay anything else this term?"
			dim={rentMinor <= 0}
			done={fees.length > 0}
			help="One-off amounts paid once at the start of the new term. Tap to add one, tap again to take it off."
			foot={
				fees.length > 0
					? `They pay ${money(total, currency)} on top of the first rent — ${money(rentMinor + total, currency)} to start the term.`
					: 'Leave these off if only rent is due.'
			}
		>
			<div className="flex flex-wrap gap-[9px]">
				{suggestions.map((suggestion) => {
					const on = fees.some((fee) => fee.category === suggestion.category)
					return (
						<Chip
							key={suggestion.category}
							on={on}
							dismissible
							onClick={() =>
								onChange(
									on
										? fees.filter((fee) => fee.category !== suggestion.category)
										: [
												...fees,
												{
													category: suggestion.category,
													name: suggestion.name,
													amount: 0,
												},
											],
								)
							}
						>
							{suggestion.name}
						</Chip>
					)
				})}
			</div>
			{fees.length > 0 && (
				<div className="mt-4 rounded-[14px] border px-[18px] pt-1 pb-2">
					{fees.map((fee, index) => {
						const suggestion = suggestions.find(
							(item) => item.category === fee.category,
						)
						return (
							<div
								key={fee.category}
								className={cn(
									'flex flex-wrap items-center gap-3.5 py-3',
									index > 0 ? 'border-border/60 border-t' : '',
								)}
							>
								<div className="min-w-0 flex-1">
									<p className="text-[15px] font-semibold">{fee.name}</p>
									{suggestion && (
										<p className="text-muted-foreground mt-0.5 text-[12.5px]">
											{suggestion.why}
										</p>
									)}
								</div>
								<MoneyField
									value={fee.amount === 0 ? '' : String(fee.amount / 100)}
									onChange={(next) =>
										onChange(
											fees.map((item) =>
												item.category === fee.category
													? {
															...item,
															amount: Math.round(Number(next || 0) * 100),
														}
													: item,
											),
										)
									}
									width={170}
								/>
								<button
									type="button"
									aria-label={`Remove ${fee.name}`}
									onClick={() =>
										onChange(
											fees.filter((item) => item.category !== fee.category),
										)
									}
									className="bg-card flex size-8 items-center justify-center rounded-[9px] border"
								>
									<X className="text-muted-foreground size-[15px]" />
								</button>
							</div>
						)
					})}
				</div>
			)}
		</Question>
	)
}
