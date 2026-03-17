import { Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { ActivityTab } from './activity-tab'
import { CommentsTab } from './comments-tab'
import { ExpensesTab } from './expenses-tab'
import { MaintenanceRequestSidebar } from './sidebar'
import { useUpdateMaintenanceRequest } from '~/api/maintenance-requests'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH5, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import type { loader } from '~/routes/_auth.properties.$propertyId.activities.maintenance-requests.$requestId'

function InlineTitle({
	value,
	requestId,
	disabled,
}: {
	value: string
	requestId: string
	disabled: boolean
}) {
	const [editing, setEditing] = useState(false)
	const [final, setFinal] = useState(value)
	const [draft, setDraft] = useState(value)
	const inputRef = useRef<HTMLInputElement>(null)
	const update = useUpdateMaintenanceRequest()
	const revalidator = useRevalidator()

	const startEdit = () => {
		if (disabled) return
		setDraft(value)
		setEditing(true)
		setTimeout(() => inputRef.current?.focus(), 0)
	}

	const cancel = () => {
		setEditing(false)
		setDraft(value)
	}

	const save = () => {
		const trimmed = draft.trim()
		if (!trimmed) {
			cancel()
			return
		}
		if (trimmed === value) {
			setEditing(false)
			return
		}
		update.mutate(
			{ id: requestId, title: trimmed },
			{
				onSuccess: () => {
					void revalidator.revalidate()
					toast.success('Title updated')
					setFinal(trimmed)
					setEditing(false)
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update title',
					),
			},
		)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') save()
		if (e.key === 'Escape') cancel()
	}

	if (editing) {
		return (
			<div className="flex items-center gap-2">
				<Input
					ref={inputRef}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={save}
					className="h-auto py-0.5 text-xl font-semibold tracking-tight"
					disabled={update.isPending}
				/>
			</div>
		)
	}

	return (
		<div
			className="group flex cursor-pointer items-start gap-1"
			onClick={startEdit}
		>
			<h1 className="text-xl leading-tight font-semibold tracking-tight">
				{final}
			</h1>
			{!disabled && (
				<Pencil className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
			)}
		</div>
	)
}

function InlineDescription({
	value,
	requestId,
	disabled,
}: {
	value: string
	requestId: string
	disabled: boolean
}) {
	const [editing, setEditing] = useState(false)
	const [final, setFinal] = useState(value)
	const [draft, setDraft] = useState(value)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const update = useUpdateMaintenanceRequest()
	const revaldator = useRevalidator()

	const startEdit = () => {
		if (disabled) return
		setDraft(value)
		setEditing(true)
		setTimeout(() => {
			textareaRef.current?.focus()
			const len = textareaRef.current?.value.length ?? 0
			textareaRef.current?.setSelectionRange(len, len)
		}, 0)
	}

	const cancel = () => {
		setEditing(false)
		setDraft(value)
	}

	const save = () => {
		const trimmed = draft.trim()
		if (trimmed === value.trim()) {
			setEditing(false)
			return
		}
		update.mutate(
			{ id: requestId, description: trimmed },
			{
				onSuccess: () => {
					void revaldator.revalidate()
					toast.success('Description updated')
					setEditing(false)
					setFinal(trimmed)
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update description',
					),
			},
		)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') cancel()
	}

	if (editing) {
		return (
			<div className="flex flex-col gap-2">
				<Textarea
					ref={textareaRef}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					rows={5}
					className="min-h-60 resize-none text-sm"
					disabled={update.isPending}
				/>
				<div className="flex justify-end gap-2">
					<Button variant="ghost" size="sm" onClick={cancel}>
						Cancel
					</Button>
					<Button size="sm" onClick={save} disabled={update.isPending}>
						{update.isPending ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="group relative cursor-pointer" onClick={startEdit}>
			<TypographyMuted className="text-muted-foreground rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
				{final || <span className="italic">No description.</span>}
			</TypographyMuted>
			{!disabled && (
				<Pencil className="absolute top-0 right-0 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
			)}
		</div>
	)
}

export function MaintenanceRequestDetailModule() {
	const { mr: request, clientUserProperty } = useLoaderData<typeof loader>()

	const propertyId = clientUserProperty?.property_id ?? ''

	if (!request) {
		return (
			<div className="flex items-center justify-center py-20">
				<TypographyMuted>Request not found.</TypographyMuted>
			</div>
		)
	}

	const isLocked =
		request.status === 'RESOLVED' || request.status === 'CANCELED'

	return (
		<div className="m-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
			{/* Left pane */}
			<div className="flex flex-col gap-6 lg:col-span-8">
				{/* Header */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<TypographyMuted className="text-xs font-medium">
							#{request.code}
						</TypographyMuted>
					</div>
					<InlineTitle
						value={request.title}
						requestId={request.id}
						disabled={isLocked}
					/>
					<TypographyMuted className="text-xs">
						Opened {localizedDayjs(request.created_at).format('LLL')}
					</TypographyMuted>
				</div>

				{/* Description */}
				<div className="flex flex-col gap-1">
					<TypographyH5 className="text-base">Description</TypographyH5>
					<InlineDescription
						value={request.description}
						requestId={request.id}
						disabled={isLocked}
					/>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="comments" className="w-full">
					<TabsList>
						<TabsTrigger value="history">History</TabsTrigger>
						<TabsTrigger value="comments">Comments</TabsTrigger>
						<TabsTrigger value="expenses">Expenses</TabsTrigger>
					</TabsList>
					<TabsContent value="history" className="mt-4">
						<ActivityTab requestId={request.id} mr={request} />
					</TabsContent>
					<TabsContent value="comments" className="mt-4">
						<CommentsTab requestId={request.id} />
					</TabsContent>
					<TabsContent value="expenses" className="mt-4">
						<ExpensesTab requestId={request.id} propertyId={propertyId} />
					</TabsContent>
				</Tabs>
			</div>

			{/* Right pane — sidebar */}
			<div className="lg:col-span-4">
				<div className="sticky top-6">
					<MaintenanceRequestSidebar mr={request} propertyId={propertyId} />
				</div>
			</div>
		</div>
	)
}
