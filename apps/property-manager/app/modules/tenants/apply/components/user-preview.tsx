import { User, Mail, Globe, Briefcase } from 'lucide-react'
import type { CreatePropertyTenantApplicationInput } from '~/api/tenant-applications'
import { cn } from '~/lib/utils'

function InfoItem({
	label,
	value,
	span = false,
}: {
	label: string
	value?: React.ReactNode
	span?: boolean
}) {
	return (
		<div className={cn('rounded-lg bg-white p-3', span && 'md:col-span-2')}>
			<p className="text-xs font-medium text-slate-600 uppercase">{label}</p>
			<p className="mt-1 text-sm font-semibold text-slate-900">
				{value || '—'}
			</p>
		</div>
	)
}

function Section({
	icon,
	title,
	children,
}: {
	icon: React.ReactNode
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-5">
			<h4 className="flex items-center gap-2 font-semibold text-slate-900">
				{icon}
				{title}
			</h4>
			<div className="grid gap-4 md:grid-cols-2">{children}</div>
		</div>
	)
}

export function UserPreview({
	data,
}: {
	data: Partial<CreatePropertyTenantApplicationInput>
}) {
	return (
		<div className="space-y-8">
			{/* Personal */}
			<Section
				title="Personal Information"
				icon={<User className="h-4 w-4 text-rose-600" />}
			>
				<InfoItem label="First Name" value={data.first_name} />
				<InfoItem label="Last Name" value={data.last_name} />
				<InfoItem label="Gender" value={data.gender} />
				<InfoItem label="Date of Birth" value={data.date_of_birth} />
			</Section>

			{/* Contact */}
			<Section
				title="Contact Information"
				icon={<Mail className="h-4 w-4 text-rose-600" />}
			>
				<InfoItem label="Email" value={data.email} />
				<InfoItem label="Phone" value={data.phone} />
				<InfoItem
					label="Emergency Contact Name"
					value={data.emergency_contact_name}
				/>
				<InfoItem
					label="Emergency Phone"
					value={data.emergency_contact_phone}
				/>
			</Section>

			{/* Additional */}
			<Section
				title="Additional Details"
				icon={<Globe className="h-4 w-4 text-rose-600" />}
			>
				<InfoItem label="Nationality" value={data.nationality} />
				<InfoItem label="Marital Status" value={data.marital_status} />

				{data.current_address && (
					<InfoItem label="Current Address" value={data.current_address} span />
				)}
			</Section>

			{/* Employment */}
			<Section
				title="Employment Information"
				icon={<Briefcase className="h-4 w-4 text-rose-600" />}
			>
				<InfoItem label="Employment Type" value={data.employment_type} />
				<InfoItem label="Occupation" value={data.occupation} />
				<InfoItem label="Employer" value={data.employer} span />
			</Section>

			{/* Identity */}
			<Section
				title="Identity Information"
				icon={<User className="h-4 w-4 text-rose-600" />}
			>
				<InfoItem label="ID Type" value={data.id_type?.replace(/_/g, ' ')} />
				<InfoItem label="ID Number" value={data.id_number} />
			</Section>
		</div>
	)
}
