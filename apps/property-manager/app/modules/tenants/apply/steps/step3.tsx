import { ArrowLeft, Pencil } from 'lucide-react'
import { useTenantApplicationContext } from '../context'
import { Image } from '~/components/Image'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import {
	TypographyH2,
	TypographyMuted,
	TypographyP,
} from '~/components/ui/typography'

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
				<h3 className="text-foreground font-semibold">{title}</h3>
				{subtitle && (
					<p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
				)}
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

export function Step3() {
	const { goBack, goToPage, formData, onSubmit, isSubmitting } =
		useTenantApplicationContext()
	const isStudent = formData.employment_type === 'STUDENT'

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
				<TypographyH2 className="text-2xl font-bold">
					Review Application
				</TypographyH2>
				<TypographyMuted className="text-base">
					Review all information below. Click Edit to make changes before
					submitting.
				</TypographyMuted>
			</div>

			{/* Profile Photo */}
			{formData.profile_photo_url && (
				<PreviewCard
					title="Profile Photo"
					subtitle="Identification photo"
					stepNumber={0}
					onEdit={() => goToPage(0)}
				>
					<div className="py-3">
						<Image
							src={formData.profile_photo_url}
							alt="Profile"
							className="max-h-48 rounded-md object-cover"
						/>
					</div>
				</PreviewCard>
			)}

			{/* Basic Information */}
			<PreviewCard
				title="Basic Information"
				subtitle="Personal details"
				stepNumber={0}
				onEdit={() => goToPage(0)}
			>
				<div className="grid grid-cols-2 gap-x-4 gap-y-0">
					{renderPreviewField('First Name', formData.first_name)}
					{renderPreviewField('Last Name', formData.last_name)}
					{formData.other_names &&
						renderPreviewField('Other Names', formData.other_names)}
					{renderPreviewField('Gender', formData.gender)}
					{renderPreviewField('Marital Status', formData.marital_status)}
					{renderPreviewField('Email', formData.email)}
					{renderPreviewField('Phone', formData.phone)}
					{formData.date_of_birth &&
						renderPreviewField(
							'Date of Birth',
							new Date(formData.date_of_birth).toLocaleDateString(),
						)}
					{renderPreviewField('Address', formData.current_address)}
				</div>
			</PreviewCard>

			{/* Identity Verification */}
			<PreviewCard
				title="Identity Verification"
				subtitle="Identification details"
				stepNumber={1}
				onEdit={() => goToPage(1)}
			>
				<div className="grid grid-cols-2 gap-x-4 gap-y-0">
					{renderPreviewField('Nationality', formData.nationality)}
					{renderPreviewField('ID Type', formData.id_type)}
					<div className="col-span-2">
						{renderPreviewField('ID Number', formData.id_number)}
					</div>
					{formData.id_front_url && (
						<div className="py-3">
							<TypographyP className="text-sm font-medium text-slate-600">
								ID Front
							</TypographyP>
							<div className="mt-2">
								<Image
									src={formData.id_front_url}
									alt="ID Front"
									className="max-h-40 rounded-md object-cover"
								/>
							</div>
						</div>
					)}
					{formData.id_back_url && (
						<div className="py-3">
							<TypographyP className="text-sm font-medium text-slate-600">
								ID Back
							</TypographyP>
							<div className="mt-2">
								<Image
									src={formData.id_back_url}
									alt="ID Back"
									className="max-h-40 rounded-md object-cover"
								/>
							</div>
						</div>
					)}
				</div>
			</PreviewCard>

			{/* Emergency Contact & Employment */}
			<PreviewCard
				title={`${isStudent ? 'Emergency Contact & Student Information' : 'Emergency Contact & Employment Information'}`}
				subtitle={`Emergency contact and ${isStudent ? 'student' : 'employment'} information`}
				stepNumber={2}
				onEdit={() => goToPage(2)}
			>
				<div className="space-y-4">
					<div>
						<TypographyP className="text-foreground mb-3 font-semibold">
							Emergency Contact
						</TypographyP>
						<div className="grid grid-cols-2 gap-x-4 gap-y-0">
							{renderPreviewField('Full Name', formData.emergency_contact_name)}
							{renderPreviewField(
								'Relationship',
								formData.relationship_to_emergency_contact,
							)}
							<div className="col-span-2">
								{renderPreviewField(
									'Phone Number',
									formData.emergency_contact_phone,
								)}
							</div>
						</div>
					</div>

					<div className="border-t pt-4">
						<TypographyP className="text-foreground mb-3 font-semibold">
							{isStudent ? 'Student Information' : 'Employment Information'}
						</TypographyP>
						<div className="grid grid-cols-2 gap-x-4 gap-y-0">
							{isStudent
								? null
								: renderPreviewField('Occupation', formData.occupation)}
							{renderPreviewField(
								isStudent ? 'Institution/School' : 'Employer',
								formData.employer,
							)}
							<div className="col-span-2">
								{renderPreviewField('Address', formData.occupation_address)}
							</div>
						</div>
					</div>

					{formData.proof_of_income_url && (
						<div className="border-t pt-4">
							<TypographyP className="mb-3 text-sm font-medium text-slate-600">
								Proof of {isStudent ? 'Admission' : 'Income'}
							</TypographyP>
							<div className="mt-2">
								<Image
									src={formData.proof_of_income_url}
									alt={`Proof of ${isStudent ? 'Admission' : 'Income'}`}
									className="max-h-40 rounded-md object-cover"
								/>
							</div>
						</div>
					)}
				</div>
			</PreviewCard>

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
