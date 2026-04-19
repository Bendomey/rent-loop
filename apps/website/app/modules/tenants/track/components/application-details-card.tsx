import dayjs from 'dayjs'
import { ChevronDown, Pencil, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useFetcher } from 'react-router'

import { cn } from '~/lib/utils'

interface Props {
	application: TrackingApplication
	code: string
	onUpdated?: (updated: TrackingApplication) => void
}

function Row({
	label,
	value,
}: {
	label: string
	value: string | null | undefined
}) {
	if (!value) return null
	return (
		<div className="flex justify-between gap-4 py-2 text-sm">
			<span className="shrink-0 text-zinc-500">{label}</span>
			<span className="text-right font-medium text-zinc-800">{value}</span>
		</div>
	)
}

function Section({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<div>
			<p className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
				{title}
			</p>
			<div className="divide-y rounded-md border px-3">{children}</div>
		</div>
	)
}

function formatGender(g: string) {
	return g.charAt(0) + g.slice(1).toLowerCase()
}

function formatMaritalStatus(s: string) {
	return s.charAt(0) + s.slice(1).toLowerCase()
}

function formatIdType(t: string) {
	return t.replace(/_/g, ' ')
}

interface EditFormProps {
	application: TrackingApplication
	code: string
	onClose: () => void
	onSaved: (updated: TrackingApplication) => void
}

function EditForm({ application, code, onClose, onSaved }: EditFormProps) {
	const fetcher = useFetcher<{
		application?: TrackingApplication | null
		error?: string | null
	}>()
	const isSubmitting = fetcher.state !== 'idle'

	// When we get a successful result back, notify parent and close
	useEffect(() => {
		if (fetcher.data?.application) {
			onSaved(fetcher.data.application)
		}
	}, [fetcher.data, onSaved])

	return (
		<fetcher.Form method="post" className="space-y-4 border-t px-6 py-5">
			<input type="hidden" name="intent" value="updateApplication" />

			<div className="grid grid-cols-2 gap-3">
				<Field
					label="First Name"
					name="first_name"
					defaultValue={application.first_name ?? ''}
				/>
				<Field
					label="Last Name"
					name="last_name"
					defaultValue={application.last_name ?? ''}
				/>
			</div>

			<Field
				label="Email"
				name="email"
				type="email"
				defaultValue={application.email ?? ''}
			/>

			<div className="grid grid-cols-2 gap-3">
				<SelectField
					label="Gender"
					name="gender"
					defaultValue={application.gender ?? ''}
					options={[
						{ value: 'MALE', label: 'Male' },
						{ value: 'FEMALE', label: 'Female' },
					]}
				/>
				<Field
					label="Date of Birth"
					name="date_of_birth"
					type="date"
					defaultValue={
						application.date_of_birth
							? dayjs(application.date_of_birth).format('YYYY-MM-DD')
							: ''
					}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Nationality"
					name="nationality"
					defaultValue={application.nationality ?? ''}
				/>
				<SelectField
					label="Marital Status"
					name="marital_status"
					defaultValue={application.marital_status ?? ''}
					options={[
						{ value: 'SINGLE', label: 'Single' },
						{ value: 'MARRIED', label: 'Married' },
						{ value: 'DIVORCED', label: 'Divorced' },
						{ value: 'WIDOWED', label: 'Widowed' },
					]}
				/>
			</div>

			<Field
				label="Current Address"
				name="current_address"
				defaultValue={application.current_address ?? ''}
			/>

			<div className="grid grid-cols-2 gap-3">
				<SelectField
					label="ID Type"
					name="id_type"
					defaultValue={application.id_type ?? ''}
					options={[
						{ value: 'GHANA_CARD', label: 'Ghana Card' },
						{ value: 'NATIONAL_ID', label: 'National ID' },
						{ value: 'PASSPORT', label: 'Passport' },
						{ value: 'DRIVER_LICENSE', label: "Driver's License" },
					]}
				/>
				<Field
					label="ID Number"
					name="id_number"
					defaultValue={application.id_number ?? ''}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Emergency Contact Name"
					name="emergency_contact_name"
					defaultValue={application.emergency_contact_name ?? ''}
				/>
				<Field
					label="Emergency Contact Phone"
					name="emergency_contact_phone"
					defaultValue={application.emergency_contact_phone ?? ''}
				/>
			</div>

			<Field
				label="Relationship to Emergency Contact"
				name="relationship_to_emergency_contact"
				defaultValue={application.relationship_to_emergency_contact ?? ''}
			/>

			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Occupation"
					name="occupation"
					defaultValue={application.occupation ?? ''}
				/>
				<Field
					label="Employer"
					name="employer"
					defaultValue={application.employer ?? ''}
				/>
			</div>

			{fetcher.data?.error && (
				<p className="text-sm text-red-600">{fetcher.data.error}</p>
			)}

			<div className="flex gap-2 border-t pt-4">
				<button
					type="submit"
					disabled={isSubmitting}
					className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{isSubmitting ? 'Saving…' : 'Save Changes'}
				</button>
				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="flex-1 rounded-lg border py-2 text-sm font-medium text-zinc-700"
				>
					Cancel
				</button>
			</div>
		</fetcher.Form>
	)
}

function Field({
	label,
	name,
	type = 'text',
	defaultValue,
}: {
	label: string
	name: string
	type?: string
	defaultValue?: string
}) {
	return (
		<div className="flex flex-col gap-1">
			<label htmlFor={name} className="text-xs text-zinc-500">
				{label}
			</label>
			<input
				id={name}
				name={name}
				type={type}
				defaultValue={defaultValue}
				className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
			/>
		</div>
	)
}

function SelectField({
	label,
	name,
	defaultValue,
	options,
}: {
	label: string
	name: string
	defaultValue?: string
	options: { value: string; label: string }[]
}) {
	return (
		<div className="flex flex-col gap-1">
			<label htmlFor={name} className="text-xs text-zinc-500">
				{label}
			</label>
			<select
				id={name}
				name={name}
				defaultValue={defaultValue}
				className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
			>
				<option value="">— Select —</option>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	)
}

function isPersonalInfoIncomplete(application: TrackingApplication) {
	return (
		!application.first_name ||
		!application.last_name ||
		!application.gender ||
		!application.date_of_birth ||
		!application.nationality ||
		!application.marital_status ||
		!application.id_number ||
		!application.current_address ||
		!application.emergency_contact_name ||
		!application.emergency_contact_phone
	)
}

export function ApplicationDetailsCard({
	application,
	code,
	onUpdated,
}: Props) {
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(false)
	const detailsRef = useRef<HTMLDivElement>(null)
	const [localApplication, setLocalApplication] = useState(application)

	const isCSVCreated = localApplication.source === 'CSV_BULK'
	const isIncomplete = isPersonalInfoIncomplete(localApplication)

	const fullName = [
		localApplication.first_name,
		localApplication.other_names,
		localApplication.last_name,
	]
		.filter(Boolean)
		.join(' ')

	const handleSaved = (updated: TrackingApplication) => {
		setLocalApplication(updated)
		setEditing(false)
		onUpdated?.(updated)
	}

	return (
		<div className="overflow-hidden rounded-lg border bg-white">
			{/* CSV-created banner */}
			{isCSVCreated && isIncomplete && !editing && (
				<div className="border-b bg-amber-50 px-6 py-3 text-sm text-amber-800">
					<p className="font-medium">Your profile is incomplete</p>
					<p className="mt-0.5 text-xs">
						Your landlord started this application. Please fill in your details
						below so your application can be processed.
					</p>
				</div>
			)}

			{/* Brief — always visible */}
			<div className="p-6">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs font-medium text-zinc-400">
							Applicant Details
						</p>
						<p className="mt-0.5 text-base font-bold text-zinc-900">
							{fullName || localApplication.phone}
						</p>
					</div>
					{!editing && (
						<button
							onClick={() => {
								setEditing(true)
								setOpen(false)
							}}
							className="flex items-center gap-1 text-xs font-medium text-rose-600 transition-colors hover:text-rose-500"
							aria-label="Edit personal details"
						>
							<Pencil className="h-3 w-3" /> Edit
						</button>
					)}
					{editing && (
						<button
							onClick={() => setEditing(false)}
							className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
							aria-label="Cancel editing"
						>
							<X className="h-3 w-3" /> Cancel
						</button>
					)}
				</div>

				<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
					{localApplication.phone && <span>{localApplication.phone}</span>}
					{localApplication.email && <span>{localApplication.email}</span>}
				</div>

				{!editing && (
					<button
						onClick={() => setOpen((o) => !o)}
						className="mt-4 flex items-center gap-1 text-xs font-medium text-rose-600 transition-colors hover:text-rose-500"
					>
						{open ? 'Show less' : 'View more'}
						<ChevronDown
							className={cn(
								'h-3.5 w-3.5 transition-transform duration-300',
								open && 'rotate-180',
							)}
						/>
					</button>
				)}
			</div>

			{/* Edit form */}
			{editing && (
				<EditForm
					application={localApplication}
					code={code}
					onClose={() => setEditing(false)}
					onSaved={handleSaved}
				/>
			)}

			{/* Expandable details */}
			{!editing && (
				<div
					ref={detailsRef}
					style={{
						maxHeight: open
							? (detailsRef.current?.scrollHeight ?? 9999) + 'px'
							: '0px',
					}}
					className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
				>
					<div className="space-y-5 border-t px-6 py-5">
						<Section title="Personal">
							<Row
								label="Gender"
								value={
									localApplication.gender
										? formatGender(localApplication.gender)
										: null
								}
							/>
							<Row
								label="Date of Birth"
								value={
									localApplication.date_of_birth
										? dayjs(localApplication.date_of_birth).format('LL')
										: null
								}
							/>
							<Row label="Nationality" value={localApplication.nationality} />
							<Row
								label="Marital Status"
								value={
									localApplication.marital_status
										? formatMaritalStatus(localApplication.marital_status)
										: null
								}
							/>
							<Row
								label="Current Address"
								value={localApplication.current_address}
							/>
						</Section>

						{(localApplication.id_type || localApplication.id_number) && (
							<Section title="Identity">
								<Row
									label="ID Type"
									value={
										localApplication.id_type
											? formatIdType(localApplication.id_type)
											: null
									}
								/>
								<Row label="ID Number" value={localApplication.id_number} />
							</Section>
						)}

						<Section title="Employment">
							<Row label="Occupation" value={localApplication.occupation} />
							<Row label="Employer" value={localApplication.employer} />
							<Row
								label="Work Address"
								value={localApplication.occupation_address}
							/>
						</Section>

						<Section title="Emergency Contact">
							<Row
								label="Name"
								value={localApplication.emergency_contact_name}
							/>
							<Row
								label="Phone"
								value={localApplication.emergency_contact_phone}
							/>
							<Row
								label="Relationship"
								value={localApplication.relationship_to_emergency_contact}
							/>
						</Section>

						{(localApplication.previous_landlord_name ||
							localApplication.previous_landlord_phone ||
							localApplication.previous_tenancy_period) && (
							<Section title="Rental History">
								<Row
									label="Previous Landlord"
									value={localApplication.previous_landlord_name}
								/>
								<Row
									label="Landlord Phone"
									value={localApplication.previous_landlord_phone}
								/>
								<Row
									label="Tenancy Period"
									value={localApplication.previous_tenancy_period}
								/>
							</Section>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
