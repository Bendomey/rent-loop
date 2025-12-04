import { Edit } from 'lucide-react'
import { useState } from 'react'
import ConfirmDeletePropertyModule from './delete'
import { PermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Switch } from '~/components/ui/switch'
import {
	TypographyH3,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { useProperty } from '~/providers/property-provider'

export function PropertyGeneralSettingsModule() {
	const { clientUserProperty } = useProperty()

	const [openDeletePropertyModal, setOpenDeletePropertyModal] = useState(false)

	return (
		<div className="mx-auto max-w-4xl space-y-8 px-0 pt-0 pb-10 lg:px-4 lg:pt-1">
			<div className="space-y-1">
				<TypographyH3>General Settings</TypographyH3>
				<TypographyMuted>
					Update and manage your essential information.
				</TypographyMuted>
			</div>

			{/* Company Details */}
			<section className="bg-card grid gap-6 rounded-xl border p-3 shadow-sm md:p-6 lg:-space-y-2">
				<div className="flex items-center justify-between max-md:items-start max-sm:flex-col max-sm:gap-2">
					<TypographyH3>Basic Property Details</TypographyH3>
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
					<FieldLabel htmlFor="owner_company_name">Property Name</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="owner_company_name"
							placeholder="Enter your company name"
							value={clientUserProperty?.property?.name || ''}
							disabled
						/>
					</Field>
				</div>

				<div className="grid items-center gap-4 sm:grid-cols-3">
					<FieldLabel htmlFor="description">Description</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="description"
							placeholder="Enter description (optional)"
							value={clientUserProperty?.property?.description || ''}
							disabled
						/>
					</Field>
				</div>

				<div className="grid items-center gap-4 sm:grid-cols-3">
					<FieldLabel htmlFor="type">Type</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="type"
							placeholder="Single/ Multi"
							value={clientUserProperty?.property?.type || ''}
							disabled
						/>
					</Field>
				</div>
			</section>

			{/* Location */}
			<section className="bg-card grid gap-6 rounded-xl border p-3 shadow-sm md:p-6 lg:-space-y-2">
				<div className="flex items-center justify-between max-md:items-start max-sm:flex-col max-sm:gap-2">
					<div className="space-y-2">
						<TypographyH4 className="text-lg font-semibold">
							Location
						</TypographyH4>
						<FieldDescription className="text-muted-foreground text-sm">
							Changing the address updates the country, region, and city
							automatically.
						</FieldDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2 underline"
					>
						<Edit className="size-4" /> Edit Address
					</Button>
				</div>
				<Separator />

				{/* Address */}
				<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
					<FieldLabel htmlFor="owner_company_name">Address</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="owner_company_name"
							placeholder="Enter your company name"
							value={clientUserProperty?.property?.address || ''}
							disabled
						/>
					</Field>
				</div>

				<div className="grid gap-3 sm:grid-cols-3 sm:items-center">
					<FieldLabel htmlFor="owner_company_name">Country</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="owner_company_name"
							placeholder="Enter your company name"
							value={clientUserProperty?.property?.country || ''}
							disabled
						/>
					</Field>
				</div>

				<div className="grid items-center gap-4 sm:grid-cols-3">
					<FieldLabel htmlFor="description">Region</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="description"
							placeholder="Enter description (optional)"
							value={clientUserProperty?.property?.region || ''}
							disabled
						/>
					</Field>
				</div>

				<div className="grid items-center gap-4 sm:grid-cols-3">
					<FieldLabel htmlFor="description">City</FieldLabel>
					<Field className="sm:col-span-2">
						<Input
							id="description"
							placeholder="Enter description (optional)"
							value={clientUserProperty?.property?.city || ''}
							disabled
						/>
					</Field>
				</div>
			</section>

			<section className="bg-card grid gap-6 rounded-xl border p-3 shadow-sm md:p-6 lg:-space-y-2">
				<TypographyH3>Support Access</TypographyH3>
				<Separator />

				<div className="flex items-center justify-between">
					<Field className="">
						<FieldLabel htmlFor="support_access">Support Access</FieldLabel>
						<FieldDescription>
							Allow support agents to access this property to help troubleshoot
							issues.
						</FieldDescription>
					</Field>
					<Switch id="support_access" />
				</div>

				<PermissionGuard roles={['OWNER']}>
					<div className="flex items-center justify-between">
						<Field className="">
							<FieldLabel htmlFor="delete_property" className="text-rose-600">
								Delete Property
							</FieldLabel>
							<FieldDescription>
								Permanetly delete this property and all associated data.
							</FieldDescription>
						</Field>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => {
								setOpenDeletePropertyModal(true)
							}}
						>
							Delete Property
						</Button>
					</div>
				</PermissionGuard>
			</section>

			<ConfirmDeletePropertyModule
				opened={openDeletePropertyModal}
				setOpened={setOpenDeletePropertyModal}
				data={clientUserProperty?.property ?? undefined}
			/>
		</div>
	)
}
