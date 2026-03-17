import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	useExtendAnnouncementExpiry,
	useExtendPropertyAnnouncementExpiry,
} from '~/api/announcements'
import { DateTimePickerInput } from '~/components/date-time-picker-input'
import {
	AlertDialog,
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

interface Props {
	announcement: Announcement | null
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	propertyId?: string
}

export function ExtendExpiryModal({
	announcement,
	opened,
	setOpened,
	propertyId,
}: Props) {
	const queryClient = useQueryClient()
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const { mutate: mutateGlobal, isPending: isPendingGlobal } =
		useExtendAnnouncementExpiry()
	const { mutate: mutateProperty, isPending: isPendingProperty } =
		useExtendPropertyAnnouncementExpiry()
	const isPending = propertyId ? isPendingProperty : isPendingGlobal

	const handleClose = () => {
		setExpiresAt(undefined)
		setOpened(false)
	}

	const handleSubmit = () => {
		if (!announcement || !expiresAt) return
		const callbacks = {
			onError: () => toast.error('Failed to extend expiry. Try again later.'),
			onSuccess: () => {
				toast.success('Announcement expiry extended.')
				void queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
				})
				handleClose()
			},
		}
		if (propertyId) {
			mutateProperty(
				{
					propertyId,
					id: announcement.id,
					expires_at: expiresAt.toISOString(),
				},
				callbacks,
			)
		} else {
			mutateGlobal(
				{ id: announcement.id, expires_at: expiresAt.toISOString() },
				callbacks,
			)
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{announcement?.expires_at ? 'Extend Expiry' : 'Set Expiry'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Set a new expiry date for this published announcement.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="py-2">
					<DateTimePickerInput
						value={expiresAt}
						onChange={setExpiresAt}
						placeholder="Select new expiry date"
						minDate={new Date()}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending} onClick={handleClose}>
						Cancel
					</AlertDialogCancel>
					<Button disabled={isPending || !expiresAt} onClick={handleSubmit}>
						{isPending && <Spinner />}
						Extend
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
