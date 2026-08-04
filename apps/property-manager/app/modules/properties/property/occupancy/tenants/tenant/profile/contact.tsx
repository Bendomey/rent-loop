import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateTenant } from '~/api/tenants'
import { InternationalPhoneInput } from '~/components/international-phone'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '~/components/ui/card'
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
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { normalizeInternationalPhoneNumber } from '~/lib/phone'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	emergency_contact_name: z
		.string({ error: 'Emergency Contact Name is required' })
		.min(2, 'Please enter a valid name'),
	relationship_to_emergency_contact: z
		.string({ error: 'Relationship to Emergency Contact is required' })
		.min(2, 'Please enter a valid relationship'),
	emergency_contact_phone: z
		.string({ error: 'Phone Number is required' })
		.refine(isValidPhoneNumber, { message: 'Enter a valid phone number' }),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantProfileContactCard({ tenant }: { tenant: Tenant }) {
	const revalidator = useRevalidator()
	const [isOpen, setIsOpen] = useState(false)

	const defaultValues: FormSchema = {
		emergency_contact_name: safeString(tenant.emergency_contact_name),
		relationship_to_emergency_contact: safeString(
			tenant.relationship_to_emergency_contact,
		),
		emergency_contact_phone: safeString(tenant.emergency_contact_phone),
	}

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues,
	})

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenant()

	const handleOpenChange = (open: boolean) => {
		if (open) {
			reset(defaultValues)
		}
		setIsOpen(open)
	}

	const onSubmit = (data: FormSchema) => {
		mutate(
			{
				tenant_id: tenant.id,
				data: {
					...data,
					emergency_contact_phone:
						normalizeInternationalPhoneNumber(data.emergency_contact_phone) ??
						data.emergency_contact_phone,
				},
			},
			{
				onError: () => {
					toast.error('Failed to update emergency contact. Try again later.')
				},
				onSuccess: () => {
					toast.success('Emergency contact updated successfully.')
					void revalidator.revalidate()
					setIsOpen(false)
				},
			},
		)
	}

	return (
		<Card>
			<CardHeader>
				<TypographyH4>Contact &amp; Address</TypographyH4>
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
				<div className="pt-2">
					<TypographyMuted>Emergency Contact</TypographyMuted>
					<div className="mt-2 space-y-2">
						<p className="text-foreground font-medium">
							{tenant?.emergency_contact_name}
						</p>
						<div className="text-muted-foreground flex gap-2 text-sm">
							<span>{tenant?.emergency_contact_phone}</span>
							<span>•</span>
							<span>{tenant?.relationship_to_emergency_contact}</span>
						</div>
					</div>
				</div>
			</CardContent>

			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="flex max-h-[85vh] flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>Edit Emergency Contact</DialogTitle>
						<DialogDescription>
							Update the tenant&apos;s emergency contact information.
						</DialogDescription>
					</DialogHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-1">
						<Form {...rhfMethods}>
							<form
								id="tenant-contact-form"
								className="space-y-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								<FormField
									name="emergency_contact_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Full Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="relationship_to_emergency_contact"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Relationship <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="emergency_contact_phone"
									control={rhfMethods.control}
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel>
												Phone Number <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<InternationalPhoneInput
													value={field.value}
													onChange={field.onChange}
													error={!!fieldState.error}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</div>

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
							form="tenant-contact-form"
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
