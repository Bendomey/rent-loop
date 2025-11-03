import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'

interface Props {
	placeholder?: string
}

export function SearchInput({ placeholder = 'Search ...' }: Props) {
	const [searchParams, setSearchParams] = useSearchParams()
	const [query, setQuery] = useState<string>(searchParams.get('query') || '')
	useEffect(() => {
		const handler = setTimeout(() => {
			if (query) {
				searchParams.set('query', query)
			} else {
				searchParams.delete('query')
			}
			setSearchParams(searchParams)
		}, 300)
		return () => {
			clearTimeout(handler)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, setSearchParams])

	return (
		<InputGroup>
			<InputGroupInput
				placeholder={placeholder}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			<InputGroupAddon>
				<Search />
			</InputGroupAddon>
		</InputGroup>
	)
}
