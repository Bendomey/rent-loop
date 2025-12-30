import { Edit } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import {
	TypographyH3,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

export function GeneralSettingsModule() {
	const { currentUser } = useAuth()

	const isCompany = Boolean(currentUser?.client?.type === 'COMPANY')
	return (
		<div className="mx-auto max-w-4xl space-y-8 px-0 pt-0 pb-10 lg:px-4 lg:pt-1">
			<div className="space-y-1">
				<TypographyH3>General Settings</TypographyH3>
				<TypographyMuted>
					Update and manage your essential information.
				</TypographyMuted>
			</div>

			<Separator />

			{/* Company Details */}
			{isCompany && (
				<section className="bg-card grid gap-6 rounded-xl border p-3 shadow-sm md:p-6 lg:-space-y-2">
					<div className="flex items-center justify-between max-md:items-start max-sm:flex-col max-sm:gap-2">
						<TypographyH3>Company Details</TypographyH3>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2 underline"
						>
							<Edit className="size-4" /> Edit Details
						</Button>
					</div>
					<Separator />
					<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
						<FieldLabel htmlFor="owner_company_name">Company Name</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="owner_company_name"
								placeholder="Enter your company name"
								disabled
								value={currentUser?.client?.name ?? 'N/A'}
							/>
						</Field>
					</div>

					<div className="grid items-center gap-4 sm:grid-cols-3">
						<FieldLabel htmlFor="description">Description</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="description"
								placeholder="Enter description (optional)"
								disabled
								value={currentUser?.client?.description ?? 'N/A'}
							/>
						</Field>
					</div>

					<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
						<FieldLabel htmlFor="email">Support Email</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="email"
								placeholder="support@example.com"
								disabled
								value={currentUser?.client?.support_email ?? 'N/A'}
							/>
						</Field>
					</div>

					<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
						<FieldLabel htmlFor="support_phone">Support Phone</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="support_phone"
								placeholder="(233) 277-456-7890"
								disabled
								value={currentUser?.client?.support_phone ?? 'N/A'}
							/>
						</Field>
					</div>

					<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
						<FieldLabel htmlFor="registration_number">
							Registration Number
						</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="registration_number"
								placeholder="Company registration number"
								disabled
								value={currentUser?.client?.registration_number ?? 'N/A'}
							/>
						</Field>
					</div>

					<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
						<FieldLabel htmlFor="website_url">Website</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="website_url"
								placeholder="https://example.com"
								disabled
								value={currentUser?.client?.website_url ?? 'N/A'}
							/>
						</Field>
					</div>
				</section>
			)}
			{/*  Type */}
			<section className="bg-card grid gap-6 rounded-xl border p-3 shadow-sm md:p-6 lg:-space-y-2">
				<div className="flex items-center justify-between max-md:items-start max-sm:flex-col max-sm:gap-2">
					<TypographyH3>Property Owner Type </TypographyH3>
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2 underline"
					>
						<Edit className="size-4" /> Edit
					</Button>
				</div>
				<Separator />
				<div className="grid items-center gap-4 sm:grid-cols-3">
					<FieldLabel htmlFor="type">Type</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="type"
							placeholder="COMPANY"
							disabled
							value={currentUser?.client?.type}
						/>
					</Field>
				</div>
				{isCompany && (
					<div className="grid items-center gap-4 sm:grid-cols-3">
						<FieldLabel htmlFor="sub_type">Sub Type</FieldLabel>
						<Field className="sm:col-span-2">
							<Input
								id="sub_type"
								placeholder="LANDLORD"
								disabled
								value={currentUser?.client?.sub_type}
							/>
						</Field>
					</div>
				)}
			</section>

			{/* Location */}
			<section className="bg-card grid gap-8 rounded-xl border p-3 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
				<div className="space-y-2">
					<TypographyH4 className="text-lg font-semibold">
						Business Location
					</TypographyH4>
					<FieldDescription className="text-muted-foreground text-sm">
						Update your company's official physical address.
					</FieldDescription>
				</div>

				<div className="space-y-6 sm:col-span-2">
					{/* Address */}
					<Field className="space-y-2">
						<div className="flex items-center justify-between max-md:items-start max-sm:flex-col max-sm:gap-2">
							<FieldLabel className="font-medium">Address</FieldLabel>
							<Button
								variant="outline"
								size="sm"
								className="hover:bg-muted flex items-center gap-2 transition"
							>
								<Edit className="size-4" />
								Edit Address
							</Button>
						</div>

						<Input
							id="address"
							placeholder="Madina Estate, Pentecost School"
							className="h-11"
							disabled
							value={currentUser?.client?.address}
						/>
					</Field>

					{/* Country / Region / City */}
					<div className="grid gap-6 sm:grid-cols-3">
						<div className="space-y-1">
							<Label className="text-sm font-medium">Country</Label>
							<TypographyMuted className="text-sm">
								{currentUser?.client?.country}
							</TypographyMuted>
						</div>

						<div className="space-y-1">
							<Label className="text-sm font-medium">Region</Label>
							<TypographyMuted className="text-sm">
								{currentUser?.client?.region}
							</TypographyMuted>
						</div>

						<div className="space-y-1">
							<Label className="text-sm font-medium">City</Label>
							<TypographyMuted className="text-sm">
								{currentUser?.client?.city}
							</TypographyMuted>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}
