import { ArrowLeft, Calendar, Mail, Phone, Shield } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import { useAuth } from '~/providers/auth-provider'
import type { loader } from '~/routes/_auth._dashboard.admins_.$adminId'

export function AdminDetailModule() {
	const { admin } = useLoaderData<typeof loader>()
	const { currentUser } = useAuth()

	if (!admin) {
		return (
			<main className="flex flex-col items-center justify-center py-20">
				<p className="text-muted-foreground text-sm">Admin not found.</p>
			</main>
		)
	}

	const isCurrentUser = currentUser?.id === admin.id
	const isActive = admin.status === 'Admin.Status.Active'

	return (
		<main className="flex flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admins">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-semibold">{admin.name}</h1>
					<p className="text-muted-foreground text-sm">Admin details</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Profile card */}
				<Card className="lg:col-span-1">
					<CardHeader className="items-center gap-3 text-center">
						<Avatar className="size-20">
							<AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
								{getNameInitials(admin.name)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<CardTitle className="flex items-center justify-center gap-2">
								{admin.name}
								{isCurrentUser && (
									<Badge variant="secondary" className="text-xs">
										You
									</Badge>
								)}
							</CardTitle>
							<CardDescription>Rentloop Admin</CardDescription>
						</div>
						<Badge
							variant="outline"
							className={
								isActive
									? 'border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
									: 'border-destructive/40 bg-destructive/5 text-destructive'
							}
						>
							{isActive ? 'Active' : 'Inactive'}
						</Badge>
					</CardHeader>
				</Card>

				{/* Details card */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Shield className="size-4" />
							Account Information
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-0">
						<div className="flex items-center gap-3 py-4">
							<Mail className="text-muted-foreground size-4 shrink-0" />
							<div>
								<p className="text-muted-foreground text-xs">Email</p>
								<p className="text-sm font-medium">{admin.email}</p>
							</div>
						</div>
						<Separator />
						<div className="flex items-center gap-3 py-4">
							<Phone className="text-muted-foreground size-4 shrink-0" />
							<div>
								<p className="text-muted-foreground text-xs">Phone</p>
								<p className="text-sm font-medium">
									{admin.phone_number || '—'}
								</p>
							</div>
						</div>
						<Separator />
						<div className="flex items-center gap-3 py-4">
							<Calendar className="text-muted-foreground size-4 shrink-0" />
							<div>
								<p className="text-muted-foreground text-xs">Joined</p>
								<p className="text-sm font-medium">
									{localizedDayjs(admin.created_at).format('MMMM D, YYYY')}
								</p>
							</div>
						</div>
						<Separator />
						<div className="flex items-center gap-3 py-4">
							<Calendar className="text-muted-foreground size-4 shrink-0" />
							<div>
								<p className="text-muted-foreground text-xs">Last updated</p>
								<p className="text-sm font-medium">
									{localizedDayjs(admin.updated_at).fromNow()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	)
}
