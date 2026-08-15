import { Calendar, FileText, Plus, Receipt } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { type Pronouns, isAre, verb } from '~/lib/pronouns'
import { toFirstUpperCase } from '~/lib/strings'
import { cn } from '~/lib/utils'

/**
 * What choosing the unit settles for the rest of the application.
 *
 * Currency and payment frequency genuinely follow the unit (U2). The rent does
 * not — it is a prefill the landlord restates on the Rent & payments step —
 * and this panel has to say so, or the next step reads as a duplicate.
 */
export function WhatThisDecides({
	unit,
	pronouns,
	propertyName,
	addUnitHref,
}: {
	unit: Nullable<PropertyUnit>
	pronouns: Pronouns
	propertyName: string
	/**
	 * Set only while picking. A landlord who cannot find the unit they want is
	 * looking for it now — offering it beside a settled choice is noise.
	 */
	addUnitHref?: string
}) {
	const rows: Array<[typeof Calendar, string, string]> = [
		[
			Calendar,
			`When ${pronouns.subject} can move in`,
			'Any date you agree, as long as the unit has room',
		],
		[
			Receipt,
			`What ${pronouns.subject} ${verb(pronouns, 'pay')} to start with`,
			unit
				? `${formatAmount(
						convertPesewasToCedis(unit.rent_fee),
						unit.rent_fee_currency,
					)} — you can change it`
				: 'Comes from the unit’s advert',
		],
		[
			FileText,
			`How ${pronouns.subject} ${isAre(pronouns)} billed`,
			unit
				? `${unit.rent_fee_currency}, ${unit.payment_frequency.toLowerCase()}`
				: 'Set by the unit',
		],
		[
			FileText,
			'On the lease papers',
			unit
				? `${unit.name}, ${toFirstUpperCase(unit.type.toLowerCase())}`
				: 'The unit’s address and description',
		],
	]

	return (
		<div className="flex flex-col gap-4">
			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">What this decides</p>
					<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
						The unit sets these for the rest of the application.
					</p>

					<div className="mt-4">
						{rows.map(([Icon, label, value], index) => (
							<div
								key={label}
								className={cn('flex gap-3 py-3', index === 0 ? '' : 'border-t')}
							>
								<Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
								<div className="min-w-0">
									<p className="text-muted-foreground text-sm">{label}</p>
									<p className="mt-0.5 text-sm font-semibold">{value}</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{addUnitHref ? (
				<Card className="shadow-none">
					<CardContent>
						<p className="font-bold">Can&rsquo;t see the right unit?</p>
						<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
							If it isn&rsquo;t listed, it may not be added to {propertyName}{' '}
							yet.
						</p>
						<Button variant="outline" size="sm" className="mt-3.5" asChild>
							<Link to={addUnitHref}>
								<Plus className="size-3.5" />
								Add a unit
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}
