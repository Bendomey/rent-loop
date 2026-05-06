import { Star } from 'lucide-react'

interface Review {
	id: string
	name: string
	date: string
	rating: number
	comment: string
}

const MOCK_REVIEWS: Review[] = [
	{
		id: '1',
		name: 'Abena M.',
		date: 'March 2025',
		rating: 5,
		comment:
			'Absolutely loved staying here. The space was clean, well-furnished, and exactly as described. The manager was very responsive and check-in was seamless.',
	},
	{
		id: '2',
		name: 'Kofi A.',
		date: 'January 2025',
		rating: 4,
		comment:
			'Great location and comfortable space. Would definitely recommend to anyone visiting the area. A few minor things could be improved but overall a great experience.',
	},
	{
		id: '3',
		name: 'Efua D.',
		date: 'December 2024',
		rating: 5,
		comment:
			'Perfect in every way. The unit was spotless and the amenities were all working. Felt very safe and secure throughout my stay.',
	},
]

const OVERALL_RATING = 4.7
const TOTAL_REVIEWS = 38

function Stars({
	rating,
	size = 'sm',
}: {
	rating: number
	size?: 'sm' | 'lg'
}) {
	const sz = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
	return (
		<div className="flex items-center gap-0.5">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={i}
					className={`${sz} ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'}`}
				/>
			))}
		</div>
	)
}

function Avatar({ name }: { name: string }) {
	const initials = name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
	return (
		<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
			{initials}
		</div>
	)
}

export function ReviewsSection() {
	return (
		<div>
			<div className="mb-6 flex items-center gap-4">
				<div>
					<div className="flex items-baseline gap-2">
						<span className="text-4xl font-bold text-zinc-900">
							{OVERALL_RATING}
						</span>
						<span className="text-sm text-zinc-500">/ 5</span>
					</div>
					<Stars rating={OVERALL_RATING} size="lg" />
					<p className="mt-1 text-xs text-zinc-400">
						Based on {TOTAL_REVIEWS} reviews
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				{MOCK_REVIEWS.map((review) => (
					<div
						key={review.id}
						className="rounded-xl border border-zinc-100 bg-zinc-50 p-4"
					>
						<div className="flex items-start gap-3">
							<Avatar name={review.name} />
							<div className="flex-1">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-zinc-900">
										{review.name}
									</p>
									<span className="text-xs text-zinc-400">{review.date}</span>
								</div>
								<Stars rating={review.rating} />
								<p className="mt-2 text-sm leading-relaxed text-zinc-600">
									{review.comment}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
