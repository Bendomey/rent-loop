import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { useFetcher } from 'react-router'
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
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	data?: ClientUser
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch: VoidFunction
}

const ValidationSchema = z.object({
	id: z.string(),
	reason: z
		.string()
		.trim()
		.min(1, 'Reason for deactivation is required')
		.max(500, 'Reason must be less than 500 characters'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

function DeactivateClientUserModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()

	const createFetcher = useFetcher<{ error: string }>()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			id: data?.id ?? '',
			reason: '',
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const onSubmit = (data: FormSchema) => {
		try {
			void createFetcher.submit(data, {
				method: 'POST',
				action: '/settings/members/deactivate',
			})
			toast.success('The member has been successfully deactivated')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.CLIENT_USERS],
			})
			setOpened(false)
		} catch {
			toast.error('Failed to deavtivate member.')
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{data ? `Deactivate ${data.name}` : 'Deactivate Member'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						<Form {...rhfMethods}>
							<form onSubmit={handleSubmit(onSubmit)}>
								<input type="hidden" name="id" value={data?.id} />

								<FormField
									name="reason"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Are you sure you want to suspend{' '}
												{data?.name ?? 'this member'}?
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder={`Kindly add reasons why you want ${data?.name ?? 'this member'} deactivated.`}
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
										variant="outline"
										onClick={() => setOpened(false)}
									>
										Cancel
									</Button>
									<Button variant="destructive" type="submit">
										Yes, Deactivate
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

export default DeactivateClientUserModal
