import dayjs from 'dayjs'
import { ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'

import { cn } from '~/lib/utils'

interface Props {
	application: TrackingApplication
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
			<span className="shrink-0 text-slate-500">{label}</span>
			<span className="text-right font-medium text-slate-800">{value}</span>
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
			<p className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
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

export function ApplicationDetailsCard({ application }: Props) {
	const [open, setOpen] = useState(false)
	const detailsRef = useRef<HTMLDivElement>(null)

	const fullName = [
		application.first_name,
		application.other_names,
		application.last_name,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div className="overflow-hidden rounded-lg border bg-white">
			{/* Brief — always visible */}
			<div className="p-6">
				<p className="text-xs font-medium text-slate-400">Applicant Details</p>
				<p className="mt-0.5 text-base font-bold text-slate-900">{fullName}</p>

				<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
					{application.phone && <span>{application.phone}</span>}
					{application.email && <span>{application.email}</span>}
				</div>

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
			</div>

			{/* Expandable details */}
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
								application.gender ? formatGender(application.gender) : null
							}
						/>
						<Row
							label="Date of Birth"
							value={
								application.date_of_birth
									? dayjs(application.date_of_birth).format('LL')
									: null
							}
						/>
						<Row label="Nationality" value={application.nationality} />
						<Row
							label="Marital Status"
							value={
								application.marital_status
									? formatMaritalStatus(application.marital_status)
									: null
							}
						/>
						<Row label="Current Address" value={application.current_address} />
					</Section>

					{(application.id_type || application.id_number) && (
						<Section title="Identity">
							<Row
								label="ID Type"
								value={
									application.id_type ? formatIdType(application.id_type) : null
								}
							/>
							<Row label="ID Number" value={application.id_number} />
						</Section>
					)}

					<Section title="Employment">
						<Row label="Occupation" value={application.occupation} />
						<Row label="Employer" value={application.employer} />
						<Row label="Work Address" value={application.occupation_address} />
					</Section>

					<Section title="Emergency Contact">
						<Row label="Name" value={application.emergency_contact_name} />
						<Row label="Phone" value={application.emergency_contact_phone} />
						<Row
							label="Relationship"
							value={application.relationship_to_emergency_contact}
						/>
					</Section>

					{(application.previous_landlord_name ||
						application.previous_landlord_phone ||
						application.previous_tenancy_period) && (
						<Section title="Rental History">
							<Row
								label="Previous Landlord"
								value={application.previous_landlord_name}
							/>
							<Row
								label="Landlord Phone"
								value={application.previous_landlord_phone}
							/>
							<Row
								label="Tenancy Period"
								value={application.previous_tenancy_period}
							/>
						</Section>
					)}
				</div>
			</div>
		</div>
	)
}
