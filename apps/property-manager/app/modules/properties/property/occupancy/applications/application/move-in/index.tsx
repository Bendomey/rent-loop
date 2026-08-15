import {
	ArrowRight,
	Building2,
	Calendar,
	Check,
	Lock,
	TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTenantApplicationContext } from '../context'
import { DurationStepper } from './duration-stepper'
import { durationLabel, formatDay } from './term'
import { TermSummary } from './term-summary'
import { useUnitAvailability } from './use-unit-availability'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { QUERY_KEYS } from '~/lib/constants'
import { DatePickerInput } from '~/components/date-picker-input'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
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
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import type { PaymentFrequency } from '~/lib/schedule'
import { buildSchedule, termEndDate } from '~/lib/schedule'
import { safeString, toFirstUpperCase } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const HANDS_ON: Array<[string, string]> = [
	[
		'Financial setup',
		'The number of rent charges and the date each one falls due',
	],
	[
		'Lease documents',
		'The term printed on the tenancy agreement, and its end date',
	],
	[
		'The unit',
		'It shows as reserved from the move-in date, so no one else can be applied for it',
	],
]

const sameDay = (a: Nullable<Date>, b: Nullable<Date>) =>
	(a?.toDateString() ?? null) === (b?.toDateString() ?? null)

export function PropertyTenantApplicationMoveIn() {
	const { tenantApplication: application } = useTenantApplicationContext()
	const { clientUser } = useClient()
	const revalidator = useRevalidator()
	const { isPending, mutate } = useAdminUpdateTenantApplication()
	const queryClient = useQueryClient()
	const [confirmRebuild, setConfirmRebuild] = useState(false)

	const unit = application.desired_unit
	const clientId = safeString(clientUser?.client_id)
	const propertyId = unit.property_id
	const account = application.financial_account

	// The term is fixed once anything has been BILLED, not merely paid: changing
	// it re-derives the rent charges, and the backend refuses that with
	// ChargesAlreadyBilled the moment a charge is on an invoice. Locking only on
	// settlement would leave an invoiced-but-unpaid term editable, and the save
	// would come back a 400.
	//
	// Read the server's own flag rather than inferring it. `total_settled > 0`
	// and `invoice_count > 0` are both account-wide, so an invoice covering only
	// a deposit locked the move-in date even though the service would have
	// allowed the change.
	const locked = Boolean(account?.rent_terms_locked)
	const readonly =
		application.status !== 'TenantApplication.Status.InProgress' || locked

	// Frequency is not a decision made on this step — it comes from the unit
	// alongside the currency, which is why the old "Stay Duration Frequency"
	// select was permanently disabled.
	const frequency = (application.stay_duration_frequency ??
		unit.payment_frequency) as PaymentFrequency

	const savedDate = application.desired_move_in_date
		? new Date(application.desired_move_in_date)
		: null
	const savedDuration = application.stay_duration ?? null

	const [date, setDate] = useState<Nullable<Date>>(savedDate)
	const [duration, setDuration] = useState(savedDuration ?? 12)

	const { freeFrom, occupant } = useUnitAvailability(
		clientId,
		propertyId,
		unit.id,
		application.id,
		unit.max_occupants_allowed,
	)
	const clashes = Boolean(date && freeFrom && freeFrom > date)

	// The rent the term will be priced at: the agreed figure once it exists,
	// otherwise the unit's listing, which is all financial setup has to offer.
	const rentAgreed = (application.rent_fee ?? 0) > 0
	const rent = rentAgreed ? (application.rent_fee ?? 0) : unit.rent_fee

	const end = date ? termEndDate(date, duration, frequency) : null
	const periods = date
		? buildSchedule({
				rent,
				moveIn: date,
				stayDuration: duration,
				stayFrequency: frequency,
				paymentFrequency: frequency,
			})
		: []

	const dirty = !sameDay(date, savedDate) || duration !== savedDuration
	// Changing the term after charges exist removes every rent charge and builds
	// new ones. Allowed while nothing is billed — but never silently.
	const rebuilds = dirty && !locked && (account?.charge_count ?? 0) > 0

	const save = () => {
		if (!date) return
		mutate(
			{
				client_id: clientId,
				id: application.id,
				property_id: propertyId,
				data: {
					desired_move_in_date: date.toISOString() as unknown as Date,
					stay_duration: duration,
					stay_duration_frequency: frequency,
				},
			},
			{
				onSuccess: () => {
					toast.success(
						rebuilds
							? 'Term saved and charges rebuilt.'
							: 'Move-in setup saved.',
					)
					void revalidator.revalidate()
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				},
				onError: (error: Error) => {
					toast.error(
						error.message === 'ChargesAlreadyBilled'
							? 'A payment was collected while you were editing. The term is now fixed.'
							: 'Could not save the move-in setup. Please try again.',
					)
					void revalidator.revalidate()
				},
			},
		)
	}

	return (
		<div className="space-y-4">
			<Card className="gap-0 overflow-hidden py-0 shadow-none">
				{/* Deliberately not a CardHeader: that lays its children out on a
					    two-column grid as soon as a CardAction is present, which squeezed
					    the unit name into a one-word-per-line column on a phone. */}
				<div className="bg-muted flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-4 sm:px-6">
					{/* Icon and text are one unit — left as siblings of the wrapping
						    row, the icon takes a line of its own on a phone. */}
					<div className="flex min-w-0 items-start gap-3">
						<Building2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
						<p className="min-w-0 text-sm">
							<span className="font-bold">{unit.name}</span> ·{' '}
							{toFirstUpperCase(unit.type.toLowerCase())} · billed{' '}
							<span className="font-bold">
								{unit.payment_frequency.toLowerCase()}
							</span>{' '}
							in {unit.rent_fee_currency}
						</p>
					</div>
					<p className="text-muted-foreground w-full text-xs sm:ml-auto sm:w-auto">
						frequency and currency come from the unit — not editable here
					</p>
				</div>

				<CardContent className="grid gap-7 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
					<div className="min-w-0">
						{/* The hint sits beside the label when there is room and drops
						    below it when there isn't — the main column is a third of the
						    width the design boards at. */}
						<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
							<Label htmlFor="move-in-date" className="shrink-0">
								Move-in date
							</Label>
							<span className="text-muted-foreground text-xs">
								{readonly ? 'fixed' : 'the day the term starts and rent begins'}
							</span>
						</div>
						<div className="mt-2 max-w-60">
							<DatePickerInput
								value={date ?? undefined}
								placeholder="Pick a date"
								readOnly={readonly}
								onChange={(next) => setDate(next ?? null)}
							/>
						</div>
						{!readonly ? (
							<p className="text-muted-foreground mt-3 max-w-80 text-xs leading-relaxed">
								The application doesn&apos;t carry a date — agree one with{' '}
								{application.first_name} and set it here.
							</p>
						) : null}

						<div className="mt-7">
							<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
								<Label className="shrink-0">Stay duration</Label>
								<span className="text-muted-foreground text-xs">
									{readonly
										? 'fixed'
										: 'how many rent charges the term produces'}
								</span>
							</div>
							<div className="mt-2">
								{readonly ? (
									<p className="text-muted-foreground text-xl font-bold">
										{durationLabel(duration, frequency)}
									</p>
								) : (
									<DurationStepper
										value={duration}
										onChange={setDuration}
										frequency={frequency}
										disabled={isPending}
									/>
								)}
							</div>
						</div>
					</div>

					<TermSummary
						start={date}
						end={end}
						duration={duration}
						frequency={frequency}
						periods={periods}
						rent={rent}
						currency={unit.rent_fee_currency}
						rentAgreed={rentAgreed}
						freeFrom={freeFrom}
					/>
				</CardContent>

				{clashes && freeFrom ? (
					<div className="border-t p-5">
						<Alert className="bg-warning-bg border-transparent">
							<TriangleAlert className="text-warning size-4" />
							<AlertTitle className="text-warning">
								{unit.name} isn&apos;t free until {formatDay(freeFrom)}
							</AlertTitle>
							<AlertDescription className="flex flex-col items-start gap-3">
								<span>
									{occupant ? `${occupant} is` : 'The sitting tenant is'} under
									notice and leaves that day. A term starting{' '}
									{date ? formatDay(date) : null} would overlap a live lease.
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setDate(freeFrom)}
								>
									<Calendar className="size-4" />
									Start {formatDay(freeFrom)}
								</Button>
							</AlertDescription>
						</Alert>
					</div>
				) : null}

				{rebuilds ? (
					<div className="border-t p-5">
						<Alert variant="destructive">
							<TriangleAlert className="size-4" />
							<AlertTitle>Changing the term rebuilds the ledger</AlertTitle>
							<AlertDescription>
								{account?.charge_count} charges exist against the saved term.
								Saving removes its rent charges and creates {periods.length} in
								their place. One-off charges are untouched. Nothing has been
								paid, so this is allowed.
							</AlertDescription>
						</Alert>
					</div>
				) : null}

				{locked ? (
					<div className="bg-muted flex flex-wrap items-center gap-3 border-t p-5">
						<Lock className="text-muted-foreground size-4 shrink-0" />
						<p className="text-muted-foreground flex-1 text-xs">
							Fixed — rent has been collected against this term. Ending it early
							is a termination on the lease, not an edit here.
						</p>
					</div>
				) : null}

				{!readonly ? (
					<div className="flex justify-end gap-2 border-t p-5">
						{dirty ? (
							<Button
								variant="outline"
								disabled={isPending}
								onClick={() => {
									setDate(savedDate)
									setDuration(savedDuration ?? 12)
								}}
							>
								Discard
							</Button>
						) : null}
						<Button
							disabled={!date || !dirty || clashes || isPending}
							onClick={() => (rebuilds ? setConfirmRebuild(true) : save())}
						>
							{isPending ? <Spinner /> : <Check className="size-4" />}
							{rebuilds ? 'Save and rebuild charges' : 'Save move-in'}
						</Button>
					</div>
				) : null}

				<AlertDialog open={confirmRebuild} onOpenChange={setConfirmRebuild}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Rebuild the rent charges?</AlertDialogTitle>
							<AlertDialogDescription>
								The {account?.charge_count ?? 0} charges on this application
								were worked out from the current move-in date and term. Saving
								replaces every rent charge with a new schedule. Charges you
								added yourself are kept, and nothing that has been billed is
								touched.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep current schedule</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									setConfirmRebuild(false)
									save()
								}}
							>
								Save and rebuild
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Card>

			<Card className="shadow-none">
				<CardContent>
					<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
						What this step hands on
					</p>
					<div className="mt-4 grid gap-6 sm:grid-cols-3">
						{HANDS_ON.map(([title, body]) => (
							<div key={title} className="flex gap-2.5">
								<ArrowRight className="text-muted-foreground mt-0.5 size-4 shrink-0" />
								<div>
									<p className="text-xs font-bold">{title}</p>
									<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
										{body}
									</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
