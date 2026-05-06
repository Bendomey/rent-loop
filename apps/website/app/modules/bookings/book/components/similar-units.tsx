import { Link } from 'react-router'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface SimilarUnit {
	id: string
	slug: string
	name: string
	images: string[]
	rent_fee: number
	rent_fee_currency: string
	payment_frequency: PropertyUnit['payment_frequency']
	type: PropertyUnit['type']
	property: { name: string; slug: string }
}

const MOCK_UNITS: SimilarUnit[] = [
	{
		id: 'mock-1',
		slug: 'deluxe-studio-a',
		name: 'Deluxe Studio A',
		images: [
			'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
		],
		rent_fee: 45000,
		rent_fee_currency: 'GHS',
		payment_frequency: 'DAILY',
		type: 'STUDIO',
		property: { name: 'Skyline Residences', slug: 'skyline-residences' },
	},
	{
		id: 'mock-2',
		slug: 'executive-suite-b',
		name: 'Executive Suite B',
		images: [
			'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
		],
		rent_fee: 80000,
		rent_fee_currency: 'GHS',
		payment_frequency: 'DAILY',
		type: 'APARTMENT',
		property: { name: 'Skyline Residences', slug: 'skyline-residences' },
	},
	{
		id: 'mock-3',
		slug: 'garden-apartment-c',
		name: 'Garden Apartment C',
		images: [
			'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
		],
		rent_fee: 60000,
		rent_fee_currency: 'GHS',
		payment_frequency: 'DAILY',
		type: 'APARTMENT',
		property: { name: 'Skyline Residences', slug: 'skyline-residences' },
	},
]

const FREQUENCY_SHORT: Record<PropertyUnit['payment_frequency'], string> = {
	DAILY: 'night',
	WEEKLY: 'wk',
	MONTHLY: 'mo',
	QUARTERLY: 'qtr',
	BIANNUALLY: '6mo',
	ANNUALLY: 'yr',
}

export function SimilarUnits() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{MOCK_UNITS.map((unit) => (
				<Link
					key={unit.id}
					to={`/book/${unit.property.slug}/${unit.slug}`}
					className="group overflow-hidden rounded-xl border border-zinc-100 bg-white transition hover:shadow-md"
				>
					<div className="h-36 overflow-hidden bg-zinc-100">
						{unit.images[0] ? (
							<img
								src={unit.images[0]}
								alt={unit.name}
								className="h-full w-full object-cover transition group-hover:scale-105"
							/>
						) : (
							<div className="h-full w-full bg-zinc-200" />
						)}
					</div>
					<div className="p-3">
						<p className="truncate text-sm font-medium text-zinc-900">
							{unit.name}
						</p>
						<p className="mt-0.5 truncate text-xs text-zinc-400">
							{unit.property.name}
						</p>
						<p className="mt-1.5 text-sm font-semibold text-zinc-900">
							{formatAmount(convertPesewasToCedis(unit.rent_fee))}{' '}
							<span className="text-xs font-normal text-zinc-400">
								/ {FREQUENCY_SHORT[unit.payment_frequency]}
							</span>
						</p>
					</div>
				</Link>
			))}
		</div>
	)
}
