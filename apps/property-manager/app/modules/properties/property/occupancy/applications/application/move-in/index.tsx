import { useQueryClient } from '@tanstack/react-query'
import { Lock, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { AskDate } from './ask-date'
import { AskDuration } from './ask-duration'
import { TenancySummary } from './tenancy-summary'
import { TermBar } from './term-bar'
import { useUnitAvailability } from './use-unit-availability'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
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
import { Card, CardContent } from '~/components/ui/card'
import { QUERY_KEYS } from '~/lib/constants'
import { pronounsFor } from '~/lib/pronouns'
import type { PaymentFrequency } from '~/lib/schedule'
import { buildSchedule, termEndDate } from '~/lib/schedule'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

const sameDay = (a: Nullable<Date>, b: Nullable<Date>) =>
	(a?.toDateString() ?? null) === (b?.toDateString() ?? null)

export function PropertyTenantApplicationMoveIn() {
	// This page sits outside the `_step` layout — own header, own rail.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const application = loaderData?.tenantApplication

	const { clientUser } = useClient()
	const revalidator = useRevalidator()
	const { isPending, mutate } = useAdminUpdateTenantApplication()
	const queryClient = useQueryClient()
	const [confirmRebuild, setConfirmRebuild] = useState(false)

	const unit = application?.desired_unit
	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(unit?.property_id)
	const account = application?.financial_account
	const pronouns = pronounsFor(application?.gender)
	const applicantName = application?.first_name ?? 'the applicant'
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application?.id}`

	// M1 — the term is fixed once anything has been BILLED, not merely paid:
	// changing it re-derives the rent charges, and the backend refuses that with
	// ChargesAlreadyBilled the moment a charge is on an invoice.
	//
	// Read the server's own flag rather than inferring it. `total_settled > 0`
	// and `invoice_count > 0` are both account-wide, so an invoice covering only
	// a deposit locked the move-in date even though the service would have
	// allowed the change.
	const locked = Boolean(account?.rent_terms_locked)
	const readonly =
		application?.status !== 'TenantApplication.Status.InProgress' || locked

	// M2 — frequency is not a decision on this step. It comes from the unit
	// alongside the currency, which is why the old "Stay Duration Frequency"
	// select was permanently disabled.
	const frequency = (application?.stay_duration_frequency ??
		unit?.payment_frequency ??
		'MONTHLY') as PaymentFrequency

	const savedDate = application?.desired_move_in_date
		? new Date(application.desired_move_in_date)
		: null
	const savedDuration = application?.stay_duration ?? null

	const [date, setDate] = useState<Nullable<Date>>(savedDate)
	const [duration, setDuration] = useState(savedDuration ?? 6)

	// M3 — capacity-aware: consults max_occupants_allowed, and the slot is
	// freed by the Nth earliest-ending lease.
	const { freeFrom, occupant } = useUnitAvailability(
		clientId,
		propertyId,
		safeString(unit?.id),
		safeString(application?.id),
		unit?.max_occupants_allowed,
	)
	const clashes = Boolean(date && freeFrom && freeFrom > date)

	// M7 — the rent the term is priced at: the agreed figure once it exists,
	// otherwise the unit's listing, which is all financial setup has to offer.
	const rentAgreed = (application?.rent_fee ?? 0) > 0
	const rent = rentAgreed ? (application?.rent_fee ?? 0) : (unit?.rent_fee ?? 0)

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
	// M4 — changing the term after charges exist removes every rent charge and
	// builds new ones. Allowed while nothing is billed — but never silently.
	const rebuilds = dirty && !locked && (account?.charge_count ?? 0) > 0

	const save = () => {
		if (!date) return
		mutate(
			{
				client_id: clientId,
				id: safeString(application?.id),
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
							? 'Dates saved and payments worked out again.'
							: 'Dates saved.',
					)
					// M5 — the ledger is rebuilt server-side, so everything derived
					// from it has to be refetched without a reload.
					void revalidator.revalidate()
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				},
				onError: (error: Error) => {
					// M6 — a payment landed while this was being edited.
					toast.error(
						error.message === 'ChargesAlreadyBilled'
							? 'A payment was collected while you were editing. The dates are now fixed.'
							: 'Could not save the dates. Please try again.',
					)
					void revalidator.revalidate()
				},
			},
		)
	}

	if (!application || !unit) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const { title, pill, pillTone } = ((): {
		title: string
		pill: string
		pillTone: StepPill
	} => {
		if (readonly)
			return {
				title: `${applicantName}’s dates`,
				pill: 'Fixed',
				pillTone: 'fixed',
			}
		if (clashes)
			return {
				title: `When is ${applicantName} moving in?`,
				pill: 'Needs a later date',
				pillTone: 'attention',
			}
		return {
			title: `When is ${applicantName} moving in?`,
			pill: date ? 'Done' : 'Step 3 of 5',
			pillTone: date ? 'done' : 'step',
		}
	})()

	const subtitle = readonly
		? 'Rent has been collected against this term, so the dates are fixed.'
		: clashes
			? 'The unit is not empty on that date yet.'
			: date
				? 'Change either answer and everything below follows.'
				: 'Two answers and this step is done.'

	const settled = Boolean(date) && !clashes && !dirty

	return (
		<div className="m-5">
			<StepPageHeader
				title={title}
				subtitle={subtitle}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
				nextHref={settled ? `${baseUrl}/financial` : undefined}
				nextLabel={settled ? 'Next: rent & payments' : undefined}
			/>

			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
					{rebuilds ? (
						<Alert variant="destructive">
							<TriangleAlert className="size-4" />
							<AlertTitle>
								The payment dates will be worked out again
							</AlertTitle>
							<AlertDescription>
								{applicantName} already has {account?.charge_count} charges
								lined up from the saved dates. Saving throws those away and
								makes them again from scratch. Nothing has been paid, so that is
								safe — but any fee you added by hand stays where it is.
							</AlertDescription>
						</Alert>
					) : null}

					{locked ? (
						<Alert>
							<Lock className="size-4" />
							<AlertTitle>These dates can&rsquo;t change now</AlertTitle>
							<AlertDescription>
								Rent has been collected against this term. Ending it early is a
								termination on the lease, not an edit here.
							</AlertDescription>
						</Alert>
					) : null}

					<Card className="shadow-none">
						<CardContent>
							<AskDate
								value={date}
								onChange={setDate}
								freeFrom={freeFrom}
								occupant={occupant}
								blocked={clashes}
								readonly={readonly}
								applicantName={applicantName}
								pronouns={pronouns}
							/>
							<AskDuration
								value={duration}
								onChange={setDuration}
								frequency={frequency}
								readonly={readonly}
								dim={!date}
							/>
						</CardContent>
					</Card>

					{date && end ? (
						<Card className="shadow-none">
							<CardContent>
								<p className="mb-4 text-lg font-bold">
									{clashes ? 'What you’ve set at the moment' : 'The tenancy'}
								</p>
								<TermBar
									start={date}
									end={end}
									duration={duration}
									frequency={frequency}
									periods={periods}
									blocked={clashes}
								/>
							</CardContent>
						</Card>
					) : null}
				</div>

				<div className="col-span-12 lg:col-span-4">
					<TenancySummary
						start={date}
						end={end}
						duration={duration}
						frequency={frequency}
						periods={periods}
						blocked={clashes}
						freeFrom={freeFrom}
						occupant={occupant}
						applicantName={applicantName}
						pronouns={pronouns}
						readonly={readonly}
						dirty={dirty && Boolean(savedDate)}
						saving={isPending}
						canSave={Boolean(date) && dirty && !clashes}
						onSave={() => (rebuilds ? setConfirmRebuild(true) : save())}
					/>
				</div>
			</div>

			<AlertDialog open={confirmRebuild} onOpenChange={setConfirmRebuild}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Rebuild the rent charges?</AlertDialogTitle>
						<AlertDialogDescription>
							The {account?.charge_count ?? 0} charges on this application were
							worked out from the current move-in date and term. Saving replaces
							every rent charge with a new schedule. Charges you added yourself
							are kept, and nothing that has been billed is touched.
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
		</div>
	)
}
