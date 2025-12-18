import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeletePropertyUnit } from '~/api/units'
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
	data?: PropertyUnit
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function DeletePropertyUnitModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useDeletePropertyUnit()

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					property_id: data.property_id,
					unit_id: data.id,
				},
				{
					onError: () => {
						toast.error(`Failed to delete ${data.name}. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`${data.name} has been successfully deleted`)

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PROPERTY_UNITS],
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
						{data ? `Delete ${data.name}` : 'Delete this Unit'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete {data?.name ?? 'this unit'}?
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
