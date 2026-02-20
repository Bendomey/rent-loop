import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from './ui/button'
import { FieldLabel } from './ui/field'
import { Input } from './ui/input'

export function FeatureInput() {
	const { setValue, watch } = useFormContext<{ features: StringRecord }>()
	const [isAdding, setIsAdding] = useState(false)
	const [featureKey, setFeatureKey] = useState('')
	const [featureValue, setFeatureValue] = useState('')

	const features = watch('features') || {}
	const entries = Object.entries(features)

	const addFeature = () => {
		const key = featureKey.trim()
		const value = featureValue.trim()
		if (key && value && !features[key]) {
			setValue(
				'features',
				{ ...features, [key]: value },
				{ shouldDirty: true, shouldValidate: true },
			)
			setFeatureKey('')
			setFeatureValue('')
			setIsAdding(false)
		}
	}

	const removeFeature = (key: string) => {
		const updated = { ...features }
		delete updated[key]
		setValue('features', updated, {
			shouldDirty: true,
			shouldValidate: true,
		})
	}

	const cancelAdding = () => {
		setFeatureKey('')
		setFeatureValue('')
		setIsAdding(false)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			addFeature()
		}
		if (e.key === 'Escape') {
			cancelAdding()
		}
	}

	return (
		<div className="w-full space-y-3">
			<FieldLabel>Features</FieldLabel>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{entries.map(([key, value]) => (
					<div key={key} className="group relative rounded-lg border p-3">
						<button
							type="button"
							onClick={() => removeFeature(key)}
							className="absolute top-2 right-2 rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
						>
							<X className="size-3.5" />
						</button>
						<p className="text-sm font-medium">{key}</p>
						<p className="text-muted-foreground text-sm">{value}</p>
					</div>
				))}

				{!isAdding && (
					<button
						type="button"
						onClick={() => setIsAdding(true)}
						className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:bg-zinc-50"
					>
						<Plus className="text-muted-foreground size-5" />
						<span className="text-muted-foreground text-xs">Add</span>
					</button>
				)}
			</div>

			{isAdding && (
				<div className="rounded-lg border p-3">
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Feature name (e.g., Parking)"
							value={featureKey}
							onChange={(e) => setFeatureKey(e.target.value)}
							onKeyDown={handleKeyDown}
							className="flex-1"
							autoFocus
						/>
						<Input
							type="text"
							placeholder="Value (e.g., Yes)"
							value={featureValue}
							onChange={(e) => setFeatureValue(e.target.value)}
							onKeyDown={handleKeyDown}
							className="flex-1"
						/>
					</div>
					<div className="mt-3 flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={cancelAdding}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={!featureKey.trim() || !featureValue.trim()}
							onClick={addFeature}
						>
							Add
						</Button>
					</div>
				</div>
			)}

			{entries.length === 0 && !isAdding && (
				<p className="text-muted-foreground text-sm">Optional</p>
			)}
		</div>
	)
}
