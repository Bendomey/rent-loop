import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useApproveClientApplication } from '~/api/client-applications'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'

interface Props {
	data?: ClientApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

function ApproveApplicationModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()
	const { mutate, isPending } = useApproveClientApplication()

	const handleSubmit = () => {
		if (!data) return
		mutate(
			{ id: data.id },
			{
				onError: () => {
					toast.error('Failed to approve application. Try again later.')
				},
				onSuccess: () => {
					toast.success(`${data.name} was approved successfully.`)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.CLIENT_APPLICATIONS],
					})
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
						{data ? `Approve ${data.name}` : 'Approve Application'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						This will approve{' '}
						<strong>{data?.name ?? 'this application'}</strong> and grant them
						access to the platform as a property manager.
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
						onClick={handleSubmit}
						className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
					>
						{isPending ? <Spinner /> : null} Yes, Approve
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ApproveApplicationModal
