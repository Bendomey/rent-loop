import { X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Field, FieldLabel } from './ui/field'
import { Input } from './ui/input'

export function FeatureInput() {
	const { setValue, watch } = useFormContext<{ features: StringRecord }>()
	const [featureKey, setFeatureKey] = useState('')
	const [featureValue, setFeatureValue] = useState('')

	const features = watch('features') || {}

	const addFeature = () => {
		const key = featureKey.trim()
		const value = featureValue.trim()
		if (key && value && !features[key]) {
			setValue(
				'features',
				{
					...features,
					[key]: value,
				},
				{
					shouldDirty: true,
					shouldValidate: true,
				},
			)
			setFeatureKey('')
			setFeatureValue('')
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			addFeature()
		}
	}

	return (
		<div className="w-full">
			<Field>
				<FieldLabel htmlFor="featureKey">Features</FieldLabel>
				<div className="mb-2 flex gap-2">
					<Input
						id="featureKey"
						type="text"
						placeholder="Feature name (e.g., Parking)"
						value={featureKey}
						onChange={(e) => setFeatureKey(e.target.value)}
						className="flex-1"
					/>
					<Input
						id="featureValue"
						type="text"
						placeholder="Feature value (e.g., Yes)"
						value={featureValue}
						onChange={(e) => setFeatureValue(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1"
					/>
					<Button
						disabled={featureKey.trim() === '' || featureValue.trim() === ''}
						type="button"
						onClick={addFeature}
					>
						Add
					</Button>
				</div>
			</Field>

			<div className="mt-2 mb-2 flex flex-wrap gap-2">
				{Object.entries(features).map(([key, value]) => (
					<Badge
						key={key}
						variant="secondary"
						className="flex items-center gap-1 px-3 py-1"
					>
						<span>
							{key}: {value}
						</span>
						<button
							type="button"
							onClick={() => removeFeature(key)}
							className="hover:text-red-500"
						>
							<X className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>
			{Object.keys(features).length === 0 && (
				<p className="text-muted-foreground text-sm">Optional</p>
			)}
		</div>
	)
}
