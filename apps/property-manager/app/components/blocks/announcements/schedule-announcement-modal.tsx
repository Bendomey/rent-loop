import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useScheduleAnnouncement } from '~/api/announcements'
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

export function ScheduleAnnouncementModal({
	announcementId,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()
	const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined)
	const { mutate, isPending } = useScheduleAnnouncement()

	const handleClose = () => {
		setScheduledAt(undefined)
		setOpened(false)
	}

	const handleSubmit = () => {
		if (!announcementId || !scheduledAt) return
		mutate(
			{ id: announcementId, scheduled_at: scheduledAt.toISOString() },
			{
				onError: () =>
					toast.error('Failed to schedule announcement. Try again later.'),
				onSuccess: () => {
					toast.success('Announcement scheduled.')
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
					<AlertDialogTitle>Schedule Announcement</AlertDialogTitle>
					<AlertDialogDescription>
						Choose a date and time to publish this announcement automatically.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="py-2">
					<DatePickerInput
						value={scheduledAt}
						onChange={setScheduledAt}
						placeholder="Select publish date"
						startMonth={new Date()}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending} onClick={handleClose}>
						Cancel
					</AlertDialogCancel>
					<Button disabled={isPending || !scheduledAt} onClick={handleSubmit}>
						{isPending && <Spinner />}
						Schedule
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
