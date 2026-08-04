import { ArrowLeft } from 'lucide-react'
import { Image } from '~/components/Image'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useState } from 'react'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'
import { getIdTypeLabel } from '~/lib/tenant.utils'

const renderRedactedField = (label: string, value?: string | null) => (
	<div className="py-3">
		<p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
			{label}
		</p>
		<p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
			{value || '—'}
		</p>
	</div>
)

function redactIdNumber(idNumber?: string | null) {
	if (!idNumber) return '—'
	const visible = idNumber.slice(-4)
	return `${'•'.repeat(Math.max(idNumber.length - 4, 4))}${visible}`
}

export function ExistingTenantPreview({
	tenant,
	onConfirm,
	onCancel,
	isSubmitting,
}: {
	tenant: {
		first_name?: string | null
		last_name?: string | null
		gender?: string | null
		id_type?: string | null
		id_number?: string | null
		profile_photo_url?: string | null
	}
	onConfirm: (currentAddress: string) => Promise<void>
	onCancel: () => void
	isSubmitting: boolean
}) {
	const [currentAddress, setCurrentAddress] = useState('')
	const [touched, setTouched] = useState(false)

	return (
		<div className="mx-auto my-8 space-y-8 md:max-w-2xl">
			<div className="space-y-2 border-b pb-6">
				<TypographyH2 className="text-2xl font-bold">Tenant Found</TypographyH2>
				<TypographyMuted className="text-base">
					This tenant already exists in your system. Confirm their identity and
					current address to continue.
				</TypographyMuted>
			</div>

			<div className="rounded-lg border bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
				<div className="flex items-center gap-4 border-b pb-4">
					{tenant.profile_photo_url && (
						<Image
							src={tenant.profile_photo_url}
							alt="Profile"
							className="h-16 w-16 rounded-full object-cover"
						/>
					)}
					<div>
						<p className="text-foreground font-semibold">
							{tenant.first_name} {tenant.last_name}
						</p>
						<p className="text-muted-foreground text-sm">
							Existing tenant on Placeholder
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-x-4 pt-2">
					{renderRedactedField('Gender', tenant.gender)}
					{renderRedactedField('ID Type', getIdTypeLabel(tenant.id_type))}
					<div className="col-span-2">
						{renderRedactedField('ID Number', redactIdNumber(tenant.id_number))}
					</div>
				</div>

				<p className="text-muted-foreground mt-2 text-xs">
					Other details are hidden to protect the tenant's privacy.
				</p>
			</div>

			<div className="rounded-lg border bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
				<Label className="text-sm font-semibold">
					Current Address <span className="text-rose-600">*</span>
				</Label>
				<TypographyMuted className="mt-1 mb-2 text-sm">
					We don't have this tenant's current address on file. Please enter it
					to complete the application.
				</TypographyMuted>
				<Input
					value={currentAddress}
					onChange={(e) => setCurrentAddress(e.target.value)}
					onBlur={() => setTouched(true)}
					placeholder="Enter current address"
					className={cn(
						touched &&
							!currentAddress.trim() &&
							'border-rose-500 focus-visible:ring-rose-500',
					)}
				/>
				{touched && !currentAddress.trim() && (
					<p className="mt-1.5 text-sm text-rose-600">
						Address is required to submit
					</p>
				)}
			</div>

			<div className="mt-10 flex items-center justify-between border-t pt-6">
				<Button onClick={onCancel} type="button" size="lg" variant="outline">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Go Back
				</Button>

				<Button
					type="button"
					size="lg"
					disabled={isSubmitting || !currentAddress.trim()}
					className="bg-rose-600 hover:bg-rose-700"
					onClick={() => onConfirm(currentAddress)}
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
		</div>
	)
}
