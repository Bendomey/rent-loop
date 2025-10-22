import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Field, FieldLabel } from './ui/field'
import { Input } from './ui/input'

interface PropertyTagInputProps {
	value: string[]
	onChange: (tags: string[]) => void
}

export function PropertyTagInput({
	value = [],
	onChange,
}: PropertyTagInputProps) {
	const [inputValue, setInputValue] = useState('')

	const addTag = () => {
		const newTag = inputValue.trim()
		if (newTag && !value.includes(newTag)) {
			onChange([...value, newTag])
			setInputValue('')
		}
	}

	const removeTag = (tag: string) => {
		onChange(value.filter((t) => t !== tag))
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			addTag()
		}
	}

	return (
		<div className="w-full">
			<Field>
				<FieldLabel htmlFor="tags">Property Tags</FieldLabel>

				<div className="flex gap-2">
					<Input
						id="tags"
						type="text"
						placeholder="Type and press Enter"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1"
					/>
					<Button type="button" onClick={addTag}>
						Create
					</Button>
				</div>
			</Field>

			<div className="mt-2 mb-2 flex flex-wrap gap-2">
				{value.map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className="flex items-center gap-1 px-3 py-1"
					>
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="hover:text-red-500"
						>
							<X className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>
		</div>
	)
}
