import { X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Field, FieldLabel } from './ui/field'
import { Input } from './ui/input'

export function PropertyTagInput() {
	const { setValue, watch } = useFormContext<{ tags: string[] }>()
	const [inputValue, setInputValue] = useState('')

	const value = watch('tags') || []

	const addTag = () => {
		const newTag = inputValue.trim()
		if (newTag && !value.includes(newTag)) {
			setValue('tags', [...value, newTag], {
				shouldDirty: true,
				shouldValidate: true,
			})
			setInputValue('')
		}
	}

	const removeTag = (tag: string) => {
		setValue(
			'tags',
			value.filter((t) => t !== tag),
			{
				shouldDirty: true,
				shouldValidate: true,
			},
		)
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
				<FieldLabel htmlFor="tags">Tags</FieldLabel>

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
					<Button
						disabled={inputValue.trim().length === 0}
						type="button"
						onClick={addTag}
					>
						Create
					</Button>
				</div>
				<p className="text-muted-foreground text-sm">
					Add tags to help categorize and identify the property. This is
					optional.
				</p>
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
