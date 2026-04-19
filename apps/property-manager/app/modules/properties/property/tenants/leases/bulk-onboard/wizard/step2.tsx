import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
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

const Schema = z.object({
	phone: z.string({ error: 'Phone is required' }).min(9, 'Phone is required'),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	gender: z.enum(['MALE', 'FEMALE']).optional(),
	date_of_birth: z.date().optional(),
	nationality: z.string().optional(),
	marital_status: z
		.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])
		.optional(),
	id_type: z
		.enum(['GHANA_CARD', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'])
		.optional(),
	id_number: z.string().optional(),
	current_address: z.string().optional(),
	occupation: z.string().optional(),
	employer: z.string().optional(),
})

export type Step2Values = z.infer<typeof Schema>

interface Step2Props {
	initialValues?: Partial<Step2Values>
	onSave: (values: Step2Values) => void
	onBack: () => void
	onCancel: () => void
}

export function WizardStep2({
	initialValues,
	onSave,
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
				onSubmit={form.handleSubmit(onSave)}
				className="mx-auto mb-10 space-y-6 md:max-w-2xl"
			>
				<div className="mt-10 space-y-2 border-b pb-6">
					<TypographyH2 className="text-2xl font-bold">
						Tenant Information
					</TypographyH2>
					<TypographyMuted>
						Only phone number is required. Tenants will be sent a link to
						complete any missing details.
					</TypographyMuted>
				</div>

				<div className="space-y-4 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
					<p className="text-sm font-semibold">Contact</p>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Phone <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="+233201234567" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="first_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input placeholder="John" {...field} />
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
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input placeholder="Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="john.doe@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-4 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
					<p className="text-sm font-semibold">Personal Details</p>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="gender"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gender</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
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
							control={form.control}
							name="date_of_birth"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date of Birth</FormLabel>
									<FormControl>
										<DatePickerInput
											value={field.value}
											onChange={field.onChange}
											placeholder="Select date"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="nationality"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nationality</FormLabel>
									<FormControl>
										<Input placeholder="Ghanaian" {...field} />
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
									<FormLabel>Marital Status</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
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
						control={form.control}
						name="current_address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Current Address</FormLabel>
								<FormControl>
									<Input placeholder="123 Main St, Accra" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-4 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
					<p className="text-sm font-semibold">Identity</p>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="id_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select ID type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="GHANA_CARD">Ghana Card</SelectItem>
											<SelectItem value="NATIONAL_ID">National ID</SelectItem>
											<SelectItem value="PASSPORT">Passport</SelectItem>
											<SelectItem value="DRIVER_LICENSE">
												Driver&apos;s License
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
									<FormLabel>ID Number</FormLabel>
									<FormControl>
										<Input placeholder="GHA-123456789" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="space-y-4 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
					<p className="text-sm font-semibold">Occupation</p>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="occupation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Occupation</FormLabel>
									<FormControl>
										<Input placeholder="Software Engineer" {...field} />
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
									<FormLabel>Employer</FormLabel>
									<FormControl>
										<Input placeholder="Acme Corp" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between border-t pt-6">
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onBack}>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back
						</Button>
						<Button type="button" variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
					</div>
					<Button
						type="submit"
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
					>
						<Save className="mr-2 h-4 w-4" /> Save Tenant
					</Button>
				</div>
			</form>
		</Form>
	)
}
