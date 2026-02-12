import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
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

const isPending = false

export default function SetPaymentAccountAsDefaultModal({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const handleSubmit = () => {
		if (data) {
			
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{data ? `Set payment account (${data.identifier}) as default` : 'Set this Payment Account as Default'}
					</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to set {data?.identifier ?? 'this payment account'} as the default payment account?
						This will be used as the default for all future transactions.
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
						{isPending ? <Spinner /> : null} Yes, Make Default
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
