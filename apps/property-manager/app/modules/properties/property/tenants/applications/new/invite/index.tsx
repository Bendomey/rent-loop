import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, Phone, Mail } from 'lucide-react'
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { useLoaderData, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useInviteTenateToProperty } from '~/api/tenant-applications'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
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
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.new'

interface Props {
	data?: Partial<TenantApplication>
	admin_id: string
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z
	.object({
		desired_unit_id: z.string({
			error: 'Please select a unit',
		}),
		email: z.email('Please enter a valid email address').optional(),
		phone: z
			.string({ error: 'Phone Number is required' })
			.min(9, 'Please enter a valid phone number')
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.email && !data.phone) {
			ctx.addIssue({
				code: 'custom',
				message: 'Either email or phone number is required',
				path: ['email'],
			})

			ctx.addIssue({
				code: 'custom',
				message: 'Either email or phone number is required',
				path: ['phone'],
			})
		}
	})

export type FormSchema = z.infer<typeof ValidationSchema>

function InviteTenantModal({ opened, setOpened, data, admin_id }: Props) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const { clientUserProperty, origin } = useLoaderData<typeof loader>()
	const property_id = safeString(clientUserProperty?.property?.id)

	const generatedLink = `${origin}/tenants/apply?unit=${data?.desired_unit_id}&referred_by=${admin_id}`

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { setValue } = rhfMethods

	useEffect(() => {
		if (data?.desired_unit_id) {
			setValue('desired_unit_id', data.desired_unit_id, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (data?.email) {
			setValue('email', data.email, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (data?.phone) {
			setValue('phone', data.phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [data, setValue])

	const { handleSubmit, control } = rhfMethods

	const { mutate, isPending, isSuccess } = useInviteTenateToProperty()

	const onSubmit = (data: FormSchema) => {
		if (data) {
			mutate(
				{
					unit_id: data.desired_unit_id,
					email: data.email,
					phone: data.phone,
				},
				{
					onError: () => {
						toast.error('Failed to invite tenant. Try again later.')
					},
					onSuccess: () => {
						toast.success('The tenant has been successfully invited')

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
						})
						setTimeout(() => {
							void navigate(`/properties/${property_id}/tenants/applications`)
						}, 500)
						setOpened(false)
						rhfMethods.reset()
					},
				},
			)
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center justify-between border-b pb-4">
						<TypographyH3>Invite Tenant to {data?.desired_unit}</TypographyH3>
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-4 pt-2">
						<div className="space-y-2 pb-4">
							<TypographyMuted>
								Invite your tenant to complete their application via email,
								phone number, or by sharing the application link below.
							</TypographyMuted>
						</div>

						<Form {...rhfMethods}>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="flex w-full flex-col gap-6">
									<Tabs defaultValue="email" className="w-full pb-2">
										<TabsList className="mb-2 grid w-full grid-cols-2">
											<TabsTrigger value="email">
												<Mail className="mr-2 h-4 w-4" /> Email
											</TabsTrigger>
											<TabsTrigger value="phone">
												<Phone className="mr-2 h-4 w-4" /> Phone
											</TabsTrigger>
										</TabsList>
										<TabsContent value="email">
											<div className="space-y-4 rounded-md border p-4">
												<FormField
													name="email"
													control={control}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Email</FormLabel>
															<FormControl>
																<Input
																	type="email"
																	placeholder="Enter email address"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</TabsContent>
										<TabsContent value="phone">
											<div className="rounded-md border p-4">
												<FormField
													name="phone"
													control={control}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Phone</FormLabel>
															<FormControl>
																<Input
																	type="tel"
																	placeholder="Enter phone number"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</TabsContent>
									</Tabs>
								</div>

								<div className="space-y-2 pt-2">
									<p className="text-sm text-gray-600">
										Anyone with the link can access this application.
									</p>
									<div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
										<p className="mb-3 text-sm font-medium text-gray-700">
											Application Link
										</p>
										<div className="flex items-center gap-2">
											<Input
												type="text"
												value={generatedLink}
												readOnly
												className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600"
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													void navigator.clipboard.writeText(generatedLink)
													toast.success('Link copied to clipboard')
												}}
												className="gap-2"
											>
												<Copy className="h-4 w-4" />
												Copy link
											</Button>
										</div>
									</div>
								</div>

								<div className="flex justify-end gap-3 pt-4">
									{isSuccess ? (
										<Button
											type="button"
											disabled={isPending}
											variant="outline"
											onClick={() => setOpened(false)}
										>
											{' '}
											Close{' '}
										</Button>
									) : (
										<>
											<Button
												type="button"
												disabled={isPending}
												variant="outline"
												onClick={() => setOpened(false)}
											>
												{' '}
												Cancel
											</Button>
											<Button
												disabled={isPending}
												variant="default"
												type="submit"
											>
												{isPending ? (
													<Spinner className="mr-2 h-4 w-4" />
												) : null}{' '}
												Invite Tenant
											</Button>
										</>
									)}
								</div>
							</form>
						</Form>
					</AlertDialogDescription>
				</AlertDialogHeader>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default InviteTenantModal
