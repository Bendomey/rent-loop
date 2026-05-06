import { useQueryClient } from '@tanstack/react-query'
import { Pencil, StickyNote, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateBooking } from '~/api/bookings'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'

export function NotesCard({
	booking,
	clientId,
	propertyId,
}: {
	booking: Booking
	clientId: string
	propertyId: string
}) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(booking.notes ?? '')
	const queryClient = useQueryClient()
	const { mutateAsync: updateNotes, isPending } = useUpdateBooking()

	const handleSave = async () => {
		try {
			await updateNotes({
				clientId,
				propertyId,
				bookingId: booking.id,
				data: { notes: draft },
			})
			toast.success('Notes saved')
			setEditing(false)
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.BOOKINGS, clientId, propertyId, booking.id],
			})
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save notes')
		}
	}

	const handleCancel = () => {
		setDraft(booking.notes ?? '')
		setEditing(false)
	}

	return (
		<Card className="shadow-none">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
						Internal Notes
					</CardTitle>
					{!editing ? (
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground h-6 px-2 text-xs"
							onClick={() => {
								setDraft(booking.notes ?? '')
								setEditing(true)
							}}
						>
							<Pencil className="size-3" />
							{booking.notes ? 'Edit' : 'Add note'}
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent>
				{editing ? (
					<div className="space-y-2">
						<Textarea
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder="Add a note about this booking..."
							rows={3}
							autoFocus
						/>
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
								disabled={isPending}
							>
								<X className="size-3" />
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSave}
								disabled={isPending}
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								{isPending ? null : null}
								Save
							</Button>
						</div>
					</div>
				) : booking.notes ? (
					<div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
						<p className="text-sm">{booking.notes}</p>
						<p className="text-muted-foreground mt-2 text-[11px]">
							{localizedDayjs(booking.updated_at).fromNow()}
						</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 py-6 text-center">
						<StickyNote className="text-muted-foreground size-6 opacity-40" />
						<p className="text-muted-foreground text-xs">No notes yet</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
