---
id: RENTL-15
title: Add suggested feature listings when creating/updating units
status: To Do
assignee: []
created_date: '2026-03-07 20:03'
updated_date: '2026-03-07 20:23'
labels: []
milestone: m-4
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When creating a unit, you need to manually add features to them.

## Current implementation
Users enter their features listings manually. Problem is they might not think of all scenarios, so we need to add sugested feature listings that could be in a potentional property/unit/apartment.

## Changes to be added
- We need to change this whole thing into a way for users to continue to add feature listings(feature:value).
- But we need to also add suggested features listings and default values(if possible), that way it helps owners build up a complete unit instead of leaving details out. the sugested listings, could be in a modal? we need to research on possible feature listings for apartment/offices/unit/etc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Features section shows both 'Add' and 'Suggestions' buttons
- [ ] #2 Clicking 'Suggestions' opens a dialog with features grouped by category (Space, Amenities, Building, Policy)
- [ ] #3 Checking a suggestion pre-fills its default value; the value is editable before adding
- [ ] #4 Features already added to the form show as disabled/already-added in the dialog
- [ ] #5 Clicking 'Add X Features' adds all selected suggestions to the form and closes the dialog
- [ ] #6 Light and dark mode both render correctly (dark mode fix on hover background)
- [ ] #7 yarn types:check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Approach
Purely a frontend change — no backend modifications needed. Features are already stored as `map[string]string` (JSONB) and the API accepts arbitrary key-value pairs.

**Single file:** `apps/property-manager/app/components/feature.tsx`

---

## 1. Add `SUGGESTED_FEATURES` constant

Static array defined at the top of the file (not exported):

```ts
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
      { key: 'Study / Office Room', defaultValue: 'No' },
      { key: 'Walk-in Closet', defaultValue: 'No' },
      { key: 'Storage Room', defaultValue: 'No' },
      { key: 'Balcony', defaultValue: 'No' },
      { key: 'Terrace', defaultValue: 'No' },
    ],
  },
  {
    category: 'Appliances & Furnishing',
    features: [
      { key: 'Furnished', defaultValue: 'No' },
      { key: 'Air Conditioning', defaultValue: 'Yes' },
      { key: 'Ceiling Fan', defaultValue: 'Yes' },
      { key: 'Water Heater', defaultValue: 'Yes' },
      { key: 'Refrigerator', defaultValue: 'No' },
      { key: 'Microwave', defaultValue: 'No' },
      { key: 'Dishwasher', defaultValue: 'No' },
      { key: 'Washing Machine', defaultValue: 'No' },
      { key: 'Dryer', defaultValue: 'No' },
      { key: 'TV / Cable Ready', defaultValue: 'Yes' },
      { key: 'Internet / Wi-Fi', defaultValue: 'Yes' },
      { key: 'Fireplace', defaultValue: 'No' },
    ],
  },
  {
    category: 'Building & Facilities',
    features: [
      { key: 'Parking', defaultValue: 'Yes' },
      { key: 'Visitor Parking', defaultValue: 'No' },
      { key: 'Elevator', defaultValue: 'No' },
      { key: 'Swimming Pool', defaultValue: 'No' },
      { key: 'Gym / Fitness Center', defaultValue: 'No' },
      { key: 'Rooftop Access', defaultValue: 'No' },
      { key: 'Garden / Outdoor Space', defaultValue: 'No' },
      { key: 'Children\'s Play Area', defaultValue: 'No' },
      { key: 'Concierge', defaultValue: 'No' },
      { key: 'Laundry', defaultValue: 'Shared' },
    ],
  },
  {
    category: 'Security & Utilities',
    features: [
      { key: 'Security', defaultValue: '24/7' },
      { key: 'CCTV', defaultValue: 'Yes' },
      { key: 'Intercom / Video Doorbell', defaultValue: 'No' },
      { key: 'Gated Community', defaultValue: 'No' },
      { key: 'Backup Generator', defaultValue: 'No' },
      { key: 'Borehole / Water Tank', defaultValue: 'No' },
      { key: 'Prepaid Electricity', defaultValue: 'No' },
      { key: 'Gas', defaultValue: 'No' },
    ],
  },
  {
    category: 'Policy & Access',
    features: [
      { key: 'Pet Friendly', defaultValue: 'No' },
      { key: 'Smoking Allowed', defaultValue: 'No' },
      { key: 'Subletting Allowed', defaultValue: 'No' },
      { key: 'Short-term Rental', defaultValue: 'No' },
      { key: 'Wheelchair Accessible', defaultValue: 'No' },
      { key: 'Ground Floor Unit', defaultValue: 'No' },
    ],
  },
  {
    category: 'Office / Commercial',
    features: [
      { key: 'Meeting Rooms', defaultValue: 'Yes' },
      { key: 'Reception Area', defaultValue: 'No' },
      { key: 'Open Plan', defaultValue: 'Yes' },
      { key: 'Private Offices', defaultValue: 'No' },
      { key: 'Kitchenette', defaultValue: 'No' },
      { key: 'Printer / Copier', defaultValue: 'No' },
      { key: 'Server Room', defaultValue: 'No' },
      { key: 'Loading Bay', defaultValue: 'No' },
      { key: 'Storefront', defaultValue: 'No' },
    ],
  },
]
```

---

## 2. New state and imports

```tsx
import { Sparkles } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog'
import { Checkbox } from './ui/checkbox'

// Inside component:
const [suggestionsOpen, setSuggestionsOpen] = useState(false)
const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({})
```

---

## 3. Add "Suggestions" button

Add a second dashed button in the features grid (next to the existing "Add" button):

```tsx
<button
  type="button"
  onClick={() => setSuggestionsOpen(true)}
  className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
>
  <Sparkles className="text-muted-foreground size-5" />
  <span className="text-muted-foreground text-xs">Suggestions</span>
</button>
```

Also fix the existing "Add" button: add `dark:hover:bg-zinc-900` to it.

---

## 4. Suggestions Dialog

```tsx
<Dialog open={suggestionsOpen} onOpenChange={(open) => {
  setSuggestionsOpen(open)
  if (!open) setSelectedSuggestions({})
}}>
  <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Feature Suggestions</DialogTitle>
      <DialogDescription>
        Select features to add to your unit. You can edit the values before adding.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-5">
      {SUGGESTED_FEATURES.map((group) => (
        <div key={group.category}>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            {group.category}
          </p>
          <div className="space-y-2">
            {group.features.map((suggestion) => {
              const alreadyAdded = !!features[suggestion.key]
              const isSelected = suggestion.key in selectedSuggestions
              return (
                <div key={suggestion.key} className="flex items-center gap-3">
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
                  <span className={cn('flex-1 text-sm', alreadyAdded && 'text-muted-foreground')}>
                    {suggestion.key}
                    {alreadyAdded && (
                      <span className="text-muted-foreground ml-1 text-xs">(already added)</span>
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

    <DialogFooter>
      <Button variant="ghost" onClick={() => setSuggestionsOpen(false)}>Cancel</Button>
      <Button
        disabled={Object.keys(selectedSuggestions).length === 0}
        onClick={() => {
          setValue('features', { ...features, ...selectedSuggestions }, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setSelectedSuggestions({})
          setSuggestionsOpen(false)
        }}
      >
        Add {Object.keys(selectedSuggestions).length > 0
          ? `${Object.keys(selectedSuggestions).length} `
          : ''}Features
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Key notes
- 6 categories, 47 total suggested features covering residential, commercial, and office units
- `selectedSuggestions` is cleared on dialog close (Cancel or submit)
- Features already in the form show as disabled with "(already added)" label
- Value inputs appear inline when a suggestion is checked — user can edit before adding
<!-- SECTION:PLAN:END -->
