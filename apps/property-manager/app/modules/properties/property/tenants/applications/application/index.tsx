import { ChevronRight } from 'lucide-react'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

const tenant = {
	id: 't1',
	name: 'Gideon Bempong',
	since: 'Jan 2025',
	location: 'Osu, Accra',
	phone: '(233) 277099230',
	email: 'gideon@example.com',
	profile: 'https://github.com/shadcn.png',
	status: 'Active',
}

export function PropertyTenantApplicationContainer() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	const baseUrl = `/properties/${clientUserProperty?.property?.id}/tenants/applications/${applicationId}`
	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="col-span-8">
				<div className="space-y-1">
					<div className="flex items-center space-x-3">
						<h1 className="text-3xl font-bold">Application Info #123242</h1>
						<Badge
							variant="secondary"
							className="bg-amber-400 px-2 py-1 text-xs text-amber-50"
						>
							In Progress
						</Badge>
					</div>
					<span className="text-sm text-gray-500">
						Submitted on <strong>{localizedDayjs().format('LLLL')}</strong>
					</span>
				</div>
				<div className="mt-5">
					<Outlet />
				</div>
			</div>
			<div className="col-span-4">
				<div className="mb-3 flex w-full flex-row items-center justify-end space-x-2">
					<Button variant={'secondary'}>Cancel</Button>
					<Button>Approve</Button>
				</div>
				<Card key={tenant.id} className="mt-10 rounded-md shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							Complete Application Info
						</CardTitle>
						<CardDescription className="text-base">
							As you fill out the tenant application, your progress will be
							shown here.
						</CardDescription>
						<div className="mt-4 flex items-center gap-3 space-x-3">
							<span>40%</span>
							<Progress value={40} />
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<MenuItem href={`${baseUrl}`} value={true} label="Select a unit" />
						<MenuItem
							href={`${baseUrl}/tenant-details`}
							value={true}
							label="Add tenants details"
						/>
						<MenuItem
							href={`${baseUrl}/move-in`}
							value={false}
							label="Move In Setup"
						/>
						<MenuItem
							href={`${baseUrl}/financial`}
							value={false}
							label="Add financial Setup"
						/>
						<MenuItem
							href={`${baseUrl}/docs`}
							value={false}
							label="Add lease docs setup"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

interface MenuItemProps {
	label: string
	value: boolean
	href: string
}
function MenuItem({ label, value, href }: MenuItemProps) {
	const { pathname } = useLocation()

	const isActive = pathname === href
	return (
		<Link to={href} className="cursor-pointer">
			<div
				className={cn(
					'flex items-center space-x-3 px-5 py-2 hover:bg-gray-50',
					{
						'bg-gray-100 font-medium': isActive,
					},
				)}
			>
				<Checkbox checked={value} id="terms" />
				<Label className="text-base font-light">{label}</Label>
				<ChevronRight className="ml-auto h-5 w-auto text-gray-400" />
			</div>
		</Link>
	)
}
