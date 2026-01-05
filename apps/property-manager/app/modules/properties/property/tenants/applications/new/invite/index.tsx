import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
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
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	data?: Partial<TenantApplication>
	property_id: string
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
	.refine((data) => data.email || data.phone, {
		message: 'Either email or phone number is required',
		path: ['email'],
	})

export type FormSchema = z.infer<typeof ValidationSchema>

function InviteTenantModal({ opened, setOpened, data, property_id }: Props) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

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

	const { mutate, isPending } = useInviteTenateToProperty()

	const onSubmit = (data: FormSchema) => {
		if (data) {
			mutate(
				{
					desired_unit_id: data.desired_unit_id,
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
							void navigate(`/properties/${property_id}/assets/blocks`)
						}, 500)
						setOpened(false)
					},
				},
			)
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Invite Tenant to {data?.desired_unit}
					</AlertDialogTitle>
					<AlertDialogDescription>
						<Form {...rhfMethods}>
							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-4 pt-4"
							>
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

								<div className="flex justify-end gap-3 pt-4">
									<Button
										type="button"
										disabled={isPending}
										variant="outline"
										onClick={() => setOpened(false)}
									>
										Cancel
									</Button>
									<Button disabled={isPending} variant="default" type="submit">
										{isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}{' '}
										Invite Tenant
									</Button>
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
