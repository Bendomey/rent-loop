import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import type { MoveInFee } from './ask-fees'
import {
	useCreateCharge,
	usePrepareCharges,
	useUpdateBillingPolicy,
} from '~/api/financial-accounts'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { type CollectionChoice, cadenceForChoice } from '~/lib/cadence'
import { QUERY_KEYS } from '~/lib/constants'

export interface StartBillingInput {
	clientId: string
	propertyId: string
	applicationId: string
	/** Minor units. */
	rentMinor: number
	fees: MoveInFee[]
	choice: CollectionChoice
	leadDays: number
	currency: string
	/** Fees fall due when the tenant moves in. */
	dueDate: string
}

/**
 * "Save this and start billing" — four calls behind one button.
 *
 * The order is not a preference:
 *
 *   1. the agreed rent, because charges:prepare returns 400
 *      ApplicationMissingRentDetails without it;
 *   2. charges:prepare, which creates the rent charges and is ONE-WAY — a
 *      second call returns 400;
 *   3. each fee, independently — by now the rent charges exist, so a failure
 *      here is partial rather than total and must be reported as such;
 *   4. the billing policy, which needs the account id step 2 returns.
 *
 * Nothing is rolled back after step 2 succeeds, because prepare cannot be
 * undone. The landlord is told exactly what landed instead.
 */
export function useStartBilling() {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const updateApplication = useAdminUpdateTenantApplication()
	const prepare = usePrepareCharges()
	const createCharge = useCreateCharge()
	const updatePolicy = useUpdateBillingPolicy()
	const [busy, setBusy] = useState(false)

	const refresh = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
		void revalidator.revalidate()
	}

	const start = async (input: StartBillingInput) => {
		setBusy(true)

		// ── 1. the agreed rent ────────────────────────────────────────────────
		try {
			await updateApplication.mutateAsync({
				client_id: input.clientId,
				property_id: input.propertyId,
				id: input.applicationId,
				data: { rent_fee: input.rentMinor },
			})
		} catch {
			setBusy(false)
			toast.error('Could not save the rent. Nothing was created.')
			return
		}

		// ── 2. the rent charges. One-way — a second call is refused. ──────────
		let accountId: string
		try {
			const account = await prepare.mutateAsync({
				client_id: input.clientId,
				property_id: input.propertyId,
				application_id: input.applicationId,
			})
			accountId = account.id
		} catch (error) {
			setBusy(false)
			refresh()
			toast.error(
				(error as Error).message === 'ApplicationMissingRentDetails'
					? // Unreachable given step 1 — if this appears, the ordering above
						// has been broken.
						'Set the rent before starting billing.'
					: 'Could not work out the rent dates. Nothing was created.',
			)
			return
		}

		// ── 3. the fees, each on its own ──────────────────────────────────────
		const failed: string[] = []
		for (const fee of input.fees) {
			if (!fee.name.trim() || fee.amount <= 0) continue
			try {
				await createCharge.mutateAsync({
					client_id: input.clientId,
					property_id: input.propertyId,
					account_id: accountId,
					data: {
						name: fee.name.trim(),
						category: fee.category,
						amount: fee.amount,
						currency: input.currency,
						due_date: input.dueDate,
					},
				})
			} catch {
				failed.push(fee.name)
			}
		}

		// ── 4. how often the bills go out ─────────────────────────────────────
		let policyFailed = false
		try {
			await updatePolicy.mutateAsync({
				client_id: input.clientId,
				property_id: input.propertyId,
				account_id: accountId,
				data: {
					...cadenceForChoice(input.choice),
					auto_issue_days_before: input.leadDays,
				},
			})
		} catch {
			policyFailed = true
		}

		setBusy(false)
		refresh()

		// The rent charges exist either way, so say what landed rather than
		// implying the whole thing failed.
		if (failed.length > 0) {
			toast.error(
				`Rent is set up, but ${failed.length === 1 ? 'this fee' : 'these fees'} could not be added: ${failed.join(', ')}. Add ${failed.length === 1 ? 'it' : 'them'} again from the page.`,
			)
			return
		}
		if (policyFailed) {
			toast.error(
				'Rent is set up, but how often bills go out could not be saved. Set it from the page.',
			)
			return
		}
		toast.success('Saved. The bills go out on their own from here.')
	}

	return { start, busy }
}
