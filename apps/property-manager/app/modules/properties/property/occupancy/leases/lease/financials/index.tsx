import { useState } from 'react'
import { nextIssue, overdueTotal } from './account'
import { AddFeeDialog } from './add-fee-dialog'
import { CollectDialog } from './collect-dialog'
import { MoneyHero } from './money-hero'
import { MoneyList } from './money-list'
import { MoneyRail } from './money-rail'
import { PaidAlreadyDialog } from './paid-already-dialog'
import { PayDialog } from './pay-dialog'
import { useGetFinancialAccount } from '~/api/financial-accounts'
import { useGetInvoices } from '~/api/invoices'
import { RemoveChargeDialog } from '~/components/blocks/financials/remove-charge-dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { deriveLeaseMoney } from '~/lib/lease-money'
import { safeString } from '~/lib/strings'

interface LeaseFinancialsTabProps {
	lease: Lease
	clientId: string
	propertyId: string
}

/**
 * A lease collects for a year or more, so this is a running account rather
 * than the application's one-time setup flow.
 *
 * It answers one question — how are we doing with this tenant's rent — in
 * three figures, then shows everything they owe as a single listing. Bills and
 * charges used to be two lists that double-counted the same money.
 */
export function LeaseFinancialsTab({
	lease,
	clientId,
	propertyId,
}: LeaseFinancialsTabProps) {
	// The lease carries its own account, resolved by lease_id. Reaching through
	// tenant_application does not work: that object's financial_account is a
	// computed view the service attaches, so a preloaded application has none.
	const accountId = lease.financial_account?.id ?? null

	const [paying, setPaying] = useState<Nullable<Invoice>>(null)
	const [addOpen, setAddOpen] = useState(false)
	const [removing, setRemoving] = useState<Nullable<ChargeInstance>>(null)
	// The fee just added, held while we ask whether it is already paid for.
	const [justAdded, setJustAdded] = useState<Nullable<ChargeInstance>>(null)
	/*
	 * Charges being collected for directly, because no bill has gone out for
	 * them. Either the one fee just added, or — when "they paid me" is pressed
	 * with nothing billed — everything unbilled, for the landlord to tick.
	 *
	 * Empty means closed. `collectOpen` is separate so the list can be read
	 * from live data while the dialog is up without the dialog closing itself
	 * the moment those charges become billed.
	 */
	const [collecting, setCollecting] = useState<ChargeInstance[]>([])
	const [collectOpen, setCollectOpen] = useState(false)

	const { data: summary, isPending } = useGetFinancialAccount(
		clientId,
		propertyId,
		accountId,
	)
	const { data: invoicePage } = useGetInvoices(clientId, propertyId, {
		pagination: { page: 1, per: 200 },
		filters: { financial_account_id: accountId ?? undefined },
		// Payments is not optional: the balance on every row is total_amount less
		// the SUCCESSFUL payments, so without it a part-paid invoice reads as
		// wholly unpaid and the overdue figure is overstated. LineItems carry the
		// charge_instance_id the merged listing joins on.
		populate: ['LineItems', 'Payments'],
	})

	// Voided invoices are not part of the account's story — the charges they
	// claimed are released back to the ledger.
	const invoices = (invoicePage?.rows ?? [])
		.filter((invoice) => invoice.status !== 'VOID')
		.sort(
			(a, b) =>
				Date.parse(b.created_at as never) - Date.parse(a.created_at as never),
		)

	// No status gate. An account outlives the lease's Active window — a pending
	// lease already has charges from the application, and a terminated one can
	// still be owed arrears — and every one of these actions is enforced by the
	// API against the account, not the lease.
	// A ledger still loading is not a ledger that doesn't exist — saying so
	// would tell the landlord their charges are gone for as long as the request
	// takes.
	if (accountId && (isPending || !summary)) {
		return (
			<Card className="shadow-none">
				<CardContent className="flex justify-center py-10">
					<Spinner />
				</CardContent>
			</Card>
		)
	}

	if (!accountId || !summary) {
		return (
			<Card className="shadow-none">
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground text-sm">
						This lease has no financial account. Accounts are built during the
						application&apos;s financial setup and carried onto the lease.
					</p>
				</CardContent>
			</Card>
		)
	}

	const money = deriveLeaseMoney(summary, invoices, new Date(), lease.id)
	// Null on a MANUAL account: the sweep skips it entirely, so there is no
	// next bill to name. "Whole term up front" stores MANUAL too.
	const next = nextIssue(
		// Scoped, not summary.charges: an unbilled charge on the previous term
		// would otherwise be announced as this term's next bill.
		money.charges,
		summary.account.auto_issue_days_before,
		summary.account.rent_billing_cadence,
	)

	const tenantName = safeString(lease.tenant?.first_name) || 'The tenant'
	// Terminated tenancies are a record: the money still reads, but there is
	// nothing left to change about how it is collected.
	const readonly = lease.status === 'Lease.Status.Terminated'

	return (
		<div className="grid grid-cols-12 gap-4">
			<div className="col-span-12 flex flex-col gap-4 xl:col-span-8">
				<MoneyHero
					money={money}
					nextIssue={next}
					currency={summary.account.currency}
					tenantName={tenantName}
					readonly={readonly}
					/*
					 * Always the charge picker, never a bill. Someone handing over
					 * money is paying for rent or a repair — whether Rentloop has
					 * sent a bill for it yet is an internal detail they know nothing
					 * about. Money against a bill already sent is recorded on that
					 * bill, from its own row in the listing below.
					 *
					 * This also kills the dead button: it used to target the oldest
					 * unpaid bill and open nothing at all when there wasn't one,
					 * which is every tenancy before its first sweep.
					 */
					onPay={() => {
						setCollecting([...money.comingFees, ...money.comingRent])
						setCollectOpen(true)
					}}
					onAddFee={() => setAddOpen(true)}
				/>

				<MoneyList
					money={money}
					nextIssue={next}
					currency={summary.account.currency}
					tenantName={tenantName}
					readonly={readonly}
					onPay={setPaying}
					onAddFee={() => setAddOpen(true)}
					onRemoveFee={setRemoving}
				/>
			</div>

			<div className="col-span-12 xl:col-span-4">
				<MoneyRail
					summary={summary}
					money={money}
					nextIssue={next}
					tenantName={tenantName}
					tenantPhone={lease.tenant?.phone ?? null}
					tenantEmail={lease.tenant?.email ?? null}
					readonly={readonly}
					clientId={clientId}
					propertyId={propertyId}
				/>
			</div>

			<PayDialog
				invoice={paying}
				clientId={clientId}
				propertyId={propertyId}
				currency={summary.account.currency}
				tenantName={tenantName}
				onClose={() => setPaying(null)}
			/>
			<AddFeeDialog
				open={addOpen}
				accountId={summary.account.id}
				clientId={clientId}
				propertyId={propertyId}
				currency={summary.account.currency}
				tenantName={tenantName}
				// So the fee's fate can name the date it waits for, rather than
				// being a vague promise the landlord has to go and verify.
				nextIssueOn={next?.issueOn ?? null}
				onClose={() => setAddOpen(false)}
				onAdded={setJustAdded}
			/>
			<PaidAlreadyDialog
				charge={justAdded}
				currency={summary.account.currency}
				tenantName={tenantName}
				nextIssueOn={next?.issueOn ?? null}
				onCollect={() => {
					if (justAdded) {
						setCollecting([justAdded])
						setCollectOpen(true)
					}
					setJustAdded(null)
				}}
				onClose={() => setJustAdded(null)}
			/>
			<CollectDialog
				charges={collecting}
				open={collectOpen}
				accountId={summary.account.id}
				clientId={clientId}
				propertyId={propertyId}
				currency={summary.account.currency}
				tenantName={tenantName}
				// The fee flow arrives here from "yes, they've paid" — so what it
				// is collecting for is already settled, not a question.
				preselect={collecting.length === 1}
				// Only the fee flow has somewhere to go back to.
				onBack={
					collecting.length === 1
						? () => {
								setJustAdded(collecting[0]!)
								setCollectOpen(false)
								setCollecting([])
							}
						: undefined
				}
				onClose={() => {
					setCollectOpen(false)
					setCollecting([])
				}}
			/>
			<RemoveChargeDialog
				charge={removing}
				accountId={summary.account.id}
				clientId={clientId}
				propertyId={propertyId}
				onClose={() => setRemoving(null)}
			/>
		</div>
	)
}

/** The tab carries a dot while anything is overdue. */
export const hasOverdue = (invoices: Invoice[]) => overdueTotal(invoices) > 0
