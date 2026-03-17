import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Pencil, Send, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	useCreateMaintenanceRequestComment,
	useDeleteMaintenanceRequestComment,
	useGetMaintenanceRequestComments,
	useUpdateMaintenanceRequestComment,
} from '~/api/maintenance-requests'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from '~/components/ui/input-group'
import { Textarea } from '~/components/ui/textarea'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { useAuth } from '~/providers/auth-provider'

function UserChip({ name, isMe }: { name: string; isMe: boolean }) {
	const initials = name
		.split(' ')
		.map((p) => p[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()

	return (
		<span className="inline-flex items-center gap-1.5">
			<span className="bg-muted text-foreground flex items-center justify-center rounded-full p-1.5 text-xs font-medium">
				{initials}
			</span>
			<span className="text-sm font-medium">
				{name}
				{isMe && (
					<span className="text-muted-foreground font-normal"> (Me)</span>
				)}
			</span>
		</span>
	)
}

interface CommentsTabProps {
	requestId: string
}

export function CommentsTab({ requestId }: CommentsTabProps) {
	const { currentUser } = useAuth()
	const queryClient = useQueryClient()
	const [content, setContent] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editContent, setEditContent] = useState('')

	const { data, isLoading, isError, refetch } =
		useGetMaintenanceRequestComments(requestId, {
			pagination: { page: 1, per: 50 },
			filters: {},
			populate: ['CreatedByClientUser'],
		})

	const comments = data?.rows ?? []

	const createComment = useCreateMaintenanceRequestComment()
	const updateComment = useUpdateMaintenanceRequestComment()
	const deleteComment = useDeleteMaintenanceRequestComment()

	const invalidate = () =>
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, requestId, 'comments'],
		})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const trimmed = content.trim()
		if (!trimmed) return

		createComment.mutate(
			{ id: requestId, content: trimmed },
			{
				onSuccess: () => {
					setContent('')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to add comment',
					),
			},
		)
	}

	const handleEdit = (comment: MaintenanceRequestComment) => {
		setEditingId(comment.id)
		setEditContent(comment.content)
	}

	const handleEditSubmit = (e: React.FormEvent, commentId: string) => {
		e.preventDefault()
		const trimmed = editContent.trim()
		if (!trimmed) return

		updateComment.mutate(
			{ id: requestId, comment_id: commentId, content: trimmed },
			{
				onSuccess: () => {
					setEditingId(null)
					setEditContent('')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update comment',
					),
			},
		)
	}

	const handleDelete = (commentId: string) => {
		deleteComment.mutate(
			{ id: requestId, comment_id: commentId },
			{
				onSuccess: () => {
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to delete comment',
					),
			},
		)
	}

	console.log(comments)
	return (
		<div className="flex flex-col gap-4 py-2">
			<form onSubmit={handleSubmit} className="flex flex-col gap-2">
				<InputGroup>
					<InputGroupTextarea
						id="block-end-textarea"
						placeholder="Write a comment..."
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={3}
					/>
					<InputGroupAddon align="block-end">
						<InputGroupButton
							type="submit"
							disabled={!content.trim() || createComment.isPending}
							variant="default"
							size="sm"
							className="ml-auto"
						>
							<Send className="mr-1.5 h-3.5 w-3.5" />
							{createComment.isPending ? 'Posting...' : 'Post'}
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>

			{isError ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<AlertCircle className="text-destructive h-5 w-5" />
					<TypographyMuted className="text-sm">
						Failed to load comments.
					</TypographyMuted>
					<button
						onClick={() => void refetch()}
						className="text-primary text-xs underline underline-offset-2"
					>
						Try again
					</button>
				</div>
			) : isLoading ? (
				<div className="flex flex-col gap-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
					))}
				</div>
			) : comments.length === 0 ? (
				<TypographyMuted className="py-4 text-center text-sm">
					No comments yet.
				</TypographyMuted>
			) : (
				<div className="flex flex-col gap-3">
					{comments.map((comment) => (
						<div
							key={comment.id}
							className="bg-muted/40 rounded-lg border px-4 py-3 text-sm"
						>
							{editingId === comment.id ? (
								<form
									onSubmit={(e) => handleEditSubmit(e, comment.id)}
									className="flex flex-col gap-2"
								>
									<Textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										rows={3}
										className="resize-none text-sm"
										autoFocus
									/>
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setEditingId(null)}
										>
											<X className="h-3.5 w-3.5" />
										</Button>
										<Button
											type="submit"
											size="sm"
											disabled={!editContent.trim() || updateComment.isPending}
										>
											{updateComment.isPending ? 'Saving...' : 'Save'}
										</Button>
									</div>
								</form>
							) : (
								<>
									{comment.created_by_client_user && (
										<div className="mb-2">
											<UserChip
												name={comment.created_by_client_user.name}
												isMe={
													comment.created_by_client_user.id === currentUser?.id
												}
											/>
										</div>
									)}
									<p className="leading-relaxed whitespace-pre-wrap">
										{comment.content}
									</p>
									<div className="mt-1.5 flex items-center justify-between gap-2">
										<TypographyMuted className="text-xs">
											{localizedDayjs(comment.created_at).format(
												'MMM D, YYYY [at] h:mm A',
											)}
										</TypographyMuted>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => handleEdit(comment)}
											>
												<Pencil className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive hover:text-destructive h-6 w-6"
												onClick={() => handleDelete(comment.id)}
												disabled={deleteComment.isPending}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
