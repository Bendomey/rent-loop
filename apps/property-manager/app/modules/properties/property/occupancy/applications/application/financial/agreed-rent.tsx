import { ArrowRight, Check, Lock, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { toast } from 'sonner'
import type { FinancialMode } from './index'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'

interface AgreedRentProps {
	mode: FinancialMode
	application: TenantApplication
	clientId: string
	propertyId: string
	/** Rent the existing RENT charges were derived from, if any exist. */
	accountRent: Nullable<number>
	periods: number
	onAddCharge?: () => void
}

const parseCedis = (value: string) =>
	Number.parseFloat(value.replace(/,/g, '')) || 0

export function AgreedRent({
	mode,
	application,
	clientId,
	propertyId,
	accountRent,
	periods,
	onAddCharge,
}: AgreedRentProps) {
	const revalidator = useRevalidator()
	const { isPending, mutate } = useAdminUpdateTenantApplication()

	const currency = application.rent_fee_currency
	const unitRent = application.desired_unit?.rent_fee ?? 0
	const saved = application.rent_fee

	const [value, setValue] = useState(
		saved == null ? '' : String(convertPesewasToCedis(saved)),
	)
	const [error, setError] = useState<Nullable<string>>(null)

	const minor = convertCedisToPesewas(parseCedis(value))
	const locked = mode === 'locked' || mode === 'readonly'

	// In live mode the schedule already exists, so a new figure re-derives every
	// rent charge. Allowed while nothing is billed, but never silently.
	const rebuilds = mode === 'live' && minor > 0 && minor !== accountRent
	const dirty = mode === 'setup' && minor > 0 && minor !== saved

	const save = () => {
		setError(null)
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				id: application.id,
				data: { rent_fee: minor },
			},
			{
				onSuccess: () => {
					toast.success(
						rebuilds ? 'Rent saved and schedule rebuilt.' : 'Rent saved.',
					)
					void revalidator.revalidate()
				},
				onError: (mutationError: Error) => {
					// The server rolls the application back with the charges, so
					// nothing is half-applied — the figure on screen is simply stale.
					if (mutationError.message === 'ChargesAlreadyBilled') {
						setError(
							'A payment was collected while you were editing. Rent is now fixed — add a one-off charge instead.',
						)
						void revalidator.revalidate()
						return
					}
					toast.error('Could not save the rent. Please try again.')
				},
			},
		)
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						1
					</span>
					Agreed rent
				</CardTitle>
				<p className="text-muted-foreground mt-1 text-sm">
					{locked
						? 'Fixed — rent charges have already been billed.'
						: 'The figure the lease is written against. It is not inherited from the unit; you state it here.'}
				</p>
				{!locked ? (
					<CardAction className="flex gap-2">
						{rebuilds ? (
							<>
								<Button
									variant="outline"
									size="sm"
									disabled={isPending}
									onClick={() =>
										setValue(
											accountRent == null
												? ''
												: String(convertPesewasToCedis(accountRent)),
										)
									}
								>
									Discard
								</Button>
								<Button size="sm" disabled={isPending} onClick={save}>
									{isPending ? <Spinner /> : <RefreshCw className="size-4" />}
									Save and rebuild
								</Button>
							</>
						) : dirty ? (
							<Button size="sm" disabled={isPending} onClick={save}>
								{isPending ? <Spinner /> : <Check className="size-4" />}
								Save rent
							</Button>
						) : null}
					</CardAction>
				) : null}
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
					<div>
						<Label htmlFor="agreed-rent">Rent per period</Label>
						<div className="mt-2 flex items-center gap-2">
							<span className="text-muted-foreground text-sm font-semibold">
								GH₵
							</span>
							<Input
								id="agreed-rent"
								inputMode="decimal"
								placeholder="0.00"
								className="w-44 text-lg font-semibold"
								value={value}
								disabled={locked || isPending}
								onChange={(event) => {
									setValue(event.target.value)
									setError(null)
								}}
							/>
						</div>
						{!locked ? (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span className="text-muted-foreground text-sm">
									{application.desired_unit?.name} is listed at{' '}
									{formatAmount(convertPesewasToCedis(unitRent), currency)}
								</span>
								{minor !== unitRent && unitRent > 0 ? (
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setValue(String(convertPesewasToCedis(unitRent)))
										}
									>
										Use listed rent
									</Button>
								) : null}
							</div>
						) : null}
						{error ? (
							<p className="text-destructive mt-3 text-sm">{error}</p>
						) : null}
					</div>

					<div className="sm:border-l sm:pl-8">
						<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
							Term
						</p>
						<p className="mt-1.5 font-semibold">
							{periods} periods from{' '}
							{application.desired_move_in_date
								? new Date(application.desired_move_in_date).toLocaleDateString(
										'en-GB',
										{ day: 'numeric', month: 'short', year: 'numeric' },
									)
								: '—'}
						</p>
						{!locked ? (
							<Button variant="link" asChild className="mt-1 h-auto p-0">
								<Link
									to={`/properties/${propertyId}/occupancy/applications/${application.id}/move-in`}
								>
									Change in Move-in setup
									<ArrowRight className="size-3.5" />
								</Link>
							</Button>
						) : null}
					</div>
				</div>

				{rebuilds ? (
					<Alert variant="destructive">
						<RefreshCw className="size-4" />
						<AlertTitle>Saving this rebuilds the rent schedule</AlertTitle>
						<AlertDescription>
							The {periods} rent charges were derived from{' '}
							{formatAmount(convertPesewasToCedis(accountRent ?? 0), currency)}.
							Saving removes them and creates {periods} new ones at{' '}
							{formatAmount(convertPesewasToCedis(minor), currency)} —{' '}
							{formatAmount(convertPesewasToCedis(minor * periods), currency)}{' '}
							over the term instead of{' '}
							{formatAmount(
								convertPesewasToCedis((accountRent ?? 0) * periods),
								currency,
							)}
							. One-off charges are untouched.
						</AlertDescription>
					</Alert>
				) : null}

				{locked ? (
					<Alert>
						<Lock className="size-4" />
						<AlertTitle>
							{mode === 'readonly'
								? 'Rent is fixed — this application is now a lease.'
								: "Rent can't change — payment has already been collected."}
						</AlertTitle>
						<AlertDescription className="flex flex-col items-start gap-3">
							<span>
								{mode === 'readonly'
									? 'Any change to what the tenant pays happens on the lease from here.'
									: 'Changing rent rebuilds every rent charge, which is refused once anything is billed. Add a one-off charge instead.'}
							</span>
							{mode === 'locked' && onAddCharge ? (
								<Button variant="outline" size="sm" onClick={onAddCharge}>
									<Plus className="size-4" />
									Add a charge
								</Button>
							) : null}
						</AlertDescription>
					</Alert>
				) : null}
			</CardContent>
		</Card>
	)
}
