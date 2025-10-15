import { ChevronRightIcon, Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Selector } from './selector'

interface Props {
	label: string
	urlParam: string
	filters: Array<Filter>
}

export function FilterSet(props: Props) {
	const [searchParams, setSearchParams] = useSearchParams()

	const selectedOptions = useMemo(() => {
		const values = searchParams.getAll(props.urlParam)

		return props.filters
			.filter((filter) => {
				return values?.includes(filter.value.urlParam)
			})
			.map((filter) => ({
				label: filter.label,
				value: filter.value.urlParam,
			}))
	}, [props.filters, props.urlParam, searchParams])

	return (
		<>
			<Selector
				type="selector"
				selectType="multi"
				label={props.label}
				options={props.filters.map((filter) => ({
					label: filter.label,
					value: filter.value.urlParam,
				}))}
				onClear={() => {
					searchParams.delete(props.urlParam)
					setSearchParams(searchParams)
				}}
				onRemove={(valOption) => {
					searchParams.delete(props.urlParam, valOption.value)
					setSearchParams(searchParams)
				}}
				onSelect={(valOption) => {
					searchParams.append(props.urlParam, valOption.value)
					setSearchParams(searchParams)
				}}
				selectedOptions={selectedOptions}
				urlParam={props.urlParam}
				Icon={Settings2}
				countOnly
			/>

			{selectedOptions.length > 0 ? (
				<div>
					<ChevronRightIcon className="size-3 opacity-50" />
				</div>
			) : null}

			{selectedOptions.map((selectedOption, selectedOptionIdx) => {
				const filter = props.filters.find(
					(filter) => filter.value.urlParam === selectedOption.value,
				)
				if (!filter) {
					return null
				}

				return <FilterSelector key={selectedOptionIdx} filter={filter} />
			})}
		</>
	)
}

function FilterSelector({ filter }: { filter: Filter }) {
	const [searchParams, setSearchParams] = useSearchParams()

	const selectedOptions = useMemo(() => {
		const values = searchParams.getAll(filter.value.urlParam)

		return filter.value.options
			?.filter((option) => {
				return values?.includes(option.value)
			})
			.map((option) => ({
				label: option.label,
				value: option.value,
			}))
	}, [filter.value.options, filter.value.urlParam, searchParams])

	return (
		<Selector
			type={filter.type}
			selectType={filter.selectType}
			label={filter.label}
			options={filter.value.options}
			onClear={() => {
				searchParams.delete(filter.value.urlParam)
				setSearchParams(searchParams)
			}}
			onRemove={(valOption) => {
				searchParams.delete(filter.value.urlParam, valOption.value)
				setSearchParams(searchParams)
			}}
			onSelect={(valOption) => {
				searchParams.append(filter.value.urlParam, valOption.value)
				setSearchParams(searchParams)
			}}
			selectedOptions={selectedOptions}
			urlParam={filter.value.urlParam}
			Icon={filter.Icon}
			className={filter.value.className}
			defaultMessage="Showing all"
		/>
	)
}
