import { ArrowLeft, Pencil, Check } from 'lucide-react'
import { useCreatePropertyTenantApplicationContext } from '../context'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted, TypographySmall } from '~/components/ui/typography'

const renderPreviewField = (label: string, value?: string | null) => (
	<div className="py-3">
		<p className="text-sm font-medium text-slate-600">{label}</p>
		<p className="mt-1 text-sm text-slate-900">{value || '—'}</p>
	</div>
)

const PreviewCard = ({
	title,
	subtitle,
	children,
	stepNumber,
	onEdit,
}: {
	title: string
	subtitle?: string
	children: React.ReactNode
	stepNumber: number
	onEdit: () => void
}) => (
	<div className="rounded-lg border bg-white p-6">
		<div className="mb-4 flex items-start justify-between">
			<div>
				<h3 className="font-semibold text-foreground">{title}</h3>
				{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
			</div>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				onClick={onEdit}
				className="text-rose-600 hover:text-rose-700"
			>
				<Pencil className="h-4 w-4" />
			</Button>
		</div>
		<div className="space-y-0">{children}</div>
	</div>
)

export function Step4() {
	const { goBack, goToPage, formData, onSubmit, isSubmitting } =
		useCreatePropertyTenantApplicationContext()

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				await onSubmit(formData)
			}}
			className="mx-auto my-8 space-y-8 md:max-w-2xl"
		>
			{/* Header Section */}
			<div className="space-y-2 border-b pb-6">
				<TypographyH2 className="text-2xl font-bold">Review Application</TypographyH2>
				<TypographyMuted className="text-base">
					Review all information below. Click Edit to make changes before submitting.
				</TypographyMuted>
			</div>

			{/* Unit & Onboarding Method */}
			<PreviewCard
				title="Unit & Onboarding"
				subtitle="Selected unit and onboarding method"
				stepNumber={0}
				onEdit={() => goToPage(0)}
			>
				{renderPreviewField('Unit', formData.desired_unit)}
				{renderPreviewField(
					'Onboarding Method',
					formData.on_boarding_method === 'SELF' ? 'Self Onboarding' : 'Admin Onboarding',
				)}
			</PreviewCard>

			{/* Basic Information */}
			<PreviewCard
				title="Basic Information"
				subtitle="Personal details"
				stepNumber={1}
				onEdit={() => goToPage(1)}
			>
				<div className='grid grid-cols-2 gap-y-0 gap-x-4'>
				{renderPreviewField('First Name', formData.first_name)}
				{renderPreviewField('Last Name', formData.last_name)}
				{formData.other_names && renderPreviewField('Other Names', formData.other_names)}
				{renderPreviewField('Gender', formData.gender)}
				{renderPreviewField('Email', formData.email)}
				{renderPreviewField('Phone', formData.phone)}
				{formData.date_of_birth &&
					renderPreviewField(
						'Date of Birth',
						new Date(formData.date_of_birth).toLocaleDateString(),
					)}
					</div>
			</PreviewCard>

			{/* Identity Verification */}
			<PreviewCard
				title="Identity Verification"
				subtitle="Identification details"
				stepNumber={2}
				onEdit={() => goToPage(2)}
			>
								<div className='grid grid-cols-2 gap-y-0 gap-x-4'>
				{renderPreviewField('Nationality', formData.nationality)}
				{renderPreviewField('ID Type', formData.id_type)}
				<div className='col-span-2'>
				{renderPreviewField('ID Number', formData.id_number)}
				</div>
				{formData.id_front_url && (
					<div className="py-3">
						<p className="text-sm font-medium text-slate-600">ID Front</p>
						<div className="mt-2">
							<img
								src={formData.id_front_url}
								alt="ID Front"
								className="max-h-40 rounded-md object-cover"
							/>
						</div>
					</div>
				)}
				{formData.id_back_url && (
					<div className="py-3">
						<p className="text-sm font-medium text-slate-600">ID Back</p>
						<div className="mt-2">
							<img
								src={formData.id_back_url}
								alt="ID Back"
								className="max-h-40 rounded-md object-cover"
							/>
						</div>
					</div>
				)}
			</div>
			</PreviewCard>

			{/* Profile Photo */}
			{formData.profile_photo_url && (
				<PreviewCard
					title="Profile Photo"
					subtitle="Tenant profile picture"
					stepNumber={1}
					onEdit={() => goToPage(1)}
				>
					<div className="py-3">
						<img
							src={formData.profile_photo_url}
							alt="Profile"
							className="max-h-48 rounded-md object-cover"
						/>
					</div>
				</PreviewCard>
			)}

			{/* Action Buttons */}
			<div className="mt-10 flex items-center justify-between border-t pt-6">
				<Button onClick={goBack} type="button" size="lg" variant="outline">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Go Back
				</Button>
				<Button
					disabled={isSubmitting}
					size="lg"
					variant="default"
					className="bg-rose-600 hover:bg-rose-700"
				>
					{isSubmitting ? (
						<>
							<Spinner className="mr-2 h-4 w-4" />
							Submitting...
						</>
					) : (
						'Submit Application'
					)}
				</Button>
			</div>
		</form>
	)
}
