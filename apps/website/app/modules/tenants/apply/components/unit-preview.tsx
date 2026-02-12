import {
	ChevronLeft,
	ChevronRight,
	Users,
	Building2,
	Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { TypographyH3 } from '~/components/ui/typography'
import {
	getPropertyUnitStatusColor,
	getPropertyUnitStatusLabel,
} from '~/lib/properties.utils'

export function UnitPreview({ unit }: { unit?: PropertyUnit }) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const images: string[] = unit?.images ?? []
	const imagesCount = images.length

	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % imagesCount)
	}

	const prevImage = () => {
		setCurrentImageIndex((prev) => (prev === 0 ? imagesCount - 1 : prev - 1))
	}

	const unitImages =
		imagesCount > 0 &&
		(() => {
			const activeImage = images[currentImageIndex] ?? images[0]
			const hasMultipleImages = imagesCount > 1

			return (
				<div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
					<div className="relative h-80 w-full overflow-hidden rounded-lg bg-gray-100">
						<img
							src={activeImage}
							alt={`${unit?.name} - Image ${currentImageIndex + 1}`}
							className="h-full w-full object-cover"
						/>

						{hasMultipleImages && (
							<>
								<Button
									type="button"
									aria-label="Previous image"
									onClick={prevImage}
									className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
								>
									<ChevronLeft className="h-5 w-5 text-gray-900" />
								</Button>

								<Button
									type="button"
									aria-label="Next image"
									onClick={nextImage}
									className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
								>
									<ChevronRight className="h-5 w-5 text-gray-900" />
								</Button>

								<div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
									{images.map((_, idx) => (
										<button
											key={idx}
											type="button"
											aria-label={`Go to image ${idx + 1}`}
											onClick={() => setCurrentImageIndex(idx)}
											className={`h-2 w-2 rounded-full transition-all ${
												idx === currentImageIndex
													? 'w-6 bg-white'
													: 'bg-white/50 hover:bg-white/70'
											}`}
										/>
									))}
								</div>
							</>
						)}
					</div>
					<p className="text-center text-xs text-gray-600">
						{imagesCount > 1
							? `Image ${currentImageIndex + 1} of ${imagesCount}`
							: ''}
					</p>
				</div>
			)
		})()

	return (
		<div className="mx-auto space-y-6">
			{/* Unit Name & Description */}
			<div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-5">
				<h3 className="text-2xl font-bold text-slate-900">{unit?.name}</h3>
				<p className="text-sm leading-relaxed text-slate-600">
					{unit?.description || 'No description available'}
				</p>
			</div>

			{/* Image Gallery */}
			{unitImages}

			{/* Key Details Grid */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Rent Information */}
				<div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-5">
					<TypographyH3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
						<Wallet className="h-4 w-4 text-rose-600" />
						Rent Information
					</TypographyH3>
					<div className="space-y-3 text-sm">
						<div className="flex items-center justify-between rounded-lg bg-white p-3">
							<span className="text-slate-600">Rent Fee:</span>
							<span className="font-semibold text-slate-900">
								{unit?.rent_fee_currency || 'GHS'}{' '}
								{unit?.rent_fee?.toLocaleString() || '—'}
							</span>
						</div>
						<div className="flex items-center justify-between rounded-lg bg-white p-3">
							<span className="text-slate-600">Frequency:</span>
							<span className="font-semibold text-slate-900">
								{unit?.payment_frequency || '—'}
							</span>
						</div>
						{unit?.area && (
							<div className="flex items-center justify-between rounded-lg bg-white p-3">
								<span className="text-slate-600">Area:</span>
								<span className="font-semibold text-slate-900">
									{unit?.area} sq ft
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Property Info */}
				<div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-5">
					<TypographyH3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
						<Building2 className="h-4 w-4 text-rose-600" />
						Property Info
					</TypographyH3>
					<div className="space-y-3 text-sm">
						<div className="flex items-center justify-between rounded-lg bg-white p-3">
							<span className="text-slate-600">Type:</span>
							<span className="font-semibold text-slate-900">
								{unit?.type || '—'}
							</span>
						</div>
						<div className="flex items-center justify-between rounded-lg bg-white p-3">
							<span className="text-slate-600">Status:</span>
							<span
								className={`inline-flex items-center rounded-full ${getPropertyUnitStatusColor(unit?.status)} px-3 py-1 text-xs font-medium`}
							>
								{getPropertyUnitStatusLabel(unit?.status)}
							</span>
						</div>
						{unit?.max_occupants_allowed && (
							<div className="flex items-center justify-between rounded-lg bg-white p-3">
								<span className="text-slate-600">Max Occupants:</span>
								<span className="flex items-center gap-1 font-semibold text-slate-900">
									<Users className="h-4 w-4" />
									{unit?.max_occupants_allowed}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Features Section */}
			{unit?.features && Object.keys(unit?.features).length > 0 && (
				<div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-5">
					<h3 className="text-base font-semibold text-slate-900">
						Amenities & Features
					</h3>
					<div className="grid gap-2 md:grid-cols-2">
						{Object.entries(unit.features).map(([key, value]) => (
							<div
								key={key}
								className="flex items-start gap-3 rounded-lg bg-white p-3"
							>
								<div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-600" />
								<div className="flex-1 text-sm">
									<p className="font-medium text-slate-900 capitalize">
										{key.replace(/_/g, ' ')}
									</p>
									<p className="text-slate-600">{value}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
