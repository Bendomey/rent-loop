import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, MapPin, Pencil, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { InfoRow } from './info-row'
import { useUpdateTenant } from '~/api/tenants'
import { DatePickerInput } from '~/components/date-picker-input'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
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
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	nationality: z.string().trim().min(1, 'Nationality is required'),
	marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
		message: 'Please select a marital status',
	}),
	date_of_birth: z.date({ message: 'Date of birth is required' }),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantProfileBasicInformationCard({
	tenant,
}: {
	tenant: Tenant
}) {
	const revalidator = useRevalidator()
	const [isOpen, setIsOpen] = useState(false)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			nationality: safeString(tenant.nationality),
			marital_status: tenant.marital_status || 'SINGLE',
			date_of_birth: tenant.date_of_birth
				? new Date(tenant.date_of_birth)
				: undefined,
		},
	})

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenant()

	const handleOpenChange = (open: boolean) => {
		if (open) {
			reset({
				nationality: safeString(tenant.nationality),
				marital_status: tenant.marital_status || 'SINGLE',
				date_of_birth: tenant.date_of_birth
					? new Date(tenant.date_of_birth)
					: undefined,
			})
		}
		setIsOpen(open)
	}

	const onSubmit = (data: FormSchema) => {
		mutate(
			{
				tenant_id: tenant.id,
				data,
			},
			{
				onError: () => {
					toast.error('Failed to update basic information. Try again later.')
				},
				onSuccess: () => {
					toast.success('Basic information updated successfully.')
					void revalidator.revalidate()
					setIsOpen(false)
				},
			},
		)
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					Basic Information
				</CardTitle>
				<CardAction>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleOpenChange(true)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					</PropertyPermissionGuard>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4">
				<Separator />
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<InfoRow
						icon={<Calendar size={18} />}
						label="Date of Birth"
						value={
							tenant?.date_of_birth
								? localizedDayjs(tenant.date_of_birth).format('DD MMM YYYY')
								: 'N/A'
						}
					/>
					<InfoRow
						icon={<User size={18} />}
						label="Marital Status"
						value={tenant?.marital_status}
					/>
					<InfoRow
						icon={<MapPin size={18} />}
						label="Nationality"
						value={tenant?.nationality}
					/>
					<InfoRow
						icon={<Calendar size={18} />}
						label="Record Created"
						value={
							tenant?.created_at
								? localizedDayjs(tenant.created_at).format('DD MMM YYYY')
								: 'N/A'
						}
					/>
					<InfoRow
						icon={<Calendar size={18} />}
						label="Last Updated"
						value={
							tenant?.updated_at
								? localizedDayjs(tenant.updated_at).format('DD MMM YYYY')
								: 'N/A'
						}
					/>
				</div>
			</CardContent>

			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Basic Information</DialogTitle>
						<DialogDescription>
							Update the tenant&apos;s basic personal information.
						</DialogDescription>
					</DialogHeader>

					<Form {...rhfMethods}>
						<form
							id="tenant-basic-info-form"
							className="space-y-4"
							onSubmit={handleSubmit(onSubmit)}
						>
							<FormField
								name="nationality"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Nationality <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input type="text" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="marital_status"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Marital Status <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Please select" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="SINGLE">Single</SelectItem>
													<SelectItem value="MARRIED">Married</SelectItem>
													<SelectItem value="DIVORCED">Divorced</SelectItem>
													<SelectItem value="WIDOWED">Widowed</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="date_of_birth"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Date of birth <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<DatePickerInput
												value={field.value}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="tenant-basic-info-form"
							disabled={isPending || !rhfMethods.formState.isDirty}
						>
							{isPending ? <Spinner /> : null} Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
