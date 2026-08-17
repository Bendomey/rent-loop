import { useState } from 'react'
import { useRouteLoaderData } from 'react-router'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { AddFeeDialog } from './dialogs/add-fee'
import { RecordPaymentDialog } from './dialogs/record-payment'
import { RefundDialog } from './dialogs/refund'
import { OwedHeader } from './live/owed-header'
import { SideCards } from './live/side-cards'
import { WhatTheyrePaying } from './live/what-theyre-paying'
import { MoveInGate } from './move-in-gate'
import { AskBilling } from './setup/ask-billing'
import { AskFees, type MoveInFee } from './setup/ask-fees'
import { AskRent } from './setup/ask-rent'
import { PlainSummary } from './setup/plain-summary'
import { useStartBilling } from './setup/use-start-billing'
import { useGetFinancialAccount } from '~/api/financial-accounts'
import { deriveAccountView } from '~/lib/account-view'
import { RemoveChargeDialog } from '~/components/blocks/financials/remove-charge-dialog'
import { Card, CardContent } from '~/components/ui/card'
import { type CollectionChoice, choiceForPolicy } from '~/lib/cadence'
import { convertCedisToPesewas } from '~/lib/format-amount'
import { pronounsFor } from '~/lib/pronouns'
import type { PaymentFrequency } from '~/lib/schedule'
import { buildSchedule } from '~/lib/schedule'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

export type FinancialMode = 'blocked' | 'setup' | 'live' | 'locked' | 'readonly'

/**
 * Move-in setup supplies three of the six fields charges:prepare needs, so
 * without it the server refuses. The agreed rent is the fourth and is null on a
 * new application — which is what makes the rent field the gate rather than a
 * convenience.
 */
const moveInComplete = (application: TenantApplication) =>
	Boolean(
		application.desired_move_in_date &&
			application.stay_duration &&
			application.stay_duration_frequency,
	)

export const resolveMode = (
	application: TenantApplication,
	summary: Nullable<AccountSummary>,
): FinancialMode => {
	if (application.status === 'TenantApplication.Status.Completed')
		return 'readonly'
	if (!moveInComplete(application)) return 'blocked'
	if (!application.financial_account || !summary) return 'setup'

	// F1 — a billed *rent* charge freezes the terms. Scoped to rent because only
	// rent derives from the move-in date and unit; this previously looked at
	// every charge, which locked rent as soon as a deposit was billed even
	// though the service would still have allowed the change.
	const billed = summary.charges.some(
		(charge) =>
			charge.category === 'RENT' &&
			(charge.invoiced_amount !== 0 || charge.settled_amount !== 0),
	)
	return billed ? 'locked' : 'live'
}

export function PropertyTenantApplicationFinancial() {
	// This page sits outside the `_step` layout — own header, own rail.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const application = loaderData?.tenantApplication
	const clientUserProperty = loaderData?.clientUserProperty
	const { clientUser } = useClient()

	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(clientUserProperty?.property_id)
	const accountId = application?.financial_account?.id ?? null
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application?.id}`

	// Removed fees stay on the record, so they are always fetched — the page
	// lists them separately rather than hiding them behind a toggle.
	const showVoided = true
	const [payOpen, setPayOpen] = useState(false)
	const [feeOpen, setFeeOpen] = useState(false)
	const [refundOpen, setRefundOpen] = useState(false)
	const [removing, setRemoving] = useState<Nullable<ChargeInstance>>(null)

	const { data: summary } = useGetFinancialAccount(
		clientId,
		propertyId,
		accountId,
		showVoided,
	)

	// Setup answers.
	const [rent, setRent] = useState('')
	const [fees, setFees] = useState<MoveInFee[]>([])
	const [choice, setChoice] = useState<CollectionChoice>('monthly')
	const { start, busy } = useStartBilling()

	const pronouns = pronounsFor(application?.gender)
	const applicantName = application?.first_name ?? 'the applicant'
	const unit = application?.desired_unit
	const currency = safeString(application?.rent_fee_currency || 'GHS')
	const frequency = (application?.stay_duration_frequency ??
		unit?.payment_frequency ??
		'MONTHLY') as PaymentFrequency

	if (!application) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const mode = resolveMode(application, summary ?? null)
	const readonly = mode === 'readonly'
	const rentLocked = mode === 'locked' || mode === 'readonly'

	const rentMinor = convertCedisToPesewas(
		Number.parseFloat(rent.replace(/,/g, '')) || 0,
	)
	const feeTotal = fees.reduce((sum, fee) => sum + fee.amount, 0)
	const periods =
		mode === 'setup' && application.desired_move_in_date
			? buildSchedule({
					rent: rentMinor,
					moveIn: application.desired_move_in_date,
					stayDuration: application.stay_duration ?? 12,
					stayFrequency: frequency,
					paymentFrequency: frequency,
				})
			: []

	const leadDays = summary?.account.auto_issue_days_before ?? 5
	const view = summary
		? deriveAccountView(summary, { asAt: new Date(), leadDays })
		: null
	const savedChoice = summary
		? choiceForPolicy(
				summary.account.rent_billing_cadence,
				summary.account.rent_billing_interval,
			)
		: 'monthly'
	const ledgerRent =
		summary?.charges.find(
			(charge) => charge.category === 'RENT' && !charge.voided_at,
		)?.amount ?? 0

	const { pill, pillTone } = ((): { pill: string; pillTone: StepPill } => {
		if (mode === 'blocked')
			return { pill: 'Waiting on the move-in date', pillTone: 'attention' }
		if (mode === 'setup') return { pill: 'Step 4 of 5', pillTone: 'step' }
		if (mode === 'live') return { pill: 'Done', pillTone: 'done' }
		return { pill: 'Fixed', pillTone: 'fixed' }
	})()

	const settled = mode === 'live' || rentLocked

	return (
		<div className="m-5">
			<StepPageHeader
				title="Rent &amp; payments"
				subtitle={
					mode === 'blocked'
						? `We can’t work out the rent dates yet.`
						: mode === 'setup'
							? `Decide what ${applicantName} pays and how often they’re billed. Nothing is sent to them yet.`
							: `${applicantName}’s bills go out on their own from here.`
				}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
				nextHref={settled ? `${baseUrl}/docs` : undefined}
				nextLabel={settled ? 'Next: lease papers' : undefined}
			/>

			{mode === 'blocked' ? (
				<MoveInGate
					propertyId={propertyId}
					applicationId={application.id}
					applicantName={applicantName}
					pronouns={pronouns}
				/>
			) : null}

			{mode === 'setup' ? (
				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-8">
						<Card className="shadow-none">
							<CardContent>
								<AskRent
									value={rent}
									onChange={setRent}
									unitRent={unit?.rent_fee ?? 0}
									unitName={unit?.name ?? 'The unit'}
									currency={currency}
									applicantName={applicantName}
									frequency={frequency}
								/>
								<AskFees
									fees={fees}
									onChange={setFees}
									rentMinor={rentMinor}
									currency={currency}
									applicantName={applicantName}
									pronouns={pronouns}
									dim={!rentMinor}
								/>
								<AskBilling
									value={choice}
									onChange={setChoice}
									rentMinor={rentMinor}
									feeTotal={feeTotal}
									periods={application.stay_duration ?? 12}
									currency={currency}
									frequency={frequency}
									applicantName={applicantName}
									dim={!rentMinor}
								/>
							</CardContent>
						</Card>
					</div>

					<div className="col-span-12 lg:col-span-4">
						<PlainSummary
							rentMinor={rentMinor}
							feeTotal={feeTotal}
							periods={periods}
							choice={choice}
							currency={currency}
							frequency={frequency}
							applicantName={applicantName}
							pronouns={pronouns}
							leadDays={leadDays}
							busy={busy}
							onStart={() =>
								void start({
									clientId,
									propertyId,
									applicationId: application.id,
									rentMinor,
									fees,
									choice,
									leadDays,
									currency,
									dueDate: new Date(
										application.desired_move_in_date as unknown as string,
									).toISOString(),
								})
							}
						/>
					</div>
				</div>
			) : null}

			{summary && view && mode !== 'setup' && mode !== 'blocked' ? (
				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
						<OwedHeader
							view={view}
							currency={summary.account.currency}
							applicantName={applicantName}
							pronouns={pronouns}
							readonly={readonly}
							autoIssues={savedChoice !== 'manual'}
							onRecordPayment={() => setPayOpen(true)}
							onAddFee={() => setFeeOpen(true)}
						/>
						<WhatTheyrePaying
							charges={summary.charges}
							currency={summary.account.currency}
							readonly={readonly}
							onRemove={setRemoving}
						/>
					</div>

					<div className="col-span-12 lg:col-span-4">
						<SideCards
							choice={savedChoice}
							leadDays={leadDays}
							rentMinor={ledgerRent}
							currency={summary.account.currency}
							frequency={frequency}
							applicantName={applicantName}
							rentLocked={rentLocked}
							readonly={readonly}
							clientId={clientId}
							propertyId={propertyId}
							accountId={summary.account.id}
							applicationId={application.id}
							charges={summary.charges}
						/>
					</div>
				</div>
			) : null}

			{summary ? (
				<>
					<RecordPaymentDialog
						open={payOpen}
						onOpenChange={setPayOpen}
						summary={summary}
						clientId={clientId}
						propertyId={propertyId}
						applicantName={applicantName}
					/>
					<AddFeeDialog
						open={feeOpen}
						onOpenChange={setFeeOpen}
						accountId={summary.account.id}
						clientId={clientId}
						propertyId={propertyId}
						currency={summary.account.currency}
						defaultDueDate={
							application.desired_move_in_date as unknown as string
						}
						applicantName={applicantName}
					/>
					<RefundDialog
						open={refundOpen}
						onOpenChange={setRefundOpen}
						summary={summary}
						clientId={clientId}
						propertyId={propertyId}
						applicantName={applicantName}
					/>
					<RemoveChargeDialog
						charge={removing}
						accountId={summary.account.id}
						clientId={clientId}
						propertyId={propertyId}
						onClose={() => setRemoving(null)}
					/>
				</>
			) : null}
		</div>
	)
}
