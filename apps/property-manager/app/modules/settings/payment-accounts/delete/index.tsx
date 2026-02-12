import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeletePaymentAccount } from '~/api/payment-accounts'
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
	data?: PaymentAccount
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function DeletePaymentAccountModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useDeletePaymentAccount()

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					payment_account_id: data.id,
				},
				{
					onError: () => {
						toast.error(
							`Failed to delete payment account ${data.identifier}. Try again later.`,
						)
					},
					onSuccess: () => {
						toast.success(
							`Payment Account ${data.identifier} has been successfully deleted`,
						)

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS],
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
						{data
							? `Delete Payment Account (${data.identifier})`
							: 'Delete this Payment Account'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete{' '}
						{data?.identifier ?? 'this payment account'} from your payment
						accounts?
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
