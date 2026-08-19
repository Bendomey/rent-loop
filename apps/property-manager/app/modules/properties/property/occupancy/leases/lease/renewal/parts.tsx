import { Check, Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

/**
 * The design project's wizard primitives, in the app's tokens.
 *
 * Sizes and spacing are the design's own (`PQuestion`, `FMoney`, `FChip`,
 * `FRadioCard`, `FNotice` in rl-fin-parts / rl-fin-plain). Colours go through
 * the semantic tokens rather than the raw hex, so the same components hold up
 * in dark mode — the brand primitives underneath are already identical.
 */

/**
 * A question, not a numbered step.
 *
 * `dim` de-emphasises a question that is not the one to answer first. It never
 * drops contrast — the controls stay usable, so the words stay readable.
 */
export function Question({
	q,
	help,
	children,
	done,
	dim,
	foot,
}: {
	q: string
	help?: ReactNode
	children: ReactNode
	done?: boolean
	dim?: boolean
	foot?: ReactNode
}) {
	return (
		<div className="border-border/60 border-t py-[26px] first:border-t-0">
			<div
				className={cn('flex items-baseline gap-3', help ? 'mb-1.5' : 'mb-4')}
			>
				<h2
					className={cn(
						'text-xl font-bold tracking-[-0.3px]',
						dim ? 'text-foreground-soft' : 'text-foreground',
					)}
				>
					{q}
				</h2>
				{done && <Check className="text-success size-[17px] shrink-0" />}
			</div>
			{help && (
				<p className="text-muted-foreground mb-[18px] max-w-[620px] text-[14.5px] leading-[1.55]">
					{help}
				</p>
			)}
			{children}
			{foot && (
				<p className="text-muted-foreground mt-3.5 max-w-[620px] text-[13.5px] leading-[1.55]">
					{foot}
				</p>
			)}
		</div>
	)
}

/** The money field: a big figure with its currency and period beside it. */
export function MoneyField({
	value,
	onChange,
	per,
	big,
	width = 250,
	id,
}: {
	value: string
	onChange: (next: string) => void
	per?: string
	big?: boolean
	width?: number
	id?: string
}) {
	return (
		<div
			className={cn(
				'bg-card inline-flex items-baseline gap-2.5 rounded-[13px] border-[1.5px]',
				big ? 'px-4 py-3' : 'px-3.5 py-2.5',
			)}
			style={{ width }}
		>
			<span
				className={cn(
					'text-muted-foreground/70 font-bold',
					big ? 'text-[17px]' : 'text-sm',
				)}
			>
				GH₵
			</span>
			<input
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="0.00"
				inputMode="decimal"
				className={cn(
					'text-foreground w-full min-w-0 flex-1 border-none bg-transparent font-bold tracking-[-0.5px] outline-none',
					big ? 'text-[26px]' : 'text-base',
				)}
			/>
			{per && (
				<span
					className={cn(
						'text-muted-foreground whitespace-nowrap',
						big ? 'text-[15px]' : 'text-[13px]',
					)}
				>
					/ {per}
				</span>
			)}
		</div>
	)
}

/** A suggestion chip. Filled once chosen, so the set reads as a toggle. */
export function Chip({
	children,
	on,
	onClick,
	dismissible,
}: {
	children: ReactNode
	on?: boolean
	onClick?: () => void
	dismissible?: boolean
}) {
	const Glyph = on ? (dismissible ? X : Check) : Plus
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'inline-flex items-center gap-[7px] rounded-[20px] border py-2 pr-3.5 pl-[11px] text-[13.5px] font-semibold whitespace-nowrap',
				on
					? 'bg-foreground text-background border-foreground'
					: 'bg-card text-foreground hover:border-muted-foreground/40',
			)}
		>
			<Glyph className={cn('size-[15px]', on ? '' : 'text-muted-foreground')} />
			{children}
		</button>
	)
}

/** A choice that reads as a card rather than a radio in a row. */
export function RadioCard({
	on,
	onClick,
	label,
	sub,
	right,
	disabled,
}: {
	on?: boolean
	onClick?: () => void
	label: ReactNode
	sub?: ReactNode
	right?: ReactNode
	disabled?: boolean
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				'flex w-full items-center gap-[13px] rounded-[13px] border-[1.5px] px-4 py-3.5 text-left',
				on ? 'border-primary bg-primary/8' : 'bg-card',
				disabled ? 'cursor-default opacity-50' : '',
			)}
		>
			<span
				className={cn(
					'bg-card flex size-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
					on ? 'border-primary' : 'border-border',
				)}
			>
				{on && <span className="bg-primary size-[9px] rounded-full" />}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-[15px] font-semibold">{label}</span>
				{sub && (
					<span className="text-muted-foreground mt-0.5 block text-[12.5px]">
						{sub}
					</span>
				)}
			</span>
			{right}
		</button>
	)
}

/** An inline notice — the tone carries the meaning, not an icon alone. */
export function Notice({
	tone = 'danger',
	icon,
	title,
	body,
	action,
}: {
	tone?: 'danger' | 'warning' | 'info' | 'neutral'
	icon: ReactNode
	title?: ReactNode
	body?: ReactNode
	action?: ReactNode
}) {
	const tones = {
		danger: 'bg-danger-bg text-danger',
		warning: 'bg-warning-bg text-warning',
		info: 'bg-info-bg text-info',
		neutral: 'bg-neutral-bg text-neutral',
	} as const
	return (
		<div
			className={cn(
				'flex items-start gap-3 rounded-[13px] px-[15px] py-[13px]',
				tones[tone],
			)}
		>
			<span className="mt-0.5 shrink-0">{icon}</span>
			<div className="min-w-0 flex-1">
				{title && <p className="text-[13.5px] font-bold">{title}</p>}
				{body && (
					<div
						className={cn(
							'text-foreground-soft text-[13.5px] leading-[1.55]',
							title ? 'mt-0.5' : '',
						)}
					>
						{body}
					</div>
				)}
			</div>
			{action}
		</div>
	)
}

/**
 * The term drawn as blocks — one block is one rent payment.
 *
 * The finished term sits in grey beside the new one, so the length being
 * signed is read against the length being replaced rather than in isolation.
 */
export function TermBar({
	startLabel,
	endLabel,
	durationLabel,
	oldPeriods,
	newPeriods,
	oldEndLabel,
	rentLabel,
}: {
	startLabel: string
	endLabel: string
	durationLabel: string
	oldPeriods: number
	newPeriods: number
	oldEndLabel: string
	rentLabel: string
}) {
	return (
		<div>
			<div className="mb-2.5 flex items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground/70 font-mono text-[10.5px] font-medium tracking-[0.8px] uppercase">
						New term starts
					</p>
					<p className="mt-1.5 text-[19px] font-bold tracking-[-0.3px]">
						{startLabel}
					</p>
				</div>
				<p className="text-muted-foreground pb-1 text-[13.5px] font-semibold">
					{durationLabel}
				</p>
				<div className="text-right">
					<p className="text-muted-foreground/70 font-mono text-[10.5px] font-medium tracking-[0.8px] uppercase">
						Last day
					</p>
					<p className="mt-1.5 text-[19px] font-bold tracking-[-0.3px]">
						{endLabel}
					</p>
				</div>
			</div>
			<div className="flex h-[30px] items-stretch gap-[3px]">
				{Array.from({ length: oldPeriods }).map((_, index) => (
					<span
						key={`old-${index}`}
						className="bg-foreground/10 flex-1 rounded"
					/>
				))}
				<span className="w-2.5" />
				{Array.from({ length: newPeriods }).map((_, index) => (
					<span
						key={`new-${index}`}
						className="bg-primary flex-1 rounded"
						style={{
							opacity:
								0.35 + 0.65 * (1 - index / Math.max(newPeriods - 1, 1)) * 0.9,
						}}
					/>
				))}
			</div>
			<div className="mt-2.5 flex justify-between gap-4">
				<span className="text-muted-foreground text-[13px]">
					Grey is the term being finished · ends {oldEndLabel}
				</span>
				<span className="text-muted-foreground text-[13px]">
					<b className="text-foreground-soft">{newPeriods} payments</b> of{' '}
					{rentLabel}
				</span>
			</div>
		</div>
	)
}
