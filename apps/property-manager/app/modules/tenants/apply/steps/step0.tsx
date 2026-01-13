import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ChevronLeft, ChevronRight, Home, Users, DollarSign, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData } from 'react-router'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/tenants.apply._index'
import { Image } from '~/components/Image'

const ValidationSchema = z.object({
	desired_unit_id: z.string({
		error: 'Invalid referral code',
	}),
	created_by_id: z.string({
		error: 'Invalid referral code',
	}),
})

export type FormSchema = z.infer<typeof ValidationSchema>

const mockUnit = {
    "id": "c5360442-109e-48df-a9bd-987d91a71ed2",
    "name": "Unit 103",
    "slug": "unit-103-u4y6yjjgns",
    "type": "APARTMENT",
    "area": 92.5,
    "description": "Spacious two-bedroom apartment with modern finishes, natural lighting, and excellent ventilation. Ideal for professionals or small families.",
    "rent_fee": 5000,
    "rent_fee_currency": "GHS",
    "payment_frequency": "MONTHLY",
    "features": {
      "bedrooms": 2,
      "bathrooms": 2,
      "parking": true,
      "air_conditioning": true,
      "balcony": true,
      "security": "24/7",
      "furnished": false
    },
    "images": [
      "https://example.com/images/unit-103-living-room.jpg",
      "https://example.com/images/unit-103-bedroom.jpg",
      "https://example.com/images/unit-103-kitchen.jpg"
    ],
    "tags": ["modern", "secure", "city-view"]
}


export function Step0() {
	const { referredBy, unitId,  } = useLoaderData<typeof loader>()
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
const unit = mockUnit
	const { goNext, formData, updateFormData } = useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			created_by_id: formData.created_by_id || referredBy || undefined,
			desired_unit_id: formData.desired_unit_id || unitId || undefined,
		},
	})

	const { handleSubmit, control, setValue } = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			desired_unit_id: data.desired_unit_id,
			created_by_id: data.created_by_id,
			
		})
		goNext()
	}

	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % unit?.images.length)
	}

	const prevImage = () => {
		setCurrentImageIndex((prev) => 
			prev === 0 ? unit?.images.length - 1 : prev - 1
		)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-4 space-y-6 md:my-8 md:max-w-2xl"
			>
				<Input type="hidden" {...rhfMethods.register('created_by_id')} />
				<Input type="hidden" {...rhfMethods.register('desired_unit_id')} />

				{/* Header Section */}
				<div className="space-y-1 border-b pb-6 md:space-y-3">
					<TypographyH2 className="text-3xl font-bold">
						Unit Details
					</TypographyH2>
					<TypographyMuted className="text-base leading-relaxed">
						Review the property unit you're applying for
					</TypographyMuted>
				</div>

				{/* Unit Name & Description */}
				<div className="space-y-5 rounded-lg border border-slate-100 bg-slate-50 p-5">
					<div className="space-y-3">
						<h2 className="text-2xl font-bold text-slate-900">{unit?.name}</h2>
						<p className="text-base leading-relaxed text-slate-700">
							{unit?.description}
						</p>
					</div>
				</div>

				{/* Key Details Grid */}
				<div className="grid gap-5 md:grid-cols-2">
					{/* Rent Information */}
					<div className="space-y-5 rounded-lg border border-green-100 bg-green-50 p-5">
						<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
							<DollarSign className="h-5 w-5 text-green-600" />
							Rent Information
						</h3>
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-slate-700">Rent Fee:</span>
								<span className="font-semibold text-slate-900">
									{unit?.rent_fee_currency} {unit?.rent_fee.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-700">Frequency:</span>
								<span className="font-semibold text-slate-900">
									{unit?.payment_frequency}
								</span>
							</div>
							{unit?.area && (
								<div className="flex justify-between">
									<span className="text-slate-700">Area:</span>
									<span className="font-semibold text-slate-900">
										{unit?.area} sq ft
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Property Info */}
					<div className="space-y-5 rounded-lg border border-amber-100 bg-amber-50 p-5">
						<TypographyH3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
							<Building2 className="h-5 w-5 text-amber-600" />
							Property Info
						</TypographyH3>
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-slate-700">Type:</span>
								<span className="font-semibold text-slate-900">{unit?.type}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-700">Status:</span>
								<span className="inline-block rounded-full bg-green-200 px-3 py-1 text-sm font-medium text-green-800">
									Available
								</span>
							</div>
							{unit?.max_occupants_allowed && (
								<div className="flex justify-between">
									<span className="text-slate-700">Max Occupants:</span>
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
					<div className="space-y-5 rounded-lg border border-purple-100 bg-purple-50 p-5">
						<h3 className="text-lg font-semibold text-slate-900">
							Amenities & Features
						</h3>
						<div className="grid gap-3 md:grid-cols-2">
							{Object.entries(unit.features).map(([key, value]) => (
								<div
									key={key}
									className="flex items-start gap-3 rounded-lg bg-white p-3"
								>
									<div className="mt-1 h-2 w-2 rounded-full bg-purple-600 flex-shrink-0" />
									<div className="flex-1">
										<p className="text-sm font-medium text-slate-700 capitalize">
											{key.replace(/_/g, ' ')}
										</p>
										<p className="text-sm text-slate-600">{value}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Image Gallery Section */}
			{unit.images?.length > 0 && (() => {
	const images = unit.images
	const activeImage = images[currentImageIndex] ?? images[0]
	const hasMultipleImages = images.length > 1

	return (
		<div className="space-y-5 rounded-lg border border-blue-100 bg-blue-50 p-5">
			<div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100 md:h-96">
				<img
					src={activeImage}
					alt={`${unit.name} - Image ${currentImageIndex + 1}`}
					className="h-full w-full object-cover"
				/>

				{hasMultipleImages && (
					<>
						<Button
							type="button"
							aria-label="Previous image"
							onClick={prevImage}
							className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white"
						>
							<ChevronLeft className="h-6 w-6 text-gray-800" />
						</Button>

						<Button
							type="button"
							aria-label="Next image"
							onClick={nextImage}
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white"
						>
							<ChevronRight className="h-6 w-6 text-gray-800" />
						</Button>

						<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
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
		</div>
	)
})()}

				{/* Action Buttons */}
				<div className="flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
					<Link to={`/`}>
						<Button
							type="button"
							size="lg"
							variant="outline"
							className="w-full md:w-auto"
						>
							<Home className="mr-2 h-4 w-4" />
							Go Home
						</Button>
					</Link>
					<Button
						size="lg"
						variant="default"
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
