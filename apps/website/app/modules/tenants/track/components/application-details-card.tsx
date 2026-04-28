import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ChevronDown, Pencil, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { useFetcher } from 'react-router'
import { z } from 'zod'

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { formatPhoneWithCountryCode } from '~/lib/misc'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { cn } from '~/lib/utils'

type EmployerType = 'STUDENT' | 'WORKER'

const editSchema = z
	.object({
		first_name: z
			.string({ error: 'First name is required' })
			.min(2, 'Please enter a valid name'),
		last_name: z
			.string({ error: 'Last name is required' })
			.min(2, 'Please enter a valid name'),
		email: z
			.string()
			.email('Please enter a valid email address')
			.optional()
			.or(z.literal('')),
		gender: z.enum(['MALE', 'FEMALE'], { error: 'Please select a gender' }),
		date_of_birth: z
			.string({ error: 'Date of birth is required' })
			.min(1, 'Date of birth is required'),
		nationality: z.string().optional(),
		marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
			error: 'Please select a marital status',
		}),
		current_address: z.string().optional(),
		id_type: z.enum(
			['GHANA_CARD', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'],
			{ error: 'Please select an ID type' },
		),
		id_number: z
			.string({ error: 'ID number is required' })
			.min(1, 'ID number is required'),
		emergency_contact_name: z
			.string({ error: 'Contact name is required' })
			.min(2, 'Please enter a valid name'),
		emergency_contact_phone: z
			.string({ error: 'Contact phone is required' })
			.min(9, 'Please enter a valid phone number'),
		relationship_to_emergency_contact: z.string().optional(),
		employer_type: z.enum(['WORKER', 'STUDENT'], {
			error: 'Please select an employment type',
		}),
		occupation: z.string().optional(),
		employer: z
			.string({ error: 'This field is required' })
			.min(2, 'Please enter a valid name'),
	})
	.superRefine((data, ctx) => {
		if (data.employer_type === 'WORKER' && !data.occupation?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Please enter your occupation',
				path: ['occupation'],
			})
		}
	})

type EditSchema = z.infer<typeof editSchema>

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

function Req() {
	return <span className="text-destructive"> *</span>
}

interface EditFormProps {
	application: TrackingApplication
	code: string
	onClose: () => void
	onSaved: (updated: TrackingApplication) => void
}

function EditForm({ application, onClose, onSaved }: EditFormProps) {
	const fetcher = useFetcher<{
		application?: TrackingApplication | null
		error?: string | null
	}>()
	const isSubmitting = fetcher.state !== 'idle'

	const rhf = useForm<EditSchema>({
		resolver: zodResolver(editSchema) as Resolver<EditSchema>,
		defaultValues: {
			first_name: application.first_name ?? '',
			last_name: application.last_name ?? '',
			email: application.email ?? '',
			gender: (application.gender as EditSchema['gender']) ?? undefined,
			date_of_birth: application.date_of_birth
				? dayjs(application.date_of_birth).format('YYYY-MM-DD')
				: '',
			nationality: application.nationality ?? '',
			marital_status:
				(application.marital_status as EditSchema['marital_status']) ??
				undefined,
			current_address: application.current_address ?? '',
			id_type: (application.id_type as EditSchema['id_type']) ?? undefined,
			id_number: application.id_number ?? '',
			emergency_contact_name: application.emergency_contact_name ?? '',
			emergency_contact_phone: application.emergency_contact_phone ?? '',
			relationship_to_emergency_contact:
				application.relationship_to_emergency_contact ?? '',
			employer_type:
				application.employer_type === 'STUDENT' ? 'STUDENT' : 'WORKER',
			occupation: application.occupation ?? '',
			employer: application.employer ?? '',
		},
	})

	const isStudent = rhf.watch('employer_type') === 'STUDENT'

	useEffect(() => {
		if (fetcher.data?.application) {
			onSaved({
				...fetcher.data.application,
				employer_type: rhf.getValues('employer_type'),
			})
		}
	}, [fetcher.data, onSaved])

	const onSubmit = (data: EditSchema) => {
		const fd = new FormData()
		fd.append('intent', 'updateApplication')
		for (const [key, val] of Object.entries(data)) {
			if (val == null || val === '') continue
			if (key === 'emergency_contact_phone') {
				const formatted = formatPhoneWithCountryCode(val)
				if (formatted) fd.append(key, formatted)
			} else {
				fd.append(key, val)
			}
		}
		void fetcher.submit(fd, { method: 'post' })
	}

	return (
		<Form {...rhf}>
			<form
				onSubmit={rhf.handleSubmit(onSubmit)}
				className="divide-y border-t [&_[data-slot=form-item]]:gap-1 [&_[data-slot=form-label]]:text-xs [&_[data-slot=form-label]]:font-normal [&_[data-slot=form-label]]:text-zinc-500 [&_[data-slot=form-message]]:text-xs"
			>
				{/* Personal */}
				<div className="space-y-3 px-6 py-5">
					<p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Personal
					</p>
					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={rhf.control}
							name="first_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										First Name <Req />
									</FormLabel>
									<FormControl>
										<Input placeholder="First name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={rhf.control}
							name="last_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Last Name <Req />
									</FormLabel>
									<FormControl>
										<Input placeholder="Last name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={rhf.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" placeholder="Email address" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={rhf.control}
							name="gender"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Gender <Req />
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl className="w-full">
											<SelectTrigger>
												<SelectValue placeholder="Select gender" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="MALE">Male</SelectItem>
											<SelectItem value="FEMALE">Female</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={rhf.control}
							name="date_of_birth"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Date of Birth <Req />
									</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={rhf.control}
							name="nationality"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nationality</FormLabel>
									<FormControl>
										<Input placeholder="Nationality" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={rhf.control}
							name="marital_status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Marital Status <Req />
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl className="w-full">
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="SINGLE">Single</SelectItem>
											<SelectItem value="MARRIED">Married</SelectItem>
											<SelectItem value="DIVORCED">Divorced</SelectItem>
											<SelectItem value="WIDOWED">Widowed</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={rhf.control}
						name="current_address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Current Address</FormLabel>
								<FormControl>
									<Input placeholder="Current address" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Identity */}
				<div className="space-y-3 px-6 py-5">
					<p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Identity
					</p>
					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={rhf.control}
							name="id_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										ID Type <Req />
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl className="w-full">
											<SelectTrigger>
												<SelectValue placeholder="Select ID type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="GHANA_CARD">Ghana Card</SelectItem>
											<SelectItem value="NATIONAL_ID">National ID</SelectItem>
											<SelectItem value="PASSPORT">Passport</SelectItem>
											<SelectItem value="DRIVER_LICENSE">
												Driver's License
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={rhf.control}
							name="id_number"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										ID Number <Req />
									</FormLabel>
									<FormControl>
										<Input placeholder="ID number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Emergency Contact */}
				<div className="space-y-3 px-6 py-5">
					<p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Emergency Contact
					</p>
					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={rhf.control}
							name="emergency_contact_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Full Name <Req />
									</FormLabel>
									<FormControl>
										<Input placeholder="Full name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={rhf.control}
							name="emergency_contact_phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Phone <Req />
									</FormLabel>
									<FormControl>
										<Input type="tel" placeholder="Phone number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={rhf.control}
						name="relationship_to_emergency_contact"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Relationship</FormLabel>
								<FormControl>
									<Input placeholder="e.g. Sibling, Parent" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Employment */}
				<div className="space-y-3 px-6 py-5">
					<p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Employment
					</p>
					<div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 md:w-1/2">
						{(['WORKER', 'STUDENT'] as EmployerType[]).map((type) => (
							<button
								key={type}
								type="button"
								onClick={() =>
									rhf.setValue('employer_type', type, { shouldValidate: true })
								}
								className={cn(
									'w-full rounded-md px-4 py-1 text-sm font-medium transition-all',
									rhf.watch('employer_type') === type
										? 'bg-white text-zinc-900 shadow-sm'
										: 'text-zinc-500 hover:text-zinc-700',
								)}
							>
								{type === 'WORKER' ? 'Worker' : 'Student'}
							</button>
						))}
					</div>

					<div
						className={cn(
							'grid gap-3',
							isStudent ? 'grid-cols-1' : 'grid-cols-2',
						)}
					>
						{!isStudent && (
							<FormField
								control={rhf.control}
								name="occupation"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Occupation <Req />
										</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Software Engineer" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={rhf.control}
							name="employer"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{isStudent ? 'Institution / School' : 'Employer'} <Req />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={
												isStudent
													? 'Institution or school name'
													: 'Company name'
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between gap-2 px-6 py-4 pt-5">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="w-full rounded-lg border py-2 text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
					>
						Cancel
					</button>
					{fetcher.data?.error && (
						<p className="text-sm text-red-600">{fetcher.data.error}</p>
					)}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
					>
						{isSubmitting ? 'Saving…' : 'Save Changes'}
					</button>
				</div>
			</form>
		</Form>
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
