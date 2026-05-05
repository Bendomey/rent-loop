export type DocMode = 'manual' | 'online'

export interface AttachedDocument {
	mode: DocMode
	title: string
	documentId?: string
	propertyManagerSignedAt: Date | null
	propertyManagerSignedBy: { name: string } | null
	tenantSignedAt: Date | null
}
