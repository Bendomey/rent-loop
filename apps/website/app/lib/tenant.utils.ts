const ID_TYPE_LABELS: Record<string, string> = {
	DRIVER_LICENSE: "Driver's License",
	PASSPORT: 'Passport',
	NATIONAL_ID: 'National ID',
	GHANA_CARD: 'Ghana Card',
}

export function getIdTypeLabel(idType?: string | null): string | undefined {
	if (!idType) return undefined
	return ID_TYPE_LABELS[idType] ?? idType
}
