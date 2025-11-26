import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useUnlinkClientUserProperty } from '~/api/client-user-properties'
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
	data?: ClientUser
	property?: Property
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function RemoveMemberModule({
	data,
	property,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useUnlinkClientUserProperty()

	const handleSubmit = () => {
		if (data) {
			const clientUserId = data?.id

			mutate(
				{
					property_id: property?.id ?? '',
					client_user_ids: clientUserId ? [clientUserId] : [],
				},
				{
					onError: () => {
						toast.error(`Failed to remove member. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`Member has been successfully removed`)

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
						{data ? `Remove ${data.name}` : 'Remove this Member'} From{' '}
						{property ? property?.name : 'This Property'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to remove {data?.name ?? 'this member'}?
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
						{isPending ? <Spinner /> : null} Yes, Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
