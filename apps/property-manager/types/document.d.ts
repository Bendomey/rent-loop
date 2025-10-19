interface AppDocument {
	id: string
	name: string
	file_size: string
	owner: ClientUser
	status: 'Document.Status.InProgress' | 'Document.Status.Draft' | 'Document.Status.Completed' | 'Document.Status.Archived' | 'Document.Status.Approved'
	created_at: Date
	updated_at: Date
}
