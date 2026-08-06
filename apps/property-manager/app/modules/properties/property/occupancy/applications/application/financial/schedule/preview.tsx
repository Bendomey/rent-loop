import { useQueryClient } from '@tanstack/react-query'
import { Check, Info, Lock, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { RentGroup } from './rent-group'
import { useCreateCharge, usePrepareCharges } from '~/api/financial-accounts'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import { buildSchedule, graceDays } from '~/lib/schedule'
import type { PaymentFrequency } from '~/lib/schedule'

interface SchedulePreviewProps {
	application: TenantApplication
	clientId: string
	propertyId: string
}

interface QueuedExtra {
	category: ChargeCategory
	name: string
	amount: number
}

/**
 * The deposit is no longer a term on the application, so it is easy to forget.
 * These are the mitigation: one click each, with a sensible starting amount.
 */
const SUGGESTIONS: Array<{
	category: ChargeCategory
	name: string
	amount: (rent: number) => number
}> = [
	{
		category: 'SECURITY_DEPOSIT',
		name: 'Security deposit',
		amount: (rent) => rent,
	},
	{ category: 'AGENCY_FEE', name: 'Agency fee', amount: () => 50000 },
	{ category: 'VAT', name: 'VAT', amount: () => 7500 },
]

export function SchedulePreview({
	application,
	clientId,
	propertyId,
}: SchedulePreviewProps) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const prepare = usePrepareCharges()
	const createCharge = useCreateCharge()

	const [extras, setExtras] = useState<QueuedExtra[]>([])
	const [open, setOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	const currency = application.rent_fee_currency
	const rent = application.rent_fee ?? 0
	const stayDuration = application.stay_duration ?? 0
	// The term and the billing rhythm are separate: the stay is measured in
	// stayFrequency units, rent falls due every paymentFrequency inside it.
	const stayFrequency = (application.stay_duration_frequency ??
		'MONTHLY') as PaymentFrequency
	const paymentFrequency = (application.payment_frequency ??
		'MONTHLY') as PaymentFrequency

	const moveIn = application.desired_move_in_date
	const ready = rent > 0 && stayDuration > 0 && !!moveIn

	const schedule =
		ready && moveIn
			? buildSchedule({
					rent,
					moveIn: new Date(moveIn),
					stayDuration,
					stayFrequency,
					paymentFrequency,
				})
			: []

	const rentTotal = rent * schedule.length
	const extrasTotal = extras.reduce((sum, extra) => sum + extra.amount, 0)
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const create = async () => {
		setBusy(true)

		// 1. prepare — creates the rent charges. One-way; a second call is 400.
		let account: FinancialAccount
		try {
			account = await prepare.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				application_id: application.id,
			})
		} catch (error) {
			setBusy(false)
			toast.error(
				(error as Error).message === 'ApplicationMissingRentDetails'
					? 'Set the agreed rent before creating charges.'
					: 'Could not create the charges. Nothing was created.',
			)
			return
		}

		// 2. each extra, independently. The rent charges already exist by now, so
		// a failure here is partial rather than total — say which ones landed.
		const failed: string[] = []
		for (const extra of extras) {
			try {
				await createCharge.mutateAsync({
					client_id: clientId,
					property_id: propertyId,
					account_id: account.id,
					data: {
						name: extra.name,
						category: extra.category,
						amount: extra.amount,
						currency,
						due_date: new Date(moveIn as unknown as string).toISOString(),
					},
				})
			} catch {
				failed.push(extra.name)
			}
		}

		setBusy(false)
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})
		void revalidator.revalidate()

		const created = schedule.length + extras.length - failed.length
		if (failed.length === 0) {
			toast.success(`${created} charges created · ${money(rentTotal + extrasTotal)}`)
		} else {
			toast.warning(
				`${created} charges created, but ${failed.join(' and ')} could not be added. Add ${failed.length === 1 ? 'it' : 'them'} from the ledger.`,
			)
		}
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						2
					</span>
					Schedule
					{!ready ? (
						<Lock className="text-muted-foreground size-3.5" />
					) : null}
				</CardTitle>
				<p className="text-muted-foreground mt-1 text-sm">
					{ready ? (
						<>
							<span className="text-foreground font-semibold">
								{schedule.length + extras.length} charges ·{' '}
								{money(rentTotal + extrasTotal)}
							</span>{' '}
							— a preview. Nothing exists until you create it.
						</>
					) : (
						'Set the agreed rent above and the schedule appears here.'
					)}
				</p>
				{ready ? (
					<CardAction>
						<Button size="sm" disabled={busy} onClick={() => void create()}>
							{busy ? <Spinner /> : <Check className="size-4" />}
							Create these charges
						</Button>
					</CardAction>
				) : null}
			</CardHeader>

			{ready ? (
				<CardContent className="space-y-4">
					<div className="rounded-xl border px-4">
						<RentGroup
							rows={schedule.map((period, index) => ({
								id: `preview-${index}`,
								name: period.name,
								amount: period.amount,
								dueDate: period.dueDate,
							}))}
							currency={currency}
							open={open}
							onToggle={() => setOpen(!open)}
						/>

						{extras.map((extra) => (
							<div
								key={extra.category}
								className="flex items-center gap-3 border-t py-3"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium">{extra.name}</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										Due on move-in
									</p>
								</div>
								<Input
									inputMode="decimal"
									className="w-32 text-right"
									value={String(convertPesewasToCedis(extra.amount))}
									onChange={(event) =>
										setExtras(
											extras.map((item) =>
												item.category === extra.category
													? {
															...item,
															amount: convertCedisToPesewas(
																Number.parseFloat(
																	event.target.value.replace(/,/g, ''),
																) || 0,
															),
														}
													: item,
											),
										)
									}
								/>
								<Button
									variant="outline"
									size="icon"
									className="size-8 shrink-0"
									aria-label={`Remove ${extra.name}`}
									onClick={() =>
										setExtras(
											extras.filter((item) => item.category !== extra.category),
										)
									}
								>
									<X className="size-3.5" />
								</Button>
							</div>
						))}

						<div className="flex items-center justify-between border-t py-4">
							<span className="text-sm font-semibold">Total over the term</span>
							<span className="text-lg font-bold tabular-nums">
								{money(rentTotal + extrasTotal)}
							</span>
						</div>
					</div>

					<div>
						<p className="mb-2 text-sm font-semibold">
							Most leases also charge{' '}
							<span className="text-muted-foreground font-normal">
								— added alongside the rent
							</span>
						</p>
						<div className="flex flex-wrap gap-2">
							{SUGGESTIONS.map((suggestion) => {
								const on = extras.some(
									(extra) => extra.category === suggestion.category,
								)
								return (
									<Button
										key={suggestion.category}
										variant={on ? 'default' : 'outline'}
										size="sm"
										onClick={() =>
											setExtras(
												on
													? extras.filter(
															(extra) => extra.category !== suggestion.category,
														)
													: [
															...extras,
															{
																category: suggestion.category,
																name: suggestion.name,
																amount: suggestion.amount(rent),
															},
														],
											)
										}
									>
										{on ? (
											<X className="size-3.5" />
										) : (
											<Plus className="size-3.5" />
										)}
										{suggestion.name}
									</Button>
								)
							})}
						</div>
					</div>

					<Alert>
						<Info className="size-4" />
						<AlertDescription>
							Rent falls due{' '}
							<strong>{graceDays(paymentFrequency)} days</strong> after
							each period starts. Creating the charges is one-way, but you can
							still change the rent or the term afterwards while nothing has
							been billed.
						</AlertDescription>
					</Alert>
				</CardContent>
			) : null}
		</Card>
	)
}
