import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLinkClientUserProperty } from '~/api/client-user-properties'
import { MembersSelect } from '~/components/MultiSelect/memebers-select'
import PermissionGuard from '~/components/permissions/permission-guard'
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
	FormDescription,
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
import { useProperty } from '~/providers/property-provider'

interface Props {
	data?: ClientUser
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch?: VoidFunction
}

const ValidationSchema = z.object({
	role: z.enum(['ADMIN', 'STAFF'], {
		error: 'Please select a role',
	}),
	members: z.array(z.string()).min(1, 'Please select at least one member'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export default function AddMemberModule({ opened, setOpened }: Props) {
	const queryClient = useQueryClient()

	const { property } = useProperty()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			role: 'STAFF',
			members: [],
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const { mutate, isPending } = useLinkClientUserProperty()

	const onSubmit = async (data: FormSchema) => {
		if (data) {
			mutate(
				{
					property_id: property?.id ?? '',
					role: data.role,
					client_user_ids: data.members,
				},
				{
					onError: () => {
						toast.error('Failed to add member(s). Try again later.')
					},
					onSuccess: () => {
						toast.success('Member(s) have been successfully added')

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
						<TypographyH4>Add New Member(s)</TypographyH4>
					</AlertDialogTitle>

					<AlertDialogDescription className="text-muted-foreground pt-1">
						Select member(s) from the list to add to the team.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<form className="mt-2">
					<Form {...rhfMethods}>
						<FieldGroup>
							<div>
								{/* Member Selection */}
								<FormField
									name="members"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<MembersSelect
													filters={{ none_from_property_id: property?.id }}
													onChange={(values) => field.onChange(values)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<PermissionGuard roles={['ADMIN', 'OWNER']}>
									<FormDescription className="mt-2">
										New Member?{' '}
										<Link
											to="/settings/members/new"
											className="text-primary text-sm font-medium hover:underline"
										>
											Create here
										</Link>
									</FormDescription>
								</PermissionGuard>
							</div>

							{/* Role Select */}
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
														<SelectItem value="__EMPTY__">
															Please select
														</SelectItem>
														<SelectLabel>All Roles</SelectLabel>
														<SelectItem value="ADMIN">Admin</SelectItem>
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
						{isPending ? <Spinner /> : null} Add
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
