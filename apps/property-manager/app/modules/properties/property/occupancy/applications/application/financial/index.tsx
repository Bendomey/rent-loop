import { useState } from 'react'
import { useTenantApplicationContext } from '../context'
import { AgreedRent } from './agreed-rent'
import { Collect } from './collect'
import { CollectionPlan } from './collection-plan'
import { LockedStep } from './locked-step'
import { MoveInGate } from './move-in-gate'
import { Ledger } from './schedule/ledger'
import { SchedulePreview } from './schedule/preview'
import { SummaryBar } from './summary-bar'
import { useGetFinancialAccount } from '~/api/financial-accounts'
import { AddChargeDialog } from '~/components/blocks/financials/add-charge-dialog'
import { RemoveChargeDialog } from '~/components/blocks/financials/remove-charge-dialog'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

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

	// A billed *rent* charge freezes the terms — RederiveRent returns 400
	// ChargesAlreadyBilled from that point on. Scoped to rent because only rent
	// derives from the move-in date and unit; this previously looked at every
	// charge, which locked rent as soon as a deposit was billed even though the
	// service would still have allowed the change.
	const billed = summary.charges.some(
		(charge) =>
			charge.category === 'RENT' &&
			(charge.invoiced_amount !== 0 || charge.settled_amount !== 0),
	)
	return billed ? 'locked' : 'live'
}

export function PropertyTenantApplicationFinancial() {
	const { tenantApplication } = useTenantApplicationContext()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()

	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(clientUserProperty?.property_id)
	const accountId = tenantApplication.financial_account?.id ?? null

	// Owned here because the ledger toggles it and the query key depends on it.
	const [showVoided, setShowVoided] = useState(false)
	const [addOpen, setAddOpen] = useState(false)
	const [removing, setRemoving] = useState<Nullable<ChargeInstance>>(null)
	// Bumped when "whole term up front" is chosen — section 4 watches it and
	// selects every outstanding charge.
	const [collectAll, setCollectAll] = useState(0)

	const { data: summary } = useGetFinancialAccount(
		clientId,
		propertyId,
		accountId,
		showVoided,
	)

	const mode = resolveMode(tenantApplication, summary ?? null)

	// The rent the existing RENT charges were derived from. Reading it off the
	// ledger rather than the application means the rebuild warning compares what
	// is actually there against what is being typed.
	const rentCharges = (summary?.charges ?? []).filter(
		(charge) => charge.category === 'RENT' && !charge.voided_at,
	)
	const accountRent = rentCharges[0]?.amount ?? null
	const periods = rentCharges.length || (tenantApplication.stay_duration ?? 0)

	// Charges have to exist before there is a cadence to choose or money to take
	// against, so steps 3 and 4 open together with the ledger.
	const chargesExist =
		Boolean(summary) && mode !== 'setup' && mode !== 'blocked'

	return (
		<div className="space-y-4">
			{mode === 'blocked' ? (
				<MoveInGate
					propertyId={propertyId}
					applicationId={tenantApplication.id}
				/>
			) : null}

			{summary ? (
				<SummaryBar summary={summary} readonly={mode === 'readonly'} />
			) : null}

			{mode === 'blocked' ? (
				<LockedStep
					step={1}
					title="Agreed rent"
					hint="Needs the move-in date and stay duration. Those decide how many rent charges exist."
				/>
			) : (
				<AgreedRent
					mode={mode}
					application={tenantApplication}
					clientId={clientId}
					propertyId={propertyId}
					accountRent={accountRent}
					periods={periods}
				/>
			)}

			{mode === 'blocked' ? (
				<LockedStep
					step={2}
					title="Charges"
					hint="Set the move-in details and the agreed rent, and the charges appear here."
				/>
			) : null}

			{mode === 'setup' ? (
				<SchedulePreview
					application={tenantApplication}
					clientId={clientId}
					propertyId={propertyId}
				/>
			) : null}

			{chargesExist && summary ? (
				<Ledger
					summary={summary}
					readonly={mode === 'readonly'}
					showVoided={showVoided}
					onToggleVoided={() => setShowVoided(!showVoided)}
					onAdd={() => setAddOpen(true)}
					onRemove={setRemoving}
				/>
			) : null}

			{summary ? (
				<>
					<AddChargeDialog
						open={addOpen}
						accountId={summary.account.id}
						clientId={clientId}
						propertyId={propertyId}
						currency={summary.account.currency}
						defaultDueDate={
							tenantApplication.desired_move_in_date as unknown as string
						}
						onClose={() => setAddOpen(false)}
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

			{chargesExist && summary ? (
				<CollectionPlan
					summary={summary}
					clientId={clientId}
					propertyId={propertyId}
					readonly={mode === 'readonly'}
					onCollectEverything={() => setCollectAll(Date.now())}
				/>
			) : (
				<LockedStep
					step={3}
					title="Rent collection"
					hint="Choose how often rent is invoiced once the charges exist."
				/>
			)}

			{chargesExist && summary ? (
				<Collect
					summary={summary}
					clientId={clientId}
					propertyId={propertyId}
					readonly={mode === 'readonly'}
					collectAllSignal={collectAll}
				/>
			) : (
				<LockedStep
					step={4}
					title="Collect a payment"
					hint="Record the move-in money here once the charges exist — deposit, first rent, agency fee."
				/>
			)}
		</div>
	)
}
