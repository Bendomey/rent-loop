import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeleteTenantApplication } from '~/api/tenant-applications'
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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface Props {
	data?: TenantApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	propertyId: string
}

export default function DeleteTenantApplicationModal({
	data,
	opened,
	setOpened,
	propertyId,
}: Props) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()

	const { mutate, isPending } = useDeleteTenantApplication()

	const name =
		[data?.first_name, data?.other_names, data?.last_name]
			.filter(Boolean)
			.join(' ') + "'s"

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					client_id: safeString(clientUser?.client_id),
					id: data.id,
					property_id: propertyId,
				},
				{
					onError: () => {
						toast.error(
							`Failed to delete ${name} application. Try again later.`,
						)
					},
					onSuccess: () => {
						toast.success(`${name} application has been successfully deleted`)

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
						Delete {data ? `${name} ` : ' this'} Lease Application
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete {name ?? 'this'} application?
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
						// ToDo: Change to disabled={isPending} after integrations are done
						disabled
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
