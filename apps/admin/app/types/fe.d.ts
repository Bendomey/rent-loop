interface Filter {
	id: number
	type: 'selector' | 'input'
	selectType?: 'single' | 'multi'
	label: string
	value: SelectorFilter
	Icon?: React.ComponentType<any>
}

interface SelectorFilter {
	options?: IMultiSelectOption[]
	urlParam: string
	defaultValues?: { value: number | number[] | string; label: string }[]
	className?: string
	customComponent?: React.ComponentType<any>
	onSearch?: ({ ids, query }: OnSearchType) => Promise<IMultiSelectOption[]>
}

interface OnSearchType {
	ids?: Array<NumberLike>
	query?: string
}

interface IMultiSelectOption {
	value: string
	label?: string
	title?: string
	description?: string
}
