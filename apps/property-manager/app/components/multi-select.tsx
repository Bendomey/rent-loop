import { Check, ChevronDown, Minus, Search, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '~/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'

/**
 * A single selectable option.
 *
 * `description` and `meta` carry the context that makes a long list scannable —
 * a unit shows its tenant, a block shows how many units it holds.
 */
export interface MultiSelectOption {
	label: string
	value: string
	description?: string
	meta?: string
	disabled?: boolean
}

/** Options bucketed under a heading. Headings stick while the list scrolls. */
export interface MultiSelectGroup {
	heading: string
	note?: string
	options: MultiSelectOption[]
}

export interface MultiSelectProps {
	options: Array<MultiSelectOption> | Array<MultiSelectGroup>
	onValueChange: (value: Array<string>) => void
	defaultValue?: Array<string>

	/**
	 * Renders the control's own label row, which is also where "Clear all"
	 * lives — kept away from the per-token remove buttons so wiping the
	 * selection and dropping one item are never confused.
	 */
	label?: string
	required?: boolean

	placeholder?: string
	searchPlaceholder?: string
	emptyHint?: string
	disabled?: boolean
	/** Shown in place of the placeholder while disabled, to say why. */
	disabledNote?: string
	invalid?: boolean
	hideSelectAll?: boolean
	/** Caps the tokens rendered in the field; the rest collapse into "+n more". */
	maxCount?: number
	className?: string
	popoverClassName?: string
	minWidth?: string
	maxWidth?: string
	id?: string
}

const isGrouped = (
	options: MultiSelectProps['options'],
): options is Array<MultiSelectGroup> => {
	const first = options[0]
	return first !== undefined && 'options' in first
}

const toGroups = (
	options: MultiSelectProps['options'],
): Array<MultiSelectGroup> =>
	isGrouped(options) ? options : [{ heading: '', options }]

/** Tri-state box: checked, indeterminate (some of the filtered set), or empty. */
function SelectionBox({
	checked,
	indeterminate,
}: {
	checked?: boolean
	indeterminate?: boolean
}) {
	const filled = checked || indeterminate

	return (
		<span
			className={cn(
				'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
				filled
					? 'bg-primary border-transparent'
					: 'bg-background border-foreground/20',
			)}
		>
			{indeterminate ? (
				<Minus className="text-primary-foreground size-3" strokeWidth={3} />
			) : checked ? (
				<Check className="text-primary-foreground size-3" strokeWidth={2.8} />
			) : null}
		</span>
	)
}

/** A picked option, carrying its own remove button. */
function Token({
	option,
	onRemove,
}: {
	option: MultiSelectOption
	onRemove: () => void
}) {
	return (
		<span className="bg-background border-border flex max-w-52 items-center gap-1 rounded-sm border py-0.5 pr-0.5 pl-2">
			<span className="text-foreground truncate text-xs font-medium">
				{option.label}
			</span>
			{option.meta && (
				<span className="bg-muted text-muted-foreground shrink-0 rounded-[4px] px-1 font-mono text-[10px] font-bold">
					{option.meta}
				</span>
			)}
			<button
				type="button"
				aria-label={`Remove ${option.label}`}
				// The field opens the popover on click, so a token removal has to
				// stop here or it would reopen what it just closed.
				onMouseDown={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
				onClick={(event) => {
					event.stopPropagation()
					event.preventDefault()
					onRemove()
				}}
				className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-4 shrink-0 items-center justify-center rounded-[4px]"
			>
				<X className="size-3" strokeWidth={2.4} />
			</button>
		</span>
	)
}

export function MultiSelect({
	options,
	onValueChange,
	defaultValue,
	label,
	required,
	placeholder = 'Select options',
	searchPlaceholder,
	emptyHint = 'Try a different search term.',
	disabled = false,
	disabledNote,
	invalid = false,
	hideSelectAll = false,
	maxCount,
	className,
	popoverClassName,
	minWidth,
	maxWidth,
	id,
}: MultiSelectProps) {
	const [selected, setSelected] = React.useState<Array<string>>(
		defaultValue ?? [],
	)
	const [open, setOpen] = React.useState(false)
	const [query, setQuery] = React.useState('')

	// Follow the caller when it resets or repopulates the field (form reset,
	// async defaults). Compared by content so a fresh array identity on every
	// render doesn't fight the user's clicks.
	const defaultKey = (defaultValue ?? []).join('|')
	React.useEffect(() => {
		setSelected(defaultValue ?? [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultKey])

	const groups = React.useMemo(() => toGroups(options), [options])
	const allOptions = React.useMemo(
		() => groups.flatMap((group) => group.options),
		[groups],
	)

	const q = query.trim().toLowerCase()
	const matchedGroups = React.useMemo(() => {
		if (!q) return groups
		return groups
			.map((group) => ({
				...group,
				options: group.options.filter(
					(option) =>
						option.label.toLowerCase().includes(q) ||
						(option.description ?? '').toLowerCase().includes(q),
				),
			}))
			.filter((group) => group.options.length > 0)
	}, [groups, q])

	const matches = React.useMemo(
		() => matchedGroups.flatMap((group) => group.options),
		[matchedGroups],
	)

	const selectedOptions = allOptions.filter((option) =>
		selected.includes(option.value),
	)
	const visibleTokens =
		maxCount === undefined
			? selectedOptions
			: selectedOptions.slice(0, maxCount)
	const hiddenTokenCount = selectedOptions.length - visibleTokens.length

	// Select-all acts on what the search actually turned up, never the whole list.
	const allMatchesOn =
		matches.length > 0 &&
		matches.every((option) => selected.includes(option.value))
	const someMatchesOn =
		!allMatchesOn && matches.some((option) => selected.includes(option.value))

	const commit = (next: Array<string>) => {
		setSelected(next)
		onValueChange(next)
	}

	const toggle = (value: string) =>
		commit(
			selected.includes(value)
				? selected.filter((item) => item !== value)
				: [...selected, value],
		)

	const toggleAll = () => {
		const matchValues = matches.map((option) => option.value)
		commit(
			allMatchesOn
				? selected.filter((value) => !matchValues.includes(value))
				: [...new Set([...selected, ...matchValues])],
		)
	}

	const handleOpenChange = (next: boolean) => {
		if (disabled) return
		setOpen(next)
		if (!next) setQuery('')
	}

	// "Clear all" belongs to the label row. Without a label there is no row to
	// put it on, and growing one on first selection would jog a toolbar layout.
	const showHeader = Boolean(label)

	return (
		<div
			className={cn('flex w-full min-w-0 flex-col', className)}
			style={{ minWidth, maxWidth }}
		>
			{showHeader && (
				<div className="mb-2 flex items-baseline gap-2">
					{label && (
						<label
							htmlFor={id}
							className={cn(
								'text-sm leading-none font-medium',
								invalid ? 'text-destructive' : 'text-foreground',
							)}
						>
							{label}
							{required && <span className="text-destructive"> *</span>}
						</label>
					)}
					<div className="flex-1" />
					{selected.length > 0 && !disabled && (
						<button
							type="button"
							onClick={() => commit([])}
							className="text-primary cursor-pointer text-xs font-medium hover:underline"
						>
							Clear all
						</button>
					)}
				</div>
			)}

			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<div
						id={id}
						role="combobox"
						aria-expanded={open}
						aria-disabled={disabled}
						aria-invalid={invalid}
						tabIndex={disabled ? -1 : 0}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault()
								handleOpenChange(!open)
							}
						}}
						className={cn(
							// Sized off the shared input token (h-9 · rounded-md · px-3),
							// with min-h so it only grows once tokens wrap.
							'border-input dark:bg-input/30 flex min-h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
							disabled
								? 'bg-muted cursor-not-allowed opacity-50'
								: 'cursor-pointer',
							invalid &&
								'border-destructive ring-destructive/20 dark:ring-destructive/40 ring-[3px]',
							open && !invalid && 'border-ring ring-ring/50 ring-[3px]',
						)}
					>
						<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
							{selectedOptions.length === 0 ? (
								<span className="text-muted-foreground">
									{disabled ? (disabledNote ?? placeholder) : placeholder}
								</span>
							) : (
								<>
									{visibleTokens.map((option) => (
										<Token
											key={option.value}
											option={option}
											onRemove={() => toggle(option.value)}
										/>
									))}
									{hiddenTokenCount > 0 && (
										<span className="text-muted-foreground text-xs font-medium">
											+{hiddenTokenCount} more
										</span>
									)}
								</>
							)}
						</div>

						{selected.length > 0 && (
							<span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold">
								{selected.length}
							</span>
						)}
						<span className="bg-border h-4 w-px shrink-0" />
						<ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-50" />
					</div>
				</PopoverTrigger>

				<PopoverContent
					align="start"
					sideOffset={8}
					className={cn(
						'w-[var(--radix-popover-trigger-width)] overflow-hidden p-0',
						popoverClassName,
					)}
				>
					<div className="border-border/60 border-b p-2">
						<div className="border-input flex h-9 items-center gap-2 rounded-md border px-3">
							<Search className="text-muted-foreground size-4 shrink-0 opacity-50" />
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder={
									searchPlaceholder ??
									`Search ${(label ?? 'options').toLowerCase()}…`
								}
								className="text-foreground placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-sm outline-none"
							/>
						</div>
					</div>

					{!hideSelectAll && matches.length > 0 && (
						<button
							type="button"
							onClick={toggleAll}
							className="bg-muted border-border/60 hover:bg-accent flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-left"
						>
							<SelectionBox
								checked={allMatchesOn}
								indeterminate={someMatchesOn}
							/>
							<span className="text-foreground flex-1 text-sm font-medium">
								{allMatchesOn ? 'Deselect' : 'Select'} all{q ? ' matching' : ''}
							</span>
							<span className="text-muted-foreground font-mono text-xs">
								{matches.length}
							</span>
						</button>
					)}

					<div className="max-h-[268px] overflow-auto" role="listbox">
						{matches.length === 0 && (
							<div className="px-4 py-6 text-center">
								<div className="text-foreground text-sm font-medium">
									No matches
								</div>
								<div className="text-muted-foreground mt-1 text-xs">
									{emptyHint}
								</div>
							</div>
						)}

						{matchedGroups.map((group) => (
							<div key={group.heading || '_'}>
								{group.heading && (
									// Sticky, so the fill has to be opaque — a translucent one
									// lets the rows scroll through the heading.
									<div className="bg-muted border-border/60 sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-1.5">
										<span className="text-muted-foreground font-mono text-[10px] font-bold tracking-[0.7px] uppercase">
											{group.heading}
										</span>
										{group.note && (
											<span className="text-muted-foreground/70 text-xs">
												{group.note}
											</span>
										)}
									</div>
								)}
								{group.options.map((option) => {
									const on = selected.includes(option.value)
									return (
										<button
											type="button"
											key={option.value}
											role="option"
											aria-selected={on}
											disabled={option.disabled}
											onClick={() => toggle(option.value)}
											className={cn(
												'border-border/60 flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 disabled:cursor-not-allowed disabled:opacity-50',
												on
													? 'bg-[var(--row-selected)]'
													: 'hover:bg-[var(--row-hover)]',
											)}
										>
											<SelectionBox checked={on} />
											<span className="min-w-0 flex-1">
												<span
													className={cn(
														'text-foreground block truncate text-sm',
														on ? 'font-medium' : 'font-normal',
													)}
												>
													{option.label}
												</span>
												{option.description && (
													<span className="text-muted-foreground block truncate text-xs">
														{option.description}
													</span>
												)}
											</span>
											{option.meta && (
												<span className="bg-muted text-muted-foreground shrink-0 rounded-[4px] px-1.5 font-mono text-[10px] font-bold">
													{option.meta}
												</span>
											)}
										</button>
									)
								})}
							</div>
						))}
					</div>

					<div className="bg-muted border-border flex items-center gap-2 border-t px-3 py-2">
						<span className="text-muted-foreground flex-1 text-xs">
							{selected.length === 0 ? (
								<>
									None selected —{' '}
									<b className="text-foreground">
										applies to all {allOptions.length}
									</b>
								</>
							) : (
								<>
									<b className="text-foreground">{selected.length}</b> of{' '}
									{allOptions.length} selected
								</>
							)}
						</span>
						<Button
							type="button"
							size="sm"
							onClick={() => handleOpenChange(false)}
						>
							Done
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
