import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useActivateClientUser } from '~/api/client-users'
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
	data?: ClientUser
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch?: VoidFunction
}

function ActivateClientUserModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useActivateClientUser()

	const handleSubmit = () => {
		if (data) {
			mutate(data.id, {
				onError: () => {
					toast.error('Failed to activate member. Try again later.')
				},
				onSuccess: () => {
					toast.success(`${data.name} was activated successfully.`)

					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.CLIENT_USERS],
					})
					setOpened(false)
				},
			})
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{data ? `Activate ${data.name}` : 'Activate Member'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to activate {data?.name ?? 'this member'}?
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
						className="bg-green-500 hover:bg-green-600"
					>
						{isPending ? <Spinner /> : null}Yes Activate
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ActivateClientUserModal
