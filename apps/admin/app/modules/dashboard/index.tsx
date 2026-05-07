import {
	Activity,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	Shield,
	Settings2,
	UserCheck,
	UserX,
	Users,
	XCircle,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

// ---------------------------------------------------------------------------
// Stat cards config — all Tailwind classes written in full so they aren't purged
// ---------------------------------------------------------------------------

const statCards = [
	{
		label: 'Total Property Managers',
		value: '—',
		note: 'All registered accounts on the platform',
		icon: Users,
		cardClass:
			'border-t-2 border-t-primary bg-gradient-to-b from-primary/8 to-card',
		iconWrap: 'bg-primary/10',
		iconColor: 'text-primary',
		badge: 'Platform total',
		badgeClass: 'border-primary/40 text-primary bg-primary/5',
	},
	{
		label: 'Pending Approvals',
		value: '—',
		note: 'Submitted registrations awaiting review',
		icon: ClipboardCheck,
		cardClass:
			'border-t-2 border-t-amber-500 bg-gradient-to-b from-amber-50/60 to-card dark:from-amber-950/20',
		iconWrap: 'bg-amber-100 dark:bg-amber-950',
		iconColor: 'text-amber-600 dark:text-amber-400',
		badge: 'Needs action',
		badgeClass:
			'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
	},
	{
		label: 'Approved This Month',
		value: '—',
		note: 'Property managers successfully onboarded',
		icon: UserCheck,
		cardClass:
			'border-t-2 border-t-green-500 bg-gradient-to-b from-green-50/60 to-card dark:from-green-950/20',
		iconWrap: 'bg-green-100 dark:bg-green-950',
		iconColor: 'text-green-600 dark:text-green-400',
		badge: 'This month',
		badgeClass:
			'border-green-500/40 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50',
	},
	{
		label: 'Declined This Month',
		value: '—',
		note: 'Applications rejected this month',
		icon: UserX,
		cardClass:
			'border-t-2 border-t-destructive bg-gradient-to-b from-destructive/5 to-card',
		iconWrap: 'bg-destructive/10',
		iconColor: 'text-destructive',
		badge: 'This month',
		badgeClass: 'border-destructive/40 text-destructive bg-destructive/5',
	},
]

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

const quickActions = [
	{
		label: 'Review Approvals',
		description: 'Action pending property manager registrations',
		icon: ClipboardCheck,
		href: '/approvals',
		iconClass:
			'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950',
	},
	{
		label: 'Manage Admins',
		description: 'View and create Rentloop admin accounts',
		icon: Shield,
		href: '/admins',
		iconClass: 'text-primary bg-primary/10',
	},
	{
		label: 'Activity Log',
		description: 'Audit trail of all admin actions on the platform',
		icon: Activity,
		href: '/activity',
		iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950',
	},
	{
		label: 'Platform Settings',
		description: 'Configure platform-level options',
		icon: Settings2,
		href: '/settings',
		iconClass:
			'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950',
	},
]

// ---------------------------------------------------------------------------
// Placeholder recent approvals
// ---------------------------------------------------------------------------

const recentActivity = [
	{
		name: 'Kwame Asante',
		action: 'Approved',
		time: '2 hours ago',
		icon: CheckCircle2,
		iconClass: 'text-green-500',
	},
	{
		name: 'Abena Mensah',
		action: 'Pending',
		time: '4 hours ago',
		icon: Clock,
		iconClass: 'text-yellow-500',
	},
	{
		name: 'Kofi Boateng',
		action: 'Declined',
		time: '1 day ago',
		icon: XCircle,
		iconClass: 'text-destructive',
	},
	{
		name: 'Ama Owusu',
		action: 'Approved',
		time: '2 days ago',
		icon: CheckCircle2,
		iconClass: 'text-green-500',
	},
	{
		name: 'Yaw Darko',
		action: 'Pending',
		time: '3 days ago',
		icon: Clock,
		iconClass: 'text-yellow-500',
	},
]

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export function DashboardModule() {
	const { currentUser } = useAuth()

	return (
		<main className="px-2 py-5 md:px-7">
			<div className="@container/main flex flex-1 flex-col gap-6">
				{/* Header */}
				<div className="flex flex-col justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
					<div>
						<TypographyH2>Welcome back, {currentUser?.name}</TypographyH2>
						<TypographyMuted>
							Here is an overview of the Rentloop admin dashboard.
						</TypographyMuted>
					</div>
				</div>

				{/* Stat cards */}
				<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
					{statCards.map((card) => (
						<Card key={card.label} className="@container/card">
							<CardHeader>
								<CardDescription>{card.label}</CardDescription>
								<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
									{card.value}
								</CardTitle>
								<CardAction>
									<Badge className={card.badgeClass}>{card.badge}</Badge>
								</CardAction>
							</CardHeader>
							<CardFooter className="flex-col items-start gap-1.5 text-sm">
								<div className="flex items-center gap-2 font-medium">
									<card.icon className="text-muted-foreground size-4" />
								</div>
								<div className="text-muted-foreground">{card.note}</div>
							</CardFooter>
						</Card>
					))}
				</div>

				{/* Quick actions + Recent activity */}
				<div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
					{/* Quick Actions */}
					<Card className="lg:col-span-1">
						<CardHeader>
							<CardTitle className="text-base">Quick Actions</CardTitle>
							<CardDescription>Common admin tasks</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 pt-0">
							{quickActions.map((action) => (
								<Link key={action.href} to={action.href}>
									<div className="border-border hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors">
										<div
											className={`flex size-9 shrink-0 items-center justify-center rounded-md ${action.iconClass}`}
										>
											<action.icon className="size-4" />
										</div>
										<div className="min-w-0">
											<p className="text-sm leading-none font-medium">
												{action.label}
											</p>
											<p className="text-muted-foreground mt-1 truncate text-xs">
												{action.description}
											</p>
										</div>
									</div>
								</Link>
							))}
						</CardContent>
					</Card>

					{/* Recent Activity */}
					<Card className="lg:col-span-2">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-base">Recent Approvals</CardTitle>
								<CardDescription>
									Latest property manager registration activity
								</CardDescription>
							</div>
							<Button variant="outline" size="sm" asChild>
								<Link to="/approvals">View all</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex flex-col">
								{recentActivity.map((item, i) => (
									<div key={item.name}>
										<div className="flex items-center justify-between py-3">
											<div className="flex items-center gap-3">
												<item.icon
													className={`size-4 shrink-0 ${item.iconClass}`}
												/>
												<span className="text-sm font-medium">{item.name}</span>
											</div>
											<div className="flex items-center gap-3">
												<Badge
													variant="outline"
													className={
														item.action === 'Approved'
															? 'border-green-500 text-green-600 dark:text-green-400'
															: item.action === 'Declined'
																? 'border-destructive text-destructive'
																: 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
													}
												>
													{item.action}
												</Badge>
												<span className="text-muted-foreground text-xs">
													{item.time}
												</span>
											</div>
										</div>
										{i < recentActivity.length - 1 && <Separator />}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
