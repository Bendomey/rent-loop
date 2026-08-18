import { Mail, Phone, User, X } from 'lucide-react'
import { Link } from 'react-router'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { type Pronouns, capitalise, contractedIs } from '~/lib/pronouns'

export function OverviewFactsRail({
	application,
	pronouns,
	fullName,
	unitHref,
	tenantHref,
	showDecline,
	declineDisabled,
	onDecline,
}: {
	application: TenantApplication
	pronouns: Pronouns
	fullName: string
	unitHref: string
	tenantHref: string | null
	showDecline: boolean
	declineDisabled: boolean
	onDecline: () => void
}) {
	const unit = application.desired_unit
	const initials = fullName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join('')
		.toUpperCase()

	return (
		<div className="flex flex-col gap-4">
			<Card className="shadow-none">
				<CardContent>
					<div className="flex items-center gap-3">
						<Avatar className="size-12">
							<AvatarImage
								src={application.profile_photo_url ?? undefined}
								alt={fullName}
							/>
							<AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
								{initials || <User className="size-4" />}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="truncate font-bold">{fullName}</p>
							<p className="text-muted-foreground text-xs">
								Applied{' '}
								{localizedDayjs(application.created_at).format('D MMMM')}
							</p>
						</div>
					</div>

					<div className="mt-4 space-y-2.5">
						<div className="flex items-center gap-2.5">
							<Phone className="text-muted-foreground size-4 shrink-0" />
							<span className="truncate text-sm">{application.phone}</span>
						</div>
						<div className="flex items-center gap-2.5">
							<Mail className="text-muted-foreground size-4 shrink-0" />
							<span className="truncate text-sm">{application.email}</span>
						</div>
					</div>

					<div className="mt-4 flex gap-2 border-t pt-4">
						<Button variant="outline" size="sm" className="flex-1" asChild>
							<a href={`tel:${application.phone}`}>
								<Phone className="size-3.5" />
								Call
							</a>
						</Button>
						<Button variant="outline" size="sm" className="flex-1" asChild>
							<a href={`mailto:${application.email}`}>
								<Mail className="size-3.5" />
								Email
							</a>
						</Button>
					</div>

					{tenantHref ? (
						<Button variant="outline" size="sm" className="mt-2 w-full" asChild>
							<Link to={tenantHref}>
								<User className="size-3.5" />
								{capitalise(pronouns.possessive)} profile
							</Link>
						</Button>
					) : null}
				</CardContent>
			</Card>

			<Card className="shadow-none">
				<CardContent>
					<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
						{capitalise(pronouns.subject)}
						{contractedIs(pronouns)} applying for
					</p>
					{unit ? (
						<>
							<Link
								to={unitHref}
								className="hover:text-primary mt-2 block font-bold"
							>
								{unit.name}
							</Link>
							<p className="text-muted-foreground mt-1 text-sm">
								{unit.property?.name ?? ''}
							</p>
							<div className="mt-4 flex justify-between border-t pt-3.5">
								<div>
									<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
										Advertised at
									</p>
									<p className="mt-1 font-bold">
										{formatAmount(
											convertPesewasToCedis(unit.rent_fee),
											unit.rent_fee_currency,
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
										Reference
									</p>
									<p className="text-muted-foreground mt-1 font-mono text-sm font-semibold">
										{application.code}
									</p>
								</div>
							</div>
						</>
					) : (
						<Button variant="outline" size="sm" className="mt-3" asChild>
							<Link to={unitHref}>Choose a unit</Link>
						</Button>
					)}
				</CardContent>
			</Card>

			{showDecline ? (
				<PropertyPermissionGuard roles={['MANAGER']}>
					<Card className="shadow-none">
						<CardContent>
							<p className="font-bold">Not going ahead?</p>
							<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
								Declining lets {application.first_name} know and frees the unit.
								Nothing you have filled in is deleted.
							</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3.5"
								disabled={declineDisabled}
								onClick={onDecline}
							>
								<X className="size-3.5" />
								Decline this application
							</Button>
							{declineDisabled ? (
								<p className="text-muted-foreground mt-2 text-xs">
									Can&apos;t decline once a payment has been made.
								</p>
							) : null}
						</CardContent>
					</Card>
				</PropertyPermissionGuard>
			) : null}
		</div>
	)
}
