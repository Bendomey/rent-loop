import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useExtendAnnouncementExpiry } from '~/api/announcements'
import { DatePickerInput } from '~/components/date-picker-input'
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
	announcementId: string | null
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export function ExtendExpiryModal({
	announcementId,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const { mutate, isPending } = useExtendAnnouncementExpiry()

	const handleClose = () => {
		setExpiresAt(undefined)
		setOpened(false)
	}

	const handleSubmit = () => {
		if (!announcementId || !expiresAt) return
		mutate(
			{ id: announcementId, expires_at: expiresAt.toISOString() },
			{
				onError: () => toast.error('Failed to extend expiry. Try again later.'),
				onSuccess: () => {
					toast.success('Announcement expiry extended.')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
					})
					handleClose()
				},
			},
		)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader>
					<AlertDialogTitle>Extend Expiry</AlertDialogTitle>
					<AlertDialogDescription>
						Set a new expiry date for this published announcement.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="py-2">
					<DatePickerInput
						value={expiresAt}
						onChange={setExpiresAt}
						placeholder="Select new expiry date"
						startMonth={new Date()}
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
