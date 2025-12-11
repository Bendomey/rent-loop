import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeletePropertyBlock } from '~/api/blocks'
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
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	data?: PropertyBlock
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function DeletePropertyBlockModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useDeletePropertyBlock()

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					property_id: data.property_id,
					block_id: data.id,
				},
				{
					onError: () => {
						toast.error(`Failed to delete ${data.name}. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`${data.name} has been successfully deleted`)

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PROPERTY_BLOCKS],
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
						{data ? `Delete ${data.name}` : 'Delete this Block'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete {data?.name ?? 'this block'}?
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isPending}
						onClick={() => setOpened(false)}
					>
						Cancel
					</AlertDialogCancel>

					<AlertDialogAction
						disabled={isPending}
						onClick={() => handleSubmit()}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null} Yes, Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
