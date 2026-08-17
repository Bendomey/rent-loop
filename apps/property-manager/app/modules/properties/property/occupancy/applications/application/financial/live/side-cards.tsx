import { useQueryClient } from '@tanstack/react-query'
import { Lock, Pencil, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { PERIOD_NOUN } from '../../move-in/term'
import { useUpdateBillingPolicy } from '~/api/financial-accounts'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { type CollectionChoice, cadenceForChoice } from '~/lib/cadence'
import { QUERY_KEYS } from '~/lib/constants'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import type { Pronouns } from '~/lib/pronouns'
import type { PaymentFrequency } from '~/lib/schedule'
import { cn } from '~/lib/utils'

const PLAN_WORDS: Record<CollectionChoice, (noun: string) => string> = {
	monthly: (noun) => `every ${noun}`,
	quarterly: () => 'every three months',
	'whole-term': () => 'once, for the whole term',
	manual: () => 'only when you send one',
}

/**
 * The two things a landlord asks after setup: when do bills go out, and can I
 * still change the rent.
 *
 * Both state the rule together with the way around it. A restriction with its
 * reason removed reads as an obstacle; with the alternative attached it reads
 * as an answer.
 *
 * Both edit in place rather than sending you somewhere: these are the only two
 * things still changeable here, and a link out to find them would be a longer
 * road to a smaller change.
 */
export function SideCards({
	choice,
	leadDays,
	rentMinor,
	currency,
	frequency,
	applicantName,
	pronouns,
	rentLocked,
	readonly,
	clientId,
	propertyId,
	accountId,
	applicationId,
	charges,
	onRefund,
}: {
	choice: CollectionChoice
	leadDays: number
	rentMinor: number
	currency: string
	frequency: PaymentFrequency
	applicantName: string
	pronouns: Pronouns
	rentLocked: boolean
	readonly: boolean
	clientId: string
	propertyId: string
	accountId: string
	applicationId: string
	charges: ChargeInstance[]
	/** Absent once approved — refunds are a lease matter from then on. */
	onRefund?: () => void
}) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const updatePolicy = useUpdateBillingPolicy()
	const updateApplication = useAdminUpdateTenantApplication()

	const [editingPlan, setEditingPlan] = useState(false)
	const [editingRent, setEditingRent] = useState(false)
	const [draftRent, setDraftRent] = useState(
		String(convertPesewasToCedis(rentMinor)),
	)

	const noun = PERIOD_NOUN[frequency]
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	// Only charges no invoice has claimed can go on a future one, so the plan
	// is quoted from those rather than from the whole ledger.
	const unclaimed = charges.filter(
		(charge) => !charge.voided_at && charge.amount - charge.invoiced_amount > 0,
	)
	const unbilledRent = unclaimed.filter(
		(charge) => charge.category === 'RENT',
	).length
	const unbilledFeeCount = unclaimed.filter(
		(charge) => charge.category !== 'RENT',
	).length
	const unbilledFees = unclaimed
		.filter((charge) => charge.category !== 'RENT')
		.reduce(
			(sum, charge) => sum + (charge.amount - charge.invoiced_amount),
			0,
		)

	const refresh = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
		void revalidator.revalidate()
	}

	const savePlan = (next: CollectionChoice) => {
		updatePolicy.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: accountId,
				// F3/F4 — the mapping lives in ~/lib/cadence.ts and is never
				// reconstructed inline.
				data: {
					...cadenceForChoice(next),
					auto_issue_days_before: leadDays,
				},
			},
			{
				onSuccess: () => {
					toast.success('Saved.')
					setEditingPlan(false)
					refresh()
				},
				onError: () => toast.error('Could not save that. Please try again.'),
			},
		)
	}

	const saveRent = () => {
		const minor = convertCedisToPesewas(
			Number.parseFloat(draftRent.replace(/,/g, '')) || 0,
		)
		if (minor <= 0) return
		updateApplication.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				id: applicationId,
				data: { rent_fee: minor },
			},
			{
				onSuccess: () => {
					toast.success('Rent saved. The payment dates were worked out again.')
					setEditingRent(false)
					refresh()
				},
				onError: (error: Error) => {
					// The server rolls the application back with the charges, so
					// nothing is half-applied — the figure on screen is simply stale.
					toast.error(
						error.message === 'ChargesAlreadyBilled'
							? 'A payment was collected while you were editing. The rent is fixed now.'
							: 'Could not save the rent. Please try again.',
					)
					refresh()
				},
			},
		)
	}

	// Each option says what it would actually do, not just what it is called.
	// The first bill is never rent alone — every fee already due rides along
	// with it — so quoting the rent by itself would understate what the tenant
	// is about to be asked for.
	const planOptions: Array<[CollectionChoice, string, string]> = [
		[
			'monthly',
			`Every ${noun}`,
			`${unbilledRent} bills · first ${money(rentMinor + unbilledFees)}, then ${money(rentMinor)}`,
		],
		[
			'quarterly',
			'Every three months',
			`${Math.ceil(unbilledRent / 3) || 1} bills · first ${money(rentMinor * Math.min(3, unbilledRent) + unbilledFees)}, then ${money(rentMinor * 3)}`,
		],
		[
			'whole-term',
			'The whole term at once',
			`1 bill · ${unbilledRent + unbilledFeeCount} payments · ${money(rentMinor * unbilledRent + unbilledFees)}`,
		],
		['manual', 'I’ll send bills myself', 'Nothing goes out automatically'],
	]

	return (
		<div className="flex flex-col gap-4">
			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">How the bills go out</p>
					<p className="mt-2.5 text-sm leading-relaxed">
						{choice === 'manual' ? (
							<>
								Nothing goes out on its own — you send {applicantName} a bill
								when you want one.
							</>
						) : (
							<>
								We email {applicantName} a bill{' '}
								<b>{PLAN_WORDS[choice](noun)}</b>, {leadDays} days before
								it&rsquo;s due.
							</>
						)}
					</p>

					{editingPlan ? (
						<div className="mt-3 flex flex-col gap-2">
							{planOptions.map(([option, label, sub]) => (
								<Button
									key={option}
									variant={choice === option ? 'default' : 'outline'}
									size="sm"
									className="h-auto flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
									disabled={updatePolicy.isPending}
									onClick={() => savePlan(option)}
								>
									<span className="font-semibold">{label}</span>
									<span
										className={cn(
											'text-xs font-normal',
											choice === option
												? 'opacity-80'
												: 'text-muted-foreground',
										)}
									>
										{sub}
									</span>
								</Button>
							))}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditingPlan(false)}
							>
								Cancel
							</Button>
						</div>
					) : !readonly ? (
						<Button
							variant="ghost"
							size="sm"
							className="text-primary mt-3 -ml-2"
							onClick={() => setEditingPlan(true)}
						>
							<Pencil className="size-3.5" />
							Change how often
						</Button>
					) : null}
				</CardContent>
			</Card>

			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">Changing the rent</p>
					<p className="mt-2.5 text-sm leading-relaxed">
						{rentLocked ? (
							// The contract string three e2e cases assert on.
							<>
								Rent is fixed now — some of it has already been billed. To
								charge {applicantName} something different, add a fee instead.
							</>
						) : (
							<>
								You can still change it — <b>{money(rentMinor)}</b> a {noun} —
								until {applicantName}&rsquo;s first payment comes in. After
								that it&rsquo;s fixed, and you&rsquo;d add a fee instead.
							</>
						)}
					</p>

					{rentLocked ? (
						<>
							{/*
							 * The way out, but only while there is one. Once the
							 * application is approved this is a lease matter, so offering
							 * a refund here would send the landlord somewhere that can no
							 * longer help them.
							 *
							 * Rent locks on a *billed* charge, which may or may not have
							 * been paid — so the note names both routes rather than
							 * assuming money changed hands.
							 */}
							{!readonly ? (
								<div className="bg-muted/50 mt-3 rounded-lg p-3">
									<p className="text-sm leading-relaxed">
										To change it, undo what has been billed first: refund
										anything {applicantName} has paid, and void the bill it
										was on.
									</p>
									{onRefund ? (
										<Button
											variant="outline"
											size="sm"
											className="mt-2.5"
											onClick={onRefund}
										>
											<Undo2 className="size-3.5" />
											Refund a payment
										</Button>
									) : null}
								</div>
							) : null}
							<p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm font-semibold">
								<Lock className="size-3.5" />
								Fixed
							</p>
						</>
					) : editingRent ? (
						<div className="mt-3">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm font-semibold">
									{currency}
								</span>
								<Input
									id="change-rent"
									inputMode="decimal"
									className="w-32 font-semibold"
									value={draftRent}
									onChange={(event) => setDraftRent(event.target.value)}
								/>
							</div>
							<p className="text-muted-foreground mt-2 text-xs leading-relaxed">
								Saving works the payment dates out again from the new figure.
								Fees you added by hand stay where they are.
							</p>
							<div className="mt-3 flex gap-2">
								<Button
									size="sm"
									disabled={updateApplication.isPending}
									onClick={saveRent}
								>
									{updateApplication.isPending ? <Spinner /> : null}
									Save the new rent
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEditingRent(false)}
								>
									Cancel
								</Button>
							</div>
						</div>
					) : !readonly ? (
						<Button
							variant="ghost"
							size="sm"
							className={cn('text-primary mt-3 -ml-2')}
							onClick={() => {
								setDraftRent(String(convertPesewasToCedis(rentMinor)))
								setEditingRent(true)
							}}
						>
							<Pencil className="size-3.5" />
							Change the rent
						</Button>
					) : null}
				</CardContent>
			</Card>
		</div>
	)
}
