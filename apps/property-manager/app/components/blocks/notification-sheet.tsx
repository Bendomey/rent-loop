import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
	Banknote,
	Bell,
	CalendarCheck,
	CheckCircle,
	FileText,
	Wrench,
	type LucideIcon,
} from 'lucide-react'
import {
	useGetNotifications,
	useGetNotificationUnreadCount,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
} from '~/api/notifications'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '~/components/ui/sheet'
import { cn } from '~/lib/utils'

dayjs.extend(relativeTime)

type EventIconConfig = {
	icon: LucideIcon
	containerClass: string
	iconClass: string
}

function getEventIconConfig(event: string): EventIconConfig {
	if (event.startsWith('PAYMENT_'))
		return {
			icon: Banknote,
			containerClass: 'bg-emerald-100 dark:bg-emerald-900/40',
			iconClass: 'text-emerald-600 dark:text-emerald-400',
		}
	if (event.startsWith('MAINTENANCE_'))
		return {
			icon: Wrench,
			containerClass: 'bg-rose-100 dark:bg-rose-900/40',
			iconClass: 'text-rose-600 dark:text-rose-400',
		}
	if (event.startsWith('TENANT_APPLICATION_'))
		return {
			icon: FileText,
			containerClass: 'bg-blue-100 dark:bg-blue-900/40',
			iconClass: 'text-blue-600 dark:text-blue-400',
		}
	if (event.startsWith('BOOKING_'))
		return {
			icon: CalendarCheck,
			containerClass: 'bg-violet-100 dark:bg-violet-900/40',
			iconClass: 'text-violet-600 dark:text-violet-400',
		}
	if (event.startsWith('LEASE_'))
		return {
			icon: CheckCircle,
			containerClass: 'bg-teal-100 dark:bg-teal-900/40',
			iconClass: 'text-teal-600 dark:text-teal-400',
		}
	if (event.startsWith('INVOICE_'))
		return {
			icon: Bell,
			containerClass: 'bg-amber-100 dark:bg-amber-900/40',
			iconClass: 'text-amber-600 dark:text-amber-400',
		}
	return {
		icon: Bell,
		containerClass: 'bg-zinc-100 dark:bg-zinc-800',
		iconClass: 'text-zinc-600 dark:text-zinc-400',
	}
}

function NotificationItem({
	notification,
	onRead,
}: {
	notification: Notification
	onRead: (id: string) => void
}) {
	const isUnread = notification.read_at === null
	const {
		icon: Icon,
		containerClass,
		iconClass,
	} = getEventIconConfig(notification.event)

	return (
		<button
			type="button"
			onClick={() => {
				if (isUnread) onRead(notification.id)
			}}
			className={cn(
				'hover:bg-muted/50 flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors',
				isUnread && 'bg-rose-50 dark:bg-rose-950/30',
			)}
		>
			<div
				className={cn(
					'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
					containerClass,
				)}
			>
				<Icon className={cn('size-4', iconClass)} />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p className="truncate text-sm leading-snug font-semibold">
						{notification.title ?? notification.event}
					</p>
					<div className="flex shrink-0 items-center gap-1.5">
						<span className="text-muted-foreground text-xs">
							{dayjs(notification.created_at).fromNow(true)}
						</span>
						{isUnread && (
							<span className="size-2 shrink-0 rounded-full bg-rose-500" />
						)}
					</div>
				</div>
				{notification.body ? (
					<p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
						{notification.body}
					</p>
				) : null}
			</div>
		</button>
	)
}

type NotificationSheetProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function NotificationSheet({
	open,
	onOpenChange,
}: NotificationSheetProps) {
	const { data: unreadCount = 0 } = useGetNotificationUnreadCount()
	const { data: notificationsData, isLoading } = useGetNotifications(1, 20)
	const markRead = useMarkNotificationRead()
	const markAllRead = useMarkAllNotificationsRead()

	const notifications = notificationsData?.rows ?? []

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-[400px] flex-col gap-0 p-0 sm:max-w-[400px]">
				<SheetHeader className="flex-row items-center justify-between px-4 py-3 pr-10">
					<SheetTitle className="text-sm font-semibold">
						Notifications
					</SheetTitle>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-auto px-2 py-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
							onClick={() => markAllRead.mutate()}
							disabled={markAllRead.isPending}
						>
							Mark all as read
						</Button>
					)}
				</SheetHeader>

				<Separator />

				<ScrollArea className="flex-1">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-muted-foreground text-sm">Loading…</p>
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12">
							<Bell className="text-muted-foreground/40 size-8" />
							<p className="text-muted-foreground text-sm">
								No notifications yet
							</p>
						</div>
					) : (
						<div className="divide-border divide-y">
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onRead={(id) => markRead.mutate(id)}
								/>
							))}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	)
}
