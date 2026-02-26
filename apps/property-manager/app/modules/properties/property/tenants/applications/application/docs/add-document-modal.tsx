import { FileText, Info, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { DocumentList } from './document-list'
import type { AttachedDocument, DocMode } from './types'
import { useCreateDocument } from '~/api/documents'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { DocumentUpload } from '~/components/ui/document-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import type { IDocumentTemplate } from '~/modules/settings/documents/controller'

interface AddDocumentModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	propertyId: string | undefined
	application: TenantApplication
	attachedDoc: AttachedDocument | null
	documentTemplates: IDocumentTemplate[]
}

export function AddDocumentModal({
	open,
	onOpenChange,
	propertyId,
	application,
	attachedDoc,
	documentTemplates,
}: AddDocumentModalProps) {
	const [mode, setMode] = useState<DocMode>('manual')
	const [selectedDocument, setSelectedDocument] =
		useState<RentloopDocument | null>(null)
	const revalidator = useRevalidator()

	const {
		upload,
		isLoading: isUploading,
		objectUrl: uploadedUrl,
	} = useUploadObject('tenant-applications/lease-documents')

	const { mutateAsync: createDocument, isPending: isCreating } =
		useCreateDocument()
	const { mutateAsync: updateTenantApplication, isPending: isUpdating } =
		useAdminUpdateTenantApplication()

	const isSaving = isCreating || isUpdating

	const canSave =
		mode === 'online' ? Boolean(selectedDocument) : Boolean(uploadedUrl)

	const handleSave = async () => {
		if (!application.id) return

		if (mode === 'manual') {
			if (!uploadedUrl) return

			await updateTenantApplication({
				id: application.id,
				data: {
					lease_agreement_document_url: uploadedUrl,
					lease_agreement_document_mode: 'MANUAL',
					lease_agreement_document_id: null,
					lease_agreement_document_status: null,
				},
			})
		} else {
			if (!selectedDocument) return

			const newDoc = await createDocument({
				title: `${application.code} - Lease Agreement`,
				content: selectedDocument.content,
				size: selectedDocument.size,
				tags: selectedDocument.tags,
				property_id: propertyId,
				type: 'DOCUMENT',
			})

			if (!newDoc) return

			await updateTenantApplication({
				id: application.id,
				data: {
					lease_agreement_document_id: newDoc.id,
					lease_agreement_document_mode: 'ONLINE',
					lease_agreement_document_status: 'DRAFT',
					lease_agreement_document_url: null,
				},
			})
		}

		void revalidator.revalidate()
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[80vh] overflow-auto sm:max-w-3xl md:h-auto">
				<DialogHeader>
					<DialogTitle>
						{attachedDoc ? 'Change Document' : 'Add Document'}
					</DialogTitle>
					<DialogDescription>
						Upload your own document or select one from the library.
					</DialogDescription>
				</DialogHeader>

				<Tabs value={mode} onValueChange={(value) => setMode(value as DocMode)}>
					<TabsList>
						<TabsTrigger value="manual">
							<Upload className="size-4" />
							Manual Upload
						</TabsTrigger>
						<TabsTrigger value="online">
							<FileText className="size-4" />
							Select from Library
						</TabsTrigger>
					</TabsList>

					<TabsContent value="manual">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Manual Upload</AlertTitle>
								<AlertDescription>
									Upload your own lease agreement or tenancy document. Accepted
									formats are PDF and Word documents up to 5MB.
								</AlertDescription>
							</Alert>
							<DocumentUpload
								acceptedFileTypes={[
									'application/pdf',
									'application/msword',
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
								]}
								label="Upload Lease Document"
								hint="Upload a PDF or Word document (max 5MB)"
								name="lease_document"
								maxByteSize={5242880}
								fileCallback={upload}
								isUploading={isUploading}
							/>
						</div>
					</TabsContent>

					<TabsContent value="online">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Select from Library</AlertTitle>
								<AlertDescription>
									Choose from pre-existing document templates available on the
									platform. These are ready-to-use lease agreements that can be
									attached to this application.
								</AlertDescription>
							</Alert>

							<DocumentList
								documentTemplates={documentTemplates}
								property_id={safeString(propertyId)}
								selectedDocument={selectedDocument}
								onSelectDocument={setSelectedDocument}
							/>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled={!canSave || isSaving} onClick={handleSave}>
						{(isSaving || isUploading) && (
							<Loader2 className="size-4 animate-spin" />
						)}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
