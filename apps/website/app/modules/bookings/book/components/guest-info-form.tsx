import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const guestSchema = z.object({
	first_name: z.string().min(1, 'Required'),
	last_name: z.string().min(1, 'Required'),
	phone: z.string().min(7, 'Enter a valid phone number'),
	email: z.string().email('Enter a valid email'),
	id_number: z.string().min(1, 'Required'),
})

export type GuestFormValues = z.infer<typeof guestSchema>

interface Props {
	onValuesChange: (values: GuestFormValues | null) => void
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
		<div className="space-y-4">
			<h3 className="text-base font-semibold text-zinc-900">
				Guest Information
			</h3>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						First name
					</label>
					<input
						{...register('first_name')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.first_name && (
						<p className="mt-1 text-xs text-red-500">
							{errors.first_name.message}
						</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Last name
					</label>
					<input
						{...register('last_name')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.last_name && (
						<p className="mt-1 text-xs text-red-500">
							{errors.last_name.message}
						</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Phone
					</label>
					<input
						{...register('phone')}
						type="tel"
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.phone && (
						<p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Email
					</label>
					<input
						{...register('email')}
						type="email"
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.email && (
						<p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
					)}
				</div>
				<div className="sm:col-span-2">
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						ID number
					</label>
					<input
						{...register('id_number')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.id_number && (
						<p className="mt-1 text-xs text-red-500">
							{errors.id_number.message}
						</p>
					)}
				</div>
			</div>
		</div>
	)
}
