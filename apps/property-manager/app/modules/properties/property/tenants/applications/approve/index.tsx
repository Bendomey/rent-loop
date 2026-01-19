import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useApproveTenantApplication } from '~/api/tenant-applications'
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
	data?: TenantApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch?: VoidFunction
}

function ApproveTenantApplicationModal({ opened, setOpened, data }: Props) {
	const queryClient = useQueryClient()

	const name =
		[data?.first_name, data?.other_names, data?.last_name]
			.filter(Boolean)
			.join(' ') + "'s"

	const { isPending, mutate } = useApproveTenantApplication()

	const handleSubmit = () => {
		if (data) {
			mutate(data.id, {
				onError: () => {
					toast.error('Failed to approve tenant application. Try again later.')
				},
				onSuccess: () => {
					toast.success(`${name} was approved successfully.`)

					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
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
						Approve {data ? ` ${name}` : 'this Tenant'} Application
					</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to approve {name ?? 'this'} application?
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
						// ToDo: Change to disabled={isPending} once all integrations are done
						disabled
						onClick={() => handleSubmit()}
						className="bg-green-500 hover:bg-green-600"
					>
						{isPending ? <Spinner /> : null}Yes Approve
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ApproveTenantApplicationModal
