import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { useUpdatePaymentAccount } from '~/api/payment-accounts'
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

export default function SetPaymentAccountAsDefaultModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()
	const { mutate, isPending } = useUpdatePaymentAccount()

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					id: data.id,
					is_default: true,
				},
				{
					onError: () => {
						toast.error(
							`Failed to set payment account ${data.identifier} as default. Try again later.`,
						)
					},
					onSuccess: () => {
						toast.success(
							`Payment Account ${data.identifier} has been successfully set as default`,
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
						{data?.identifier
							? `Set (${data.identifier}) as default payment account`
							: 'Set this Payment Account as Default'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						{data?.identifier
							? `This will make ${data.identifier} your default payment account for future transactions.`
							: 'This will make this your default payment account for future transactions.'}
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
						{isPending ? <Spinner /> : null} Yes, Set as Default
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
