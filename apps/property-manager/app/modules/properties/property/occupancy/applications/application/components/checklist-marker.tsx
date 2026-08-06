import { Check, Lock, TriangleAlert } from 'lucide-react'
import type { ChecklistStepState } from './checklist-types'
import { cn } from '~/lib/utils'

interface ChecklistMarkerProps {
	state: ChecklistStepState
	/** 21px in the rail, 14px for a sub-step. */
	size?: 'sm' | 'md'
}

/**
 * The marker carries the state, and it is never a spinner.
 *
 * The rail reports saved data. If a write is in flight the row keeps its old
 * state until it lands — a marker that flickers teaches the manager to distrust
 * the whole rail.
 */
export function ChecklistMarker({ state, size = 'md' }: ChecklistMarkerProps) {
	const box = cn(
		'flex shrink-0 items-center justify-center rounded-md border',
		size === 'md' ? 'size-[21px]' : 'size-[14px] rounded-[4px]',
	)
	const glyph = size === 'md' ? 'size-3' : 'size-2'

	if (state === 'done' || state === 'locked')
		return (
			<span className={cn(box, 'bg-primary border-primary')}>
				<Check className={cn(glyph, 'text-primary-foreground')} />
			</span>
		)

	if (state === 'progress')
		return (
			<span className={cn(box, 'bg-background border-primary')}>
				<span
					className={cn(
						'bg-primary rounded-full',
						size === 'md' ? 'size-2' : 'size-1.5',
					)}
				/>
			</span>
		)

	if (state === 'blocked')
		return (
			<span className={cn(box, 'bg-background border-dashed')}>
				<Lock className={cn(glyph, 'text-muted-foreground')} />
			</span>
		)

	if (state === 'attention')
		return (
			<span className={cn(box, 'bg-warning border-warning')}>
				<TriangleAlert className={cn(glyph, 'text-white')} />
			</span>
		)

	return <span className={cn(box, 'bg-background')} />
}
