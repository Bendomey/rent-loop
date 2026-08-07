import { useState } from 'react'
import { nextIssue, overdueTotal } from './account'
import { BalanceStrip } from './balance-strip'
import { ChargesPanel } from './charges-panel'
import { ComposeDialog } from './compose-dialog'
import { InvoicesPanel } from './invoices-panel'
import { PayDialog } from './pay-dialog'
import { SchedulePanel } from './schedule-panel'
import { useGetFinancialAccount } from '~/api/financial-accounts'
import { useGetInvoices } from '~/api/invoices'
import { AddChargeDialog } from '~/components/blocks/financials/add-charge-dialog'
import { RemoveChargeDialog } from '~/components/blocks/financials/remove-charge-dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

interface LeaseFinancialsTabProps {
	lease: Lease
	clientId: string
	propertyId: string
}

/**
 * A lease collects for a year or more, so this is a running account rather
 * than the application's one-time setup flow. Top to bottom it answers: what
 * is owed now, what has been billed, what will be billed.
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
	const [composeOpen, setComposeOpen] = useState(false)
	const [removing, setRemoving] = useState<Nullable<ChargeInstance>>(null)

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
		// wholly unpaid and the overdue figure is overstated.
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

	return (
		<div className="space-y-4">
			<BalanceStrip summary={summary} invoices={invoices} />

			<InvoicesPanel
				invoices={invoices}
				currency={summary.account.currency}
				propertyId={propertyId}
				onPay={setPaying}
			/>

			<ChargesPanel
				summary={summary}
				onAdd={() => setAddOpen(true)}
				onRemove={setRemoving}
				onPayCharges={() => setComposeOpen(true)}
			/>

			<SchedulePanel
				summary={summary}
				invoices={invoices}
				clientId={clientId}
				propertyId={propertyId}
			/>

			<ComposeDialog
				open={composeOpen}
				summary={summary}
				clientId={clientId}
				propertyId={propertyId}
				onClose={() => setComposeOpen(false)}
				onIssued={setPaying}
			/>
			<PayDialog
				invoice={paying}
				clientId={clientId}
				propertyId={propertyId}
				currency={summary.account.currency}
				onClose={() => setPaying(null)}
			/>
			<AddChargeDialog
				open={addOpen}
				accountId={summary.account.id}
				clientId={clientId}
				propertyId={propertyId}
				currency={summary.account.currency}
				defaultDueDate={new Date().toISOString()}
				// So "it waits" can name the date it waits for, rather than being a
				// vague promise the landlord has to go and verify.
				nextIssueOn={
					nextIssue(
						summary.charges,
						summary.account.auto_issue_days_before,
						summary.account.rent_billing_cadence,
					)?.issueOn ?? null
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
		</div>
	)
}

/** The tab carries a dot while anything is overdue. */
export const hasOverdue = (invoices: Invoice[]) => overdueTotal(invoices) > 0
