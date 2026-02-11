
export function getPropertyUnitStatusLabel(
	propertyStatus?: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Available':
			return 'Available'
		case 'Unit.Status.Unavailable':
			return 'Occupied'
		default:
			return 'Unknown'
	}
}

export function getPropertyUnitStatusColor(
	propertyStatus?: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Available':
			return 'bg-green-100 text-green-800'
		case 'Unit.Status.Unavailable':
			return 'bg-red-100 text-red-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}
