import { useQueryClient } from '@tanstack/react-query'
import { Check, Clock, Info, Minus, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { nextIssue, uninvoiced } from './account'
import { useUpdateBillingPolicy } from '~/api/financial-accounts'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import type { CollectionChoice } from '~/lib/cadence'
import { cadenceForChoice, choiceForPolicy } from '~/lib/cadence'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface SchedulePanelProps {
	summary: AccountSummary
	invoices: Invoice[]
	clientId: string
	propertyId: string
}

const day = (date: Date) =>
	date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

/**
 * How the rest of the term gets invoiced.
 *
 * The wording differs from the application's version of this control on
 * purpose: mid-term, "whole term up front" means the remainder, and the
 * invoices already issued keep their dates whatever is chosen here.
 */
export function SchedulePanel({
	summary,
	invoices,
	clientId,
	propertyId,
}: SchedulePanelProps) {
	const queryClient = useQueryClient()
	const { isPending, mutate } = useUpdateBillingPolicy()

	const [editing, setEditing] = useState(false)
	const [choice, setChoice] = useState<CollectionChoice>(
		choiceForPolicy(
			summary.account.rent_billing_cadence,
			summary.account.rent_billing_interval,
		),
	)
	const [days, setDays] = useState(summary.account.auto_issue_days_before)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const live = summary.charges.filter((c) => !c.voided_at)
	const openRent = live.filter(
		(c) => c.category === 'RENT' && uninvoiced(c) > 0,
	)
	const rentEach = openRent[0]?.amount ?? 0
	const months = openRent.length
	const extras = live
		.filter((c) => c.category !== 'RENT' && uninvoiced(c) > 0)
		.reduce((sum, c) => sum + uninvoiced(c), 0)

	// The preview follows what is selected, not what is saved, so choosing
	// "manually" blanks the date before the change is committed.
	const next = nextIssue(
		summary.charges,
		days,
		cadenceForChoice(choice).cadence,
	)
	const issued = invoices.length

	const OPTIONS: Array<{
		value: CollectionChoice
		label: string
		sub: string
	}> = [
		{
			value: 'whole-term',
			label: 'The rest of the term, in one',
			sub: `1 invoice · ${months} rent charges · ${money(rentEach * months + extras)}`,
		},
		{
			value: 'quarterly',
			label: 'Every 3 months',
			sub: `${Math.ceil(months / 3)} invoices · first ${money(rentEach * 3 + extras)}`,
		},
		{
			value: 'monthly',
			label: 'Every month',
			sub: `${months} invoices · first ${money(rentEach + extras)}, then ${money(rentEach)}`,
		},
		{
			value: 'manual',
			label: "I'll invoice manually",
			sub: 'Nothing is issued automatically',
		},
	]

	const current = OPTIONS.find((o) => o.value === choice) ?? OPTIONS[3]!

	const save = () => {
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: summary.account.id,
				data: { ...cadenceForChoice(choice), auto_issue_days_before: days },
			},
			{
				onSuccess: () => {
					setEditing(false)
					toast.success('Payment schedule saved.')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
				},
				onError: () =>
					toast.error('Could not save the schedule. Please try again.'),
			},
		)
	}

	// Cancel has to put the local state back: choice and days also drive the
	// read-only summary, so closing the editor without resetting would leave the
	// panel describing a plan that was never saved.
	const cancel = () => {
		setChoice(
			choiceForPolicy(
				summary.account.rent_billing_cadence,
				summary.account.rent_billing_interval,
			),
		)
		setDays(summary.account.auto_issue_days_before)
		setEditing(false)
	}

	const automated = choice !== 'manual' && choice !== 'whole-term'

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="col-start-1 text-lg">Payment schedule</CardTitle>
				<p className="text-muted-foreground col-start-1 mt-1 text-sm">
					{editing ? (
						`Changing this only affects invoices not yet issued. The ${issued} already out keep their dates and amounts.`
					) : automated ? (
						<>
							Rent is invoiced{' '}
							<span className="text-foreground font-semibold">
								{current.label.toLowerCase()}
							</span>
							, {summary.account.auto_issue_days_before} days before each due
							date. {months} rent {months === 1 ? 'charge' : 'charges'} left to
							bill.
						</>
					) : (
						<>
							<span className="text-foreground font-semibold">
								Nothing is issued automatically.
							</span>{' '}
							{months} rent {months === 1 ? 'charge' : 'charges'} left to bill —
							compose an invoice when you want to collect.
						</>
					)}
				</p>
				<CardAction className="col-span-2 col-start-1 row-start-3 flex gap-2 justify-self-start pt-1 sm:col-span-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
					{editing ? (
						<>
							<Button
								variant="outline"
								size="sm"
								disabled={isPending}
								onClick={cancel}
							>
								Cancel
							</Button>
							<Button size="sm" disabled={isPending} onClick={save}>
								{isPending ? <Spinner /> : <Check className="size-4" />}
								Save schedule
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditing(true)}
						>
							<Pencil className="size-4" />
							Edit schedule
						</Button>
					)}
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4">
				{editing ? (
					<>
						<div className="grid gap-3 sm:grid-cols-2">
							{OPTIONS.map((option) => {
								const on = choice === option.value
								return (
									<button
										key={option.value}
										type="button"
										onClick={() => setChoice(option.value)}
										className={cn(
											'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
											on ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
										)}
									>
										<span
											className={cn(
												'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border',
												on ? 'border-primary' : '',
											)}
										>
											{on ? (
												<span className="bg-primary size-2.5 rounded-full" />
											) : null}
										</span>
										<span className="min-w-0">
											<span className="block text-sm font-semibold">
												{option.label}
											</span>
											<span className="text-muted-foreground mt-0.5 block text-xs">
												{option.sub}
											</span>
										</span>
									</button>
								)
							})}
						</div>

						<div
							className={cn(
								'bg-muted flex flex-wrap items-center gap-3 rounded-xl p-4',
								automated ? '' : 'opacity-50',
							)}
						>
							<Clock className="text-muted-foreground size-4" />
							<span className="text-sm font-medium">Issue each invoice</span>
							<div className="bg-background flex items-center rounded-lg border">
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									disabled={!automated || days <= 0}
									onClick={() => setDays(Math.max(0, days - 1))}
								>
									<Minus className="size-3.5" />
								</Button>
								<span className="w-8 text-center font-mono text-sm font-bold">
									{days}
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									disabled={!automated}
									onClick={() => setDays(days + 1)}
								>
									<Plus className="size-3.5" />
								</Button>
							</div>
							<span className="text-muted-foreground text-sm">
								days before it is due — next:{' '}
								<span className="text-foreground font-semibold">
									{next ? day(next.issueOn) : '—'}
								</span>
							</span>
						</div>

						<Alert className="bg-info-bg border-transparent">
							<Info className="text-info size-4" />
							<AlertDescription>
								<p>
									The {issued} {issued === 1 ? 'invoice' : 'invoices'} already
									issued are untouched. The change applies from{' '}
									<strong>{next ? next.charge.name : 'the next charge'}</strong>{' '}
									onwards.
								</p>
							</AlertDescription>
						</Alert>
					</>
				) : (
					<div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
						{(
							[
								['Cadence', current.label],
								[
									'Issued',
									automated
										? `${summary.account.auto_issue_days_before} days before due`
										: 'by hand',
								],
								['Next issue', next ? day(next.issueOn) : '—'],
								[
									'Left to bill',
									`${months} rent · ${money(rentEach * months)}`,
								],
							] as Array<[string, string]>
						).map(([label, value]) => (
							<div key={label} className="min-w-0">
								<p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
									{label}
								</p>
								<p className="mt-1.5 text-sm font-bold">{value}</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
