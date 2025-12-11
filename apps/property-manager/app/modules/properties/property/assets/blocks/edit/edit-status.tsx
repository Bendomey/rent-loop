import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Wrench, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useUpdatePropertyBlockStatus } from '~/api/blocks'
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
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

interface EditPropertyBlockStatusModalProps {
	opened: boolean
	setOpened: (open: boolean) => void
	data?: PropertyBlock
}

const statusOptions = [
	{
		value: 'PropertyBlock.Status.Active',
		label: 'Active',
		icon: CheckCircle,
		textColor: 'text-teal-600',
	},
	{
		value: 'PropertyBlock.Status.Maintenance',
		label: 'Maintenance',
		icon: Wrench,
		textColor: 'text-yellow-600',
	},
	{
		value: 'PropertyBlock.Status.Inactive',
		label: 'Inactive',
		icon: XCircle,
		textColor: 'text-rose-600',
	},
]

export default function EditPropertyBlockStatusModal({
	opened,
	setOpened,
	data,
}: EditPropertyBlockStatusModalProps) {
	const { clientUserProperty } = useProperty()
	const queryClient = useQueryClient()
	const { mutate, isPending } = useUpdatePropertyBlockStatus()
	const [selectedStatus, setSelectedStatus] = useState<PropertyBlock['status']>(
		data?.status || 'PropertyBlock.Status.Active',
	)

	useEffect(() => {
		if (opened && data) {
			setSelectedStatus(data.status)
		}
	}, [opened, data])

	const handleSubmit = () => {
		if (data) {
			mutate(
				{
					id: data.id,
					property_id: safeString(clientUserProperty?.property?.id),
					status: selectedStatus,
				},
				{
					onError: () =>
						toast.error(
							`Failed to update ${data.name}'s status. Try again later.`,
						),
					onSuccess: () => {
						toast.success(`${data.name}'s status updated successfully!`)
						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.PROPERTY_BLOCKS],
						})
						setOpened(false)
					},
				},
			)
		}
	}

	const hasChanged = selectedStatus !== data?.status

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-xl font-semibold">
						Edit {data ? data.name : 'Block'} Status
					</AlertDialogTitle>
					<AlertDialogDescription>
						Choose a new status for <strong>{data?.name}</strong>.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex space-x-5 py-4">
					{statusOptions.map((option) => {
						const Icon = option.icon
						const selected = selectedStatus === option.value

						return (
							<Button
								key={option.value}
								variant={selected ? 'default' : 'outline'}
								onClick={() =>
									setSelectedStatus(option.value as PropertyBlock['status'])
								}
								className={cn(
									'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition',
									selected ? 'border-rose-600 text-white' : 'hover:bg-muted/60',
								)}
							>
								<Icon
									size={18}
									className={cn(
										'text-muted-foreground',
										selected && 'text-white',
									)}
								/>
								{option.label}
							</Button>
						)
					})}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => setOpened(false)}
						disabled={isPending}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={!hasChanged || isPending}
						onClick={() => handleSubmit()}
					>
						{isPending && <Spinner />} Update Status
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
