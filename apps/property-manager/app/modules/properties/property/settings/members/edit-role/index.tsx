import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLinkClientUserProperty } from '~/api/client-user-properties'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '~/components/ui/alert-dialog'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '~/components/ui/form'
import {
	Select,
	SelectTrigger,
	SelectItem,
	SelectContent,
	SelectValue,
	SelectGroup,
	SelectLabel,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4 } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'

interface Props {
	data?: ClientUserProperty
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z.object({
	role: z.enum(['MANAGER', 'STAFF'], {
		error: 'Please select a role',
	}),
})

type FormSchema = z.infer<typeof ValidationSchema>

export default function EditPropertyMemberRoleModule({ data, opened, setOpened }: Props) {
	const queryClient = useQueryClient()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			role: data?.role ?? 'STAFF',
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, reset } = rhfMethods

	useEffect(() => {
		if (data) {
			reset({ role: data.role ?? 'STAFF' })
		}
	}, [data, reset])

	const { mutate, isPending } = useLinkClientUserProperty()

	const onSubmit = (formData: FormSchema) => {
		if (data) {
			mutate(
				{
					clientId: safeString(data?.client_user?.client_id),
					property_id: safeString(data?.property_id),
					role: formData.role,
					client_user_ids: data?.client_user_id ? [data.client_user_id] : [],
				},
				{
					onError: () => {
						toast.error('Failed to update member role. Try again later.')
					},
					onSuccess: () => {
						toast.success('Member role has been updated successfully')

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES],
						})
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
						<TypographyH4>Edit Member Role</TypographyH4>
					</AlertDialogTitle>

					<AlertDialogDescription className="text-muted-foreground pt-1">
						Update the role for{' '}
						{data?.client_user?.user?.name ?? 'this member'}.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<form className="mt-2">
					<Form {...rhfMethods}>
						<FieldGroup>
							<FormField
								name="role"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel htmlFor="role">Role</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger className="w-full" id="role">
													<SelectValue placeholder="Select a role" />
												</SelectTrigger>

												<SelectContent>
													<SelectGroup>
														<SelectLabel>All Roles</SelectLabel>
														<SelectItem value="MANAGER">Manager</SelectItem>
														<SelectItem value="STAFF">Staff</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FieldGroup>
					</Form>
				</form>

				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isPending}
						onClick={() => setOpened(false)}
					>
						Cancel
					</AlertDialogCancel>

					<AlertDialogAction
						disabled={isPending}
						onClick={handleSubmit(onSubmit)}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null} Save
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
