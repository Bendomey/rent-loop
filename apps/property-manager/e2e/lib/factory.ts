/**
 * Composite builders for the state a case needs before it starts.
 *
 * Individual API calls live in api.ts; this file assembles them into the
 * multi-step setups that more than one case needs, so the sequence — and the
 * non-obvious ordering constraints in it — is written down once.
 */
import {
	type Application,
	type Unit,
	createApplication,
	createUnit,
	prepareCharges,
	setApplicationTerms,
} from './api'
import { type RunState, tag, uniquePhone } from './state'

export interface ApprovableApplication {
	unit: Unit
	application: Application
	rentFee: number
	stayDuration: number
}

/**
 * A unit plus an application that the UI will actually let you approve.
 *
 * Three things must all be true, and only the first is obvious:
 *   1. every personal field ApproveTenantApplication checks is populated
 *   2. rent, move-in date and stay duration are set — creation does not carry
 *      them, and approval rejects with ApplicationMissingRentDetails without
 *   3. charges have been prepared — the API would approve without them, but the
 *      Approve button stays disabled until the Financial setup step reports
 *      charges
 *
 * `seq` keeps phone numbers and ID numbers distinct when one case builds more
 * than one application.
 */
export async function makeApprovableApplication(
	s: RunState,
	label: string,
	opts: { rentFee?: number; stayDuration?: number; seq?: number } = {},
): Promise<ApprovableApplication> {
	const rentFee = opts.rentFee ?? 50_000
	const stayDuration = opts.stayDuration ?? 12
	const seq = opts.seq ?? 1

	const unit = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, label),
		rentFee,
	})

	const application = await createApplication(
		s.token,
		s.clientId,
		s.propertyId,
		{
			unitId: unit.id,
			firstName: 'E2E',
			lastName: `${label}${s.runId}`,
			phone: uniquePhone(s.runId, seq),
			approvable: true,
			email: `e2e-${s.runId}-${label}@example.com`,
			idNumber: `GHA-${s.runId}-${label}`,
		},
	)

	await setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
		rentFee,
		// Tomorrow: a move-in date in the past makes the first rent charge
		// immediately overdue, which changes what the financials screens show.
		moveInDate: new Date(Date.now() + 86_400_000).toISOString(),
		stayDuration,
	})

	await prepareCharges(s.token, s.clientId, s.propertyId, application.id)

	return { unit, application, rentFee, stayDuration }
}
