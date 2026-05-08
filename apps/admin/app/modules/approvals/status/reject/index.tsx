import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRejectClientApplication } from '~/api/client-applications'
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
	data?: ClientApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z.object({
	reason: z
		.string()
		.trim()
		.min(1, 'Reason for rejection is required')
		.max(500, 'Reason must be less than 500 characters'),
})

type FormSchema = z.infer<typeof ValidationSchema>

function RejectApplicationModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()
	const { mutate, isPending } = useRejectClientApplication()

	const rhf = useForm<FormSchema>({
		defaultValues: { reason: '' },
		resolver: zodResolver(ValidationSchema),
	})

	const onSubmit = (values: FormSchema) => {
		if (!data) return
		mutate(
			{ id: data.id, reason: values.reason },
			{
				onError: () => {
					toast.error('Failed to reject application. Try again later.')
				},
				onSuccess: () => {
					toast.success(`${data.name} was rejected.`)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.CLIENT_APPLICATIONS],
					})
					rhf.reset()
					setOpened(false)
				},
			},
		)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{data ? `Reject ${data.name}` : 'Reject Application'}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<Form {...rhf}>
							<form onSubmit={rhf.handleSubmit(onSubmit)}>
								<FormField
									name="reason"
									control={rhf.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Are you sure you want to reject{' '}
												{data?.name ?? 'this application'}?
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Provide a reason for the rejection…"
													rows={5}
													{...field}
													className="mt-4"
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
										{isPending ? <Spinner /> : null} Yes, Reject
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

export default RejectApplicationModal
