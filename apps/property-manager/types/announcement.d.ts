interface FetchAnnouncementFilter {
	status?: string
	type?: string
	priority?: string
	property_id?: string
}

interface Announcement {
	id: string
	title: string
	content: string
	type: 'MAINTENANCE' | 'COMMUNITY' | 'POLICY_CHANGE' | 'EMERGENCY'
	priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
	status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED'
	property_id?: Nullable<string>
	property?: Nullable<Property>
	property_block_id?: Nullable<string>
	property_block?: Nullable<PropertyBlock>
	target_unit_ids?: string[]
	scheduled_at?: Nullable<Date>
	expires_at?: Nullable<Date>
	published_at?: Nullable<Date>
	created_at: Date
	updated_at: Date
}

interface CreateAnnouncementInput {
	title: string
	content: string
	type: 'MAINTENANCE' | 'COMMUNITY' | 'POLICY_CHANGE' | 'EMERGENCY'
	priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
	property_id?: string
	property_block_id?: string
	target_unit_ids?: string[]
	scheduled_at?: string
	expires_at?: string
}
