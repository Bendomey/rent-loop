import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const ID_TYPES = [
	'National ID/Ghana Card',
	'Passport',
	"Driver's License",
] as const

const GENDERS = ['Male', 'Female'] as const

const guestSchema = z.object({
	first_name: z.string().min(1, 'Required'),
	last_name: z.string().min(1, 'Required'),
	gender: z.string().min(1, 'Required'),
	phone: z.string().min(7, 'Enter a valid phone number'),
	email: z
		.string()
		.optional()
		.refine((v) => !v || z.string().email().safeParse(v).success, {
			message: 'Enter a valid email',
		}),
	id_type: z.string().min(1, 'Required'),
	id_number: z.string().min(1, 'Required'),
})

export type GuestFormValues = z.infer<typeof guestSchema>

interface Props {
	onValuesChange: (values: GuestFormValues | null) => void
}

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500'

function Label({
	children,
	optional,
}: {
	children: React.ReactNode
	optional?: boolean
}) {
	return (
		<label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
			{children}
			{optional && (
				<span className="text-xs font-normal text-zinc-400">(optional)</span>
			)}
		</label>
	)
}

export function GuestInfoForm({ onValuesChange }: Props) {
	const {
		register,
		watch,
		formState: { errors, isValid },
	} = useForm<GuestFormValues>({
		resolver: zodResolver(guestSchema),
		mode: 'onChange',
	})

	const values = watch()

	useEffect(() => {
		onValuesChange(isValid ? values : null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isValid, JSON.stringify(values)])

	return (
		<div className="space-y-6">
			<h3 className="text-base font-semibold text-zinc-900">
				Guest Information
			</h3>

			{/* Personal details */}
			<div className="space-y-1.5">
				<p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
					Personal details
				</p>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<Label>First name</Label>
						<input {...register('first_name')} className={inputClass} />
						{errors.first_name && (
							<p className="mt-1 text-xs text-red-500">
								{errors.first_name.message}
							</p>
						)}
					</div>
					<div>
						<Label>Last name</Label>
						<input {...register('last_name')} className={inputClass} />
						{errors.last_name && (
							<p className="mt-1 text-xs text-red-500">
								{errors.last_name.message}
							</p>
						)}
					</div>
					<div>
						<Label>Gender</Label>
						<select {...register('gender')} className={inputClass}>
							<option value="">Select gender</option>
							{GENDERS.map((g) => (
								<option key={g} value={g.toUpperCase()}>
									{g}
								</option>
							))}
						</select>
						{errors.gender && (
							<p className="mt-1 text-xs text-red-500">
								{errors.gender.message}
							</p>
						)}
					</div>
					<div>
						<Label>Phone</Label>
						<input {...register('phone')} type="tel" className={inputClass} />
						{errors.phone && (
							<p className="mt-1 text-xs text-red-500">
								{errors.phone.message}
							</p>
						)}
					</div>
					<div className="sm:col-span-2">
						<Label optional>Email</Label>
						<input {...register('email')} type="email" className={inputClass} />
						{errors.email && (
							<p className="mt-1 text-xs text-red-500">
								{errors.email.message}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Identification */}
			<div className="space-y-1.5">
				<p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
					Identification
				</p>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<Label>ID type</Label>
						<select {...register('id_type')} className={inputClass}>
							<option value="">Select ID type</option>
							{ID_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
						{errors.id_type && (
							<p className="mt-1 text-xs text-red-500">
								{errors.id_type.message}
							</p>
						)}
					</div>
					<div>
						<Label>ID number</Label>
						<input {...register('id_number')} className={inputClass} />
						{errors.id_number && (
							<p className="mt-1 text-xs text-red-500">
								{errors.id_number.message}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
