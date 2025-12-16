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
		case 'PropertyUnit.Status.Draft':
			return 'Draft'
		case 'PropertyUnit.Status.Available':
			return 'Available'
		case 'PropertyUnit.Status.Occupied':
			return 'Occupied'
		case 'PropertyUnit.Status.Maintenance':
			return 'Maintenance'
		default:
			return 'Unknown'
	}
}
