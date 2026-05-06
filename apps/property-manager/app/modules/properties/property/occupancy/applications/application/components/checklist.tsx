import { Check, ChevronRight, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import type { ChecklistItem } from './checklist-types'
import { useCalculateChecklist } from './use-calculate-checklist'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

interface Props {
	application: TenantApplication
	propertyId: string
	footer?: React.ReactNode
}

export function PropertyTenantApplicationChecklist({
	application,
	propertyId,
	footer,
}: Props) {
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application.id}`

	const {
		progress,
		unitItems,
		tenantDetailItems,
		moveInItems,
		financialItems,
		docsItems,
	} = useCalculateChecklist(application)

	return (
		<Card className="rounded-md shadow-none">
			<CardHeader>
				<CardTitle className="text-2xl font-bold">
					Complete Application Info
				</CardTitle>
				<CardDescription className="text-base">
					As you fill out the lease application, your progress will be shown
					here.
				</CardDescription>
				<div className="mt-4 flex items-center gap-3 space-x-3">
					<span>{Math.round(progress)}%</span>
					<Progress value={progress} />
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<MenuItem
					href={`${baseUrl}`}
					subItems={unitItems}
					label="Select a unit"
				/>
				<MenuItem
					href={`${baseUrl}/tenant-details`}
					subItems={tenantDetailItems}
					label="Add tenants details"
				/>
				<MenuItem
					href={`${baseUrl}/move-in`}
					subItems={moveInItems}
					label="Move In Setup"
				/>
				<MenuItem
					href={`${baseUrl}/financial`}
					subItems={financialItems}
					label="Add financial Setup"
				/>
				<MenuItem
					href={`${baseUrl}/docs`}
					subItems={docsItems}
					label="Add lease docs setup"
				/>
			</CardContent>
			{footer && (
				<CardFooter className="flex justify-end gap-2 border-t pt-4">
					{footer}
				</CardFooter>
			)}
		</Card>
	)
}

interface MenuItemProps {
	label: string
	subItems: ChecklistItem[]
	href: string
}

function MenuItem({ label, subItems, href }: MenuItemProps) {
	const { pathname } = useLocation()

	const isActive = pathname === href
	const doneCount = subItems.filter((i) => i.done).length
	const allDone = doneCount === subItems.length

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
				<Checkbox checked={allDone} />
				<Label className="text-base font-light">{label}</Label>
				<div className="ml-auto flex items-center gap-2">
					{isActive ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									className={cn(
										'rounded-full px-2 py-0.5 text-xs font-medium',
										allDone
											? 'bg-green-100 text-green-700'
											: doneCount > 0
												? 'bg-yellow-100 text-yellow-700'
												: 'bg-gray-100 text-gray-600',
									)}
								>
									{doneCount}/{subItems.length}
								</span>
							</TooltipTrigger>
							<TooltipContent side="left" className="max-w-xs p-3">
								<ul className="space-y-1">
									{subItems.map((item) => (
										<li
											key={item.label}
											className="flex items-center gap-2 text-xs"
										>
											{item.done ? (
												<Check className="h-3 w-3 text-green-400" />
											) : (
												<X className="h-3 w-3 text-red-400" />
											)}
											<span>{item.label}</span>
										</li>
									))}
								</ul>
							</TooltipContent>
						</Tooltip>
					) : null}
					<ChevronRight className="h-5 w-auto text-gray-400" />
				</div>
			</div>
		</Link>
	)
}
