import { Check, Circle } from 'lucide-react'

import { cn } from '~/lib/utils'

const CHECKLIST_ITEMS: Array<{
	key: keyof TrackingApplication['checklist_progress']
	label: string
}> = [
	{ key: 'unit_selected', label: 'Unit selected' },
	{ key: 'personal_details_complete', label: 'Personal details completed' },
	{ key: 'move_in_setup_complete', label: 'Move-in details configured' },
	{ key: 'financial_setup_complete', label: 'Financial terms set' },
	{ key: 'lease_document_ready', label: 'Lease document prepared' },
]

interface Props {
	progress: TrackingApplication['checklist_progress']
}

export function ApplicationChecklist({ progress }: Props) {
	const completedCount = CHECKLIST_ITEMS.filter(
		(item) => progress[item.key],
	).length
	const percentage = Math.round(
		(completedCount / CHECKLIST_ITEMS.length) * 100,
	)

	return (
		<div className="rounded-lg border bg-white p-6">
			<h3 className="text-sm font-semibold text-slate-900">Progress</h3>

			{/* Progress bar */}
			<div className="mt-3 flex items-center gap-3">
				<div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
					<div
						className={cn(
							'h-full rounded-full transition-all',
							percentage === 100
								? 'bg-green-500'
								: 'bg-rose-500',
						)}
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<span className="text-sm font-medium text-slate-600">
					{percentage}%
				</span>
			</div>

			{/* Checklist items */}
			<ul className="mt-4 space-y-3">
				{CHECKLIST_ITEMS.map((item) => {
					const done = progress[item.key]
					return (
						<li key={item.key} className="flex items-center gap-3">
							{done ? (
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
									<Check className="h-3 w-3 text-green-600" />
								</div>
							) : (
								<Circle className="h-5 w-5 text-slate-300" />
							)}
							<span
								className={cn(
									'text-sm',
									done
										? 'text-slate-700'
										: 'text-slate-400',
								)}
							>
								{item.label}
							</span>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
