import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { CURRENT_USER_QUERY_KEY, useUpdateClientUserMe } from '~/api/auth'
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
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { getErrorMessage } from '~/lib/error-messages'
import { safeString } from '~/lib/strings'

interface Props {
	client?: ClientUser
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export default function UpdateClientProfileModal({
	client,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			name: safeString(client?.name),
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods
	const { mutate, isPending } = useUpdateClientUserMe()

	const onSubmit = (data: FormSchema) => {
		mutate(
			{
				name: data.name,
			},
			{
				onError: (e: unknown) => {
					if (e instanceof Error) {
						toast.error(
							getErrorMessage(
								e.message,
								'Failed to update name. Try again later.',
							),
						)
					}
				},
				onSuccess: () => {
					toast.success('Name updated successfully')
					void queryClient.invalidateQueries({
						queryKey: CURRENT_USER_QUERY_KEY,
					})
					setOpened(false)
				},
			},
		)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="max-w-sm rounded-xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Edit Name</AlertDialogTitle>
					<AlertDialogDescription>
						Update your name for your account.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...rhfMethods}>
					<form className="">
						<FieldGroup className="max-sm:gap-3">
							<FormField
								name="name"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FieldGroup>
					</form>
				</Form>
				<AlertDialogFooter className="max-sm: flex flex-row justify-between">
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
						{isPending ? <Spinner /> : null}
						Save
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
