import { useTenantApplicationContext } from '../context'
import { MoveInGate } from './move-in-gate'
import { SummaryBar } from './summary-bar'
import { useGetFinancialAccount } from '~/api/financial-accounts'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export type FinancialMode =
	| 'blocked'
	| 'setup'
	| 'live'
	| 'locked'
	| 'readonly'

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

	// Any charge that has been invoiced or settled freezes the rent terms —
	// RederiveRent returns 400 ChargesAlreadyBilled from that point on.
	const billed = summary.charges.some(
		(charge) => charge.invoiced_amount !== 0 || charge.settled_amount !== 0,
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

	const { data: summary } = useGetFinancialAccount(
		clientId,
		propertyId,
		accountId,
	)

	const mode = resolveMode(tenantApplication, summary ?? null)

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

			{/*
			 * Sections land in Tasks 6-10:
			 *   1  AgreedRent      2  Schedule (preview | ledger)
			 *   3  CollectionPlan  4  Collect
			 */}
		</div>
	)
}
