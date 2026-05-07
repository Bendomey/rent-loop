import { AlertCircle, ChevronDown, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import { isMobile } from 'react-device-detect'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Command, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Spinner } from './ui/spinner'
import { useDisclosure } from '~/hooks/use-disclosure'
import { cn } from '~/lib/utils'

interface Props {
	label: string
	urlParam: string
	countOnly?: boolean
	Icon?: React.ComponentType<any>
	type: 'selector' | 'input'
	selectType?: 'single' | 'multi'
	options?: Array<IMultiSelectOption>
	selectedOptions?: Array<string>
	disabled?: boolean
	size?: 'sm' | 'lg' | 'default'
	disabledMessage?: string
	defaultMessage?: string
	className?: string
	hidePlaceholder?: boolean
	onSelect: (value: IMultiSelectOption) => void
	onRemove: (value: IMultiSelectOption) => void
	onClear: () => void
	onSearch?: SelectorFilter['onSearch']
}

export function Selector(props: Props) {
	const { isOpened, setIsOpened } = useDisclosure()
	const [options, setOptions] = React.useState<IMultiSelectOption[]>(
		() => props.options ?? [],
	)
	const [selectedOptions, setSelectedOptions] = React.useState<
		IMultiSelectOption[]
	>([])
	const [isFindSelectedOptions, setIsFindSelectedOptions] =
		React.useState(false)
	const [isSearching, setIsSearching] = React.useState(false)

	const availableOptions =
		options?.filter(
			(result) =>
				!selectedOptions.find((selected) => selected.value === result.value),
		) ?? []

	// use onsearch to find the options without labels
	React.useEffect(() => {
		const selectedOptionsWithLabels = props.selectedOptions?.map(
			(selectedOption) => {
				const option = options.find((opt) => opt.value === selectedOption)
				return option ? option : { value: selectedOption }
			},
		)

		const optionsWithoutLabels = selectedOptionsWithLabels?.filter(
			(option) => !option.label,
		)

		if (!optionsWithoutLabels?.length) {
			return setSelectedOptions(selectedOptionsWithLabels || [])
		}

		if (
			!selectedOptions.length &&
			optionsWithoutLabels?.length &&
			props.onSearch
		) {
			setIsFindSelectedOptions(true)
			props
				.onSearch?.({
					ids: optionsWithoutLabels.map((option) => option.value),
				})
				.then((fetchedOptions) => {
					const optionsWithLabels =
						selectedOptionsWithLabels?.filter((option) => option.label) ?? []
					setSelectedOptions([...optionsWithLabels, ...fetchedOptions])
				})
				.catch(console.log)
				.finally(() => {
					setIsFindSelectedOptions(false)
				})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options, props.selectedOptions, props.onSearch, selectedOptions.length])

	// Fetch options when popover opens if onSearch is provided and options is not
	React.useEffect(() => {
		if (isOpened && !options.length && props.onSearch) {
			setIsSearching(true)
			props
				.onSearch({})
				.then(setOptions)
				.catch(console.log)
				.finally(() => {
					setIsSearching(false)
				})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpened, props.onSearch])

	return (
		<Popover open={isOpened} onOpenChange={setIsOpened}>
			<PopoverTrigger asChild>
				<Button
					disabled={props.disabled}
					variant={'outline'}
					role="combobox"
					size={props.size || 'sm'}
					className={cn(
						'flex items-center justify-between gap-2 px-2 text-xs',
						props.className,
					)}
				>
					{props.disabled && (
						<span className="text-muted-foreground text-sm">
							{props.disabledMessage ? props.disabledMessage : 'Disabled'}{' '}
						</span>
					)}
					{!props.disabled && selectedOptions.length === 0 && (
						<span className="text-muted-foreground text-sm">
							{isMobile ? (
								props.Icon ? (
									<props.Icon className="size-3" />
								) : (
									<ChevronRight className="size-3" />
								)
							) : (
								<>
									{props.Icon && (
										<props.Icon className="mr-1 inline-block size-3" />
									)}
									{props.label ? props.label : 'Select an option'}{' '}
								</>
							)}
						</span>
					)}
					{selectedOptions.length > 0 && (
						<div className="flex w-full items-center justify-between gap-2 truncate">
							<span className="text-muted-foreground">
								{isMobile ? (
									props.Icon ? (
										<props.Icon className="size-3" />
									) : (
										<ChevronRight className="size-3" />
									)
								) : (
									<>
										{props.Icon && (
											<props.Icon className="mr-1 inline-block size-3" />
										)}
										{props.label ? props.label : 'Select an option'}{' '}
									</>
								)}
							</span>
							{!props.countOnly ? (
								<div
									className={`flex gap-1 truncate rounded-sm ${selectedOptions.length > 1 && "after:to-background relative overflow-hidden after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:h-5 after:w-24 after:bg-gradient-to-r after:from-transparent after:via-transparent after:content-['']"}`}
								>
									{selectedOptions.map((option) => (
										<Badge
											key={option.value}
											variant="outline"
											onClick={(e) => {
												e.stopPropagation()
												props.onRemove(option)
											}}
											className="text-foreground rounded-sm px-1 py-0.5 text-xs"
										>
											<span className="text-xs">{option.label}</span>
											<X className="size-3 shrink-0 cursor-pointer" />
										</Badge>
									))}
								</div>
							) : null}
							{selectedOptions.length > 0 && (
								<div
									className={`flex items-center ${selectedOptions.length > 0 && 'border-l pl-2'} cursor-pointer`}
								>
									<Badge
										variant="default"
										className="hover:bg-destructive group relative rounded-full bg-blue-600 px-1.5 py-0 text-xs"
										onClick={(e) => {
											e.stopPropagation()
											props.onClear()
										}}
									>
										<span className="text-xs group-hover:opacity-0">
											{selectedOptions.length}
										</span>
										<X className="absolute inset-0 m-auto size-3 opacity-0 group-hover:opacity-100" />
									</Badge>
								</div>
							)}
						</div>
					)}
					{props.hidePlaceholder && (
						<div className="flex items-center justify-between gap-2">
							<span className="text-muted-foreground text-xs">
								{props.label}
							</span>
							<Badge>{selectedOptions.length}</Badge>
						</div>
					)}
					{!props.countOnly && selectedOptions.length === 0 && (
						<div className="flex items-center justify-between gap-2">
							<Badge
								variant={'outline'}
								className="text-muted-foreground rounded-sm px-1 py-0.5 text-xs font-normal opacity-75"
							>
								{props.defaultMessage ? (
									props.defaultMessage === 'spinner' ? (
										<Spinner className="size-3 opacity-50" />
									) : (
										props.defaultMessage
									)
								) : (
									'Select an option'
								)}
							</Badge>
						</div>
					)}
					{isFindSelectedOptions ? (
						<Spinner className="text-foreground h-3 w-auto" />
					) : null}
					<ChevronDown className="text-foreground size-3 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-auto max-w-96 p-0" align="start">
				<Command>
					<CommandInput
						className="text-xs focus:ring-0"
						placeholder="Search options..."
					/>
					<CommandList className="p-1">
						{selectedOptions.length > 0 && (
							<>
								<div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
									Selected
								</div>
								{selectedOptions.map((option) => (
									<CommandItem
										className="flex flex-col items-start truncate overflow-hidden"
										key={option.value}
										value={option.value}
										onSelect={() => {
											props.onRemove(option)
										}}
									>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={true}
												className="data-[state=checked]:border-rose-600 data-[state=checked]:bg-rose-600 data-[state=checked]:text-white data-[state=checked]:[&>svg]:fill-white"
											/>
											<span className="text-sm">{option.label}</span>
										</div>
										{option.title && (
											<div className="text-muted-foreground flex items-center text-xs">
												<span>{option.title}</span>
												<span className="xxs-text ml-2">
													{option.description}
												</span>
											</div>
										)}
									</CommandItem>
								))}
							</>
						)}

						<div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
							Available Options
						</div>
						{isSearching ? (
							<div className="flex w-full items-center space-x-2 p-2 px-2 text-xs">
								<Spinner className="size-4 text-gray-400" />
								<span className="text-xs text-gray-400">Loading...</span>
							</div>
						) : availableOptions.length === 0 ? (
							<div className="flex w-full items-center p-2 px-2 text-xs">
								<AlertCircle className="mr-1 size-3 text-gray-400" />
								<span className="text-xs text-gray-400">
									No options available
								</span>
							</div>
						) : (
							<>
								{availableOptions.map((option) => (
									<CommandItem
										className="flex flex-col items-start truncate overflow-hidden"
										key={option.value}
										value={option.value}
										onSelect={() => {
											if (props.selectType === 'single') {
												props.onClear()
											}
											props.onSelect(option)
										}}
									>
										<div className="flex items-center gap-2">
											<Checkbox checked={false} />
											<span className="text-sm">{option.label}</span>
										</div>
										{option.title && (
											<div className="text-muted-foreground flex items-center text-xs">
												<span>{option.title}</span>
												<span className="xxs-text ml-2">
													{option.description}
												</span>
											</div>
										)}
									</CommandItem>
								))}
							</>
						)}
					</CommandList>
				</Command>

				{selectedOptions.length > 0 && (
					<div className="border-t p-2">
						<div className="flex items-center justify-end gap-2 text-xs font-medium">
							<Button
								size="sm"
								variant={'outline'}
								onClick={() => {
									props.onClear()
								}}
								className="text-xs"
							>
								Clear All
							</Button>
							{/* {props.confirmSelection && !props.hideConfirmSelectionButton && (
                                <Button
                                    size={"xxs"}
                                    onClick={() => {
                                        applyAndClose();
                                    }}
                                >
                                    Apply
                                </Button>
                            )} */}
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}
