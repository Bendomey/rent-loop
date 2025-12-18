export function getPropertyStatusLabel(propertyStatus: Property['status']) {
	switch (propertyStatus) {
		case 'Property.Status.Active':
			return 'Active'
		case 'Property.Status.Inactive':
			return 'Inactive'
		case 'Property.Status.Maintenance':
			return 'Maintenance'
		default:
			return 'Unknown'
	}
}

export function getPropertyTypeLabel(propertyType: Property['type']) {
	switch (propertyType) {
		case 'SINGLE':
			return 'Single Unit'
		case 'MULTI':
			return 'Multi-Unit'
		default:
			return 'Unknown'
	}
}

export function getPropertyUnitStatusLabel(
	propertyStatus: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Draft':
			return 'Draft'
		case 'Unit.Status.Available':
			return 'Available'
		case 'Unit.Status.Occupied':
			return 'Occupied'
		case 'Unit.Status.Maintenance':
			return 'Maintenance'
		default:
			return 'Unknown'
	}
}
