import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeleteTenantApplication } from '~/api/blocks'
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
	data?: TenantApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function DeleteTenantApplicationModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useDeleteTenantApplication()

	const name =
		[data?.first_name, data?.other_names, data?.last_name]
			.filter(Boolean)
			.join(' ') + "'s"

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					id: data.id,
				},
				{
					onError: () => {
						toast.error(`Failed to delete ${name} application. Try again later.`)
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
						Delete {data ? `${name} ` : ' this'} Tenant Application
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
