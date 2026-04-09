import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

const Schema = z.object({
	first_name: z.string({ error: 'Required' }).min(2),
	other_names: z.string().optional(),
	last_name: z.string({ error: 'Required' }).min(2),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phone: z.string({ error: 'Required' }).min(9),
	gender: z.enum(['Male', 'Female'], { error: 'Required' }),
	date_of_birth: z.date({ error: 'Required' }),
	nationality: z.string({ error: 'Required' }).min(2),
	marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed'], {
		error: 'Required',
	}),
	current_address: z.string({ error: 'Required' }).min(3),
	id_type: z.enum(['NationalID', 'Passport', 'DriverLicense'], {
		error: 'Required',
	}),
	id_number: z.string({ error: 'Required' }).min(2),
	emergency_contact_name: z.string({ error: 'Required' }).min(2),
	emergency_contact_phone: z.string({ error: 'Required' }).min(9),
	relationship_to_emergency_contact: z.string({ error: 'Required' }).min(2),
	occupation: z.string().optional(),
	employer: z.string().optional(),
})

export type Step2Values = z.infer<typeof Schema>

interface Step2Props {
	initialValues?: Partial<Step2Values>
	onNext: (values: Step2Values) => void
	onBack: () => void
	onCancel: () => void
}

export function WizardStep2({
	initialValues,
	onNext,
	onBack,
	onCancel,
}: Step2Props) {
	const form = useForm<Step2Values>({
		resolver: zodResolver(Schema),
		defaultValues: {
			...initialValues,
			date_of_birth: initialValues?.date_of_birth
				? new Date(initialValues.date_of_birth)
				: undefined,
		},
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onNext)}
				className="mx-auto mb-10 space-y-6 md:max-w-2xl"
			>
				<div className="mt-10 space-y-2 border-b pb-6">
					<TypographyH2 className="text-2xl font-bold">
						Tenant Information
					</TypographyH2>
					<TypographyMuted>Basic details about the tenant.</TypographyMuted>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="first_name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>First Name *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="last_name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Last Name *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="other_names"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Other Names</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Gender *</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select gender" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="Male">Male</SelectItem>
										<SelectItem value="Female">Female</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="date_of_birth"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date of Birth *</FormLabel>
								<DatePickerInput
									value={
										field.value
											? localizedDayjs(field.value).toDate()
											: undefined
									}
									onChange={(d) => field.onChange(d)}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="nationality"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nationality *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="marital_status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Marital Status *</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{['Single', 'Married', 'Divorced', 'Widowed'].map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="current_address"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>Current Address *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-2 border-t pt-4">
					<p className="text-base font-semibold">ID Information</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="id_type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Type *</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select ID type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="NationalID">National ID</SelectItem>
										<SelectItem value="Passport">Passport</SelectItem>
										<SelectItem value="DriverLicense">
											Driver License
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="id_number"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Number *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-2 border-t pt-4">
					<p className="text-base font-semibold">Emergency Contact</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="emergency_contact_name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact Name *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emergency_contact_phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact Phone *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="relationship_to_emergency_contact"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Relationship *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-2 border-t pt-4">
					<p className="text-base font-semibold">Employment (Optional)</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="occupation"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Occupation</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="employer"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Employer / School</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex items-center justify-between border-t pt-6">
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onCancel}>
							Back to Overview
						</Button>
						<Button type="button" variant="ghost" onClick={onBack}>
							<ArrowLeft className="mr-1 h-4 w-4" /> Back
						</Button>
					</div>
					<Button
						type="submit"
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
