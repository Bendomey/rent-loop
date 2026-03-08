import { Plus, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './ui/dialog'
import { FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { cn } from '~/lib/utils'

const SUGGESTED_FEATURES = [
	{
		category: 'Space',
		features: [
			{ key: 'Bedrooms', defaultValue: '1' },
			{ key: 'Bathrooms', defaultValue: '1' },
			{ key: 'Square Footage', defaultValue: '' },
			{ key: 'Floor Level', defaultValue: '1' },
			{ key: 'Living Room', defaultValue: 'Yes' },
			{ key: 'Dining Area', defaultValue: 'Yes' },
			{ key: 'Kitchen', defaultValue: 'Yes' },
			{ key: 'Study / Office Room', defaultValue: 'Yes' },
			{ key: 'Walk-in Closet', defaultValue: 'Yes' },
			{ key: 'Storage Room', defaultValue: 'Yes' },
			{ key: 'Balcony', defaultValue: 'Yes' },
			{ key: 'Terrace', defaultValue: 'Yes' },
		],
	},
	{
		category: 'Appliances & Furnishing',
		features: [
			{ key: 'Furnished', defaultValue: 'Yes' },
			{ key: 'Air Conditioning', defaultValue: 'Yes' },
			{ key: 'Ceiling Fan', defaultValue: 'Yes' },
			{ key: 'Water Heater', defaultValue: 'Yes' },
			{ key: 'Refrigerator', defaultValue: 'Yes' },
			{ key: 'Microwave', defaultValue: 'Yes' },
			{ key: 'Dishwasher', defaultValue: 'Yes' },
			{ key: 'Washing Machine', defaultValue: 'Yes' },
			{ key: 'Dryer', defaultValue: 'Yes' },
			{ key: 'TV / Cable Ready', defaultValue: 'Yes' },
			{ key: 'Internet / Wi-Fi', defaultValue: 'Yes' },
			{ key: 'Fireplace', defaultValue: 'Yes' },
		],
	},
	{
		category: 'Building & Facilities',
		features: [
			{ key: 'Parking', defaultValue: 'Yes' },
			{ key: 'Visitor Parking', defaultValue: 'Yes' },
			{ key: 'Elevator', defaultValue: 'Yes' },
			{ key: 'Swimming Pool', defaultValue: 'Yes' },
			{ key: 'Gym / Fitness Center', defaultValue: 'Yes' },
			{ key: 'Rooftop Access', defaultValue: 'Yes' },
			{ key: 'Garden / Outdoor Space', defaultValue: 'Yes' },
			{ key: "Children's Play Area", defaultValue: 'Yes' },
			{ key: 'Concierge', defaultValue: 'Yes' },
			{ key: 'Laundry', defaultValue: 'Shared' },
		],
	},
	{
		category: 'Security & Utilities',
		features: [
			{ key: 'Security', defaultValue: '24/7' },
			{ key: 'CCTV', defaultValue: 'Yes' },
			{ key: 'Intercom / Video Doorbell', defaultValue: 'Yes' },
			{ key: 'Gated Community', defaultValue: 'Yes' },
			{ key: 'Backup Generator', defaultValue: 'Yes' },
			{ key: 'Borehole / Water Tank', defaultValue: 'Yes' },
			{ key: 'Prepaid Electricity', defaultValue: 'Yes' },
			{ key: 'Gas', defaultValue: 'Yes' },
		],
	},
	{
		category: 'Policy & Access',
		features: [
			{ key: 'Pet Friendly', defaultValue: 'Yes' },
			{ key: 'Smoking Allowed', defaultValue: 'Yes' },
			{ key: 'Subletting Allowed', defaultValue: 'Yes' },
			{ key: 'Short-term Rental', defaultValue: 'Yes' },
			{ key: 'Wheelchair Accessible', defaultValue: 'Yes' },
			{ key: 'Ground Floor Unit', defaultValue: 'Yes' },
		],
	},
	{
		category: 'Office / Commercial',
		features: [
			{ key: 'Meeting Rooms', defaultValue: 'Yes' },
			{ key: 'Reception Area', defaultValue: 'Yes' },
			{ key: 'Open Plan', defaultValue: 'Yes' },
			{ key: 'Private Offices', defaultValue: 'Yes' },
			{ key: 'Kitchenette', defaultValue: 'Yes' },
			{ key: 'Printer / Copier', defaultValue: 'Yes' },
			{ key: 'Server Room', defaultValue: 'Yes' },
			{ key: 'Loading Bay', defaultValue: 'Yes' },
			{ key: 'Storefront', defaultValue: 'Yes' },
		],
	},
]

export function FeatureInput() {
	const { setValue, watch } = useFormContext<{ features: StringRecord }>()
	const [isAdding, setIsAdding] = useState(false)
	const [featureKey, setFeatureKey] = useState('')
	const [featureValue, setFeatureValue] = useState('')
	const [suggestionsOpen, setSuggestionsOpen] = useState(false)
	const [selectedSuggestions, setSelectedSuggestions] = useState<
		Record<string, string>
	>({})

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
					<>
						<button
							type="button"
							onClick={() => setIsAdding(true)}
							className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
						>
							<Plus className="text-muted-foreground size-5" />
							<span className="text-muted-foreground text-xs">Add</span>
						</button>
						<button
							type="button"
							onClick={() => setSuggestionsOpen(true)}
							className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
						>
							<Sparkles className="text-muted-foreground size-5" />
							<span className="text-muted-foreground text-xs">Suggestions</span>
						</button>
					</>
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

			<Dialog
				open={suggestionsOpen}
				onOpenChange={(open) => {
					setSuggestionsOpen(open)
					if (!open) setSelectedSuggestions({})
				}}
			>
				<DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Feature Suggestions</DialogTitle>
						<DialogDescription>
							Select features to add to your unit. You can edit the values
							before adding.
						</DialogDescription>
					</DialogHeader>

					<div className="min-h-0 flex-1 overflow-y-auto">
						<div className="space-y-5">
							{SUGGESTED_FEATURES.map((group) => (
								<div key={group.category}>
									<p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
										{group.category}
									</p>
									<div className="space-y-2">
										{group.features.map((suggestion) => {
											const alreadyAdded = !!features[suggestion.key]
											const isSelected = suggestion.key in selectedSuggestions
											return (
												<div
													key={suggestion.key}
													className="flex items-center gap-3"
												>
													<Checkbox
														checked={isSelected}
														disabled={alreadyAdded}
														onCheckedChange={(checked) => {
															if (checked) {
																setSelectedSuggestions((prev) => ({
																	...prev,
																	[suggestion.key]: suggestion.defaultValue,
																}))
															} else {
																setSelectedSuggestions((prev) => {
																	const next = { ...prev }
																	delete next[suggestion.key]
																	return next
																})
															}
														}}
													/>
													<span
														className={cn(
															'flex-1 text-sm',
															alreadyAdded && 'text-muted-foreground',
														)}
													>
														{suggestion.key}
														{alreadyAdded && (
															<span className="text-muted-foreground ml-1 text-xs">
																(already added)
															</span>
														)}
													</span>
													{isSelected && (
														<Input
															value={selectedSuggestions[suggestion.key]}
															onChange={(e) =>
																setSelectedSuggestions((prev) => ({
																	...prev,
																	[suggestion.key]: e.target.value,
																}))
															}
															className="w-28"
															placeholder="Value"
														/>
													)}
												</div>
											)
										})}
									</div>
								</div>
							))}
						</div>
					</div>

					<DialogFooter>
						<Button variant="ghost" onClick={() => setSuggestionsOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={Object.keys(selectedSuggestions).length === 0}
							onClick={() => {
								setValue(
									'features',
									{ ...features, ...selectedSuggestions },
									{ shouldDirty: true, shouldValidate: true },
								)
								setSelectedSuggestions({})
								setSuggestionsOpen(false)
							}}
						>
							Add
							{Object.keys(selectedSuggestions).length > 0
								? ` ${Object.keys(selectedSuggestions).length} `
								: ' '}
							Features
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
