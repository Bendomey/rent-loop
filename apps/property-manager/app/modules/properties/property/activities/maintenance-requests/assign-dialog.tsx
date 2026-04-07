import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetClientUsers } from '~/api/client-users'
import { useAssignManager, useAssignWorker } from '~/api/maintenance-requests'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface AssignDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	requestId: string
	propertyId: string
	type: 'worker' | 'manager'
}

export function AssignDialog({
	open,
	onOpenChange,
	requestId,
	propertyId,
	type,
}: AssignDialogProps) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const [selectedUserId, setSelectedUserId] = useState<string>('')

	const { data: clientUsers, isPending: isLoadingUsers } = useGetClientUsers(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 100 },
			populate: ['User'],
		},
	)

	const assignWorker = useAssignWorker()
	const assignManager = useAssignManager()

	const isPending = assignWorker.isPending || assignManager.isPending

	const handleSubmit = async () => {
		if (!selectedUserId) return

		try {
			if (type === 'worker') {
				await assignWorker.mutateAsync({
					client_id: safeString(clientUser?.client_id),
					id: requestId,
					property_id: propertyId,
					worker_id: selectedUserId,
				})
			} else {
				await assignManager.mutateAsync({
					client_id: safeString(clientUser?.client_id),
					id: requestId,
					property_id: propertyId,
					manager_id: selectedUserId,
				})
			}
			toast.success(`${type === 'worker' ? 'Worker' : 'Manager'} assigned`)
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
			})
			onOpenChange(false)
			setSelectedUserId('')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to assign')
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						Assign {type === 'worker' ? 'Worker' : 'Manager'}
					</DialogTitle>
				</DialogHeader>
				<div className="py-2">
					<Select
						value={selectedUserId}
						onValueChange={setSelectedUserId}
						disabled={isLoadingUsers}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={
									isLoadingUsers ? 'Loading...' : 'Select a team member'
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{clientUsers?.rows.map((user) => (
								<SelectItem key={user.id} value={user.id}>
									{user.user?.name || 'Unnamed User'}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!selectedUserId || isPending}
					>
						{isPending ? 'Assigning...' : 'Assign'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
