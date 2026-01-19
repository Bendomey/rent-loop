import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	data?: TenantApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch: VoidFunction
}

const ValidationSchema = z.object({
	id: z.string(),
	reason: z
		.string()
		.trim()
		.min(1, 'Reason for cancellation is required')
		.max(500, 'Reason must be less than 500 characters'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

function CancelTenantApplicationModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			id: '',
			reason: '',
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, reset } = rhfMethods

	const name =
		[data?.first_name, data?.other_names, data?.last_name]
			.filter(Boolean)
			.join(' ') + "'s"

	useEffect(() => {
		if (data) {
			reset({
				id: data.id,
				reason: '',
			})
		}
	}, [data, reset])

	const isPending = false
	const mutate = ({ id, reason }: { id: string; reason: string }, {}) => {}

	const onSubmit = (data: FormSchema) => {
		if (data) {
			mutate(
				{
					id: data.id,
					reason: data.reason,
				},
				{
					onError: () => {
						toast.error('Failed to cancel tenant application. Try again later.')
					},
					onSuccess: () => {
						toast.success(
							'The tenant application has been successfully cancelled',
						)

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
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
						Cancel {data ? `${name}` : 'this'} Tenant Application
					</AlertDialogTitle>
					<AlertDialogDescription>
						<Form {...rhfMethods}>
							<form onSubmit={handleSubmit(onSubmit)}>
								<input type="hidden" {...rhfMethods.register('id')} />

								<FormField
									name="reason"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Are you sure you want to cancel this application?
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder={`Kindly add reasons why you want ${name ?? 'this'} application cancelled.`}
													rows={8}
													{...field}
													className="mt-4 min-h-[160px]"
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
									<Button
										disabled={isPending}
										variant="destructive"
										type="submit"
									>
										{isPending ? <Spinner /> : null} Yes, Cancel
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

export default CancelTenantApplicationModal
