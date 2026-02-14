import { FileText, Info, Upload } from 'lucide-react'
import { useState } from 'react'
import { DocumentList } from './document-list'
import type { AttachedDocument, DocMode } from './types'
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
import { safeString } from '~/lib/strings'

interface AddDocumentModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	propertyId: string | undefined
	attachedDoc: AttachedDocument | null
}

export function AddDocumentModal({
	open,
	onOpenChange,
	propertyId,
	attachedDoc,
}: AddDocumentModalProps) {
	const [mode, setMode] = useState<DocMode>('manual')
	const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
		null,
	)

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

				<Tabs
					value={mode}
					onValueChange={(value) => setMode(value as DocMode)}
				>
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
									Upload your own lease agreement or tenancy document.
									Accepted formats are PDF and Word documents up to 5MB.
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
							/>
						</div>
					</TabsContent>

					<TabsContent value="online">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Select from Library</AlertTitle>
								<AlertDescription>
									Choose from pre-existing document templates available on
									the platform. These are ready-to-use lease agreements
									that can be attached to this application.
								</AlertDescription>
							</Alert>

							<DocumentList
								property_id={safeString(propertyId)}
								selectedDocumentId={selectedDocumentId}
								onSelectDocument={setSelectedDocumentId}
							/>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={mode === 'online' ? !selectedDocumentId : true}
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
