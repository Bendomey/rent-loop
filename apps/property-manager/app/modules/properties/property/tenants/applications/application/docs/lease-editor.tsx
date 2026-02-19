import { type SerializedEditorState } from 'lexical'
import { CheckCircle2, Lock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Editor } from '~/components/blocks/template-editor/editor'
import { LeaseMenuBar } from '~/components/blocks/template-editor/lease-menu-bar'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import type { loader } from '~/routes/_auth.properties.$propertyId_.tenants.applications.$applicationId.lease-editor.$documentId'

const initialValue = {
	root: {
		children: [
			{
				children: [],
				direction: 'ltr',
				format: '',
				indent: 0,
				type: 'paragraph',
				version: 1,
			},
		],
		direction: 'ltr',
		format: '',
		indent: 0,
		type: 'root',
		version: 1,
	},
} as unknown as SerializedEditorState

export function LeaseDocumentModule() {
	const { document, tenantApplication } = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const [editorState, setEditorState] = useState<SerializedEditorState>(
		document?.content ? JSON.parse(document.content) : initialValue,
	)

	if (!document || !tenantApplication) return null

	const handleFinalize = () => {
		// TODO: resolve template fields, lock document, update application status
		toast.info('Finalize for signing is not yet implemented')
		void navigate(-1)
	}

	const handleRevertToDraft = () => {
		// TODO: revert document status back to DRAFT
		toast.info('Revert to draft is not yet implemented')
	}

	const docStatus = tenantApplication.lease_agreement_document_status
	const isReadOnly = docStatus !== 'DRAFT'

	const readOnlyConfig = {
		FINALIZED: {
			icon: <Lock className="mx-auto mb-3 size-8 text-amber-500" />,
			title: 'Document Finalized',
			description:
				'This document has been finalized and is ready for signing. You cannot make edits in this state.',
			action: (
				<Button variant="outline" onClick={handleRevertToDraft}>
					Back to Draft
				</Button>
			),
		},
		SIGNING: {
			icon: <PenLine className="mx-auto mb-3 size-8 text-blue-500" />,
			title: 'Signing in Progress',
			description:
				'This document is currently being signed by the relevant parties. No edits can be made.',
			action: null,
		},
		SIGNED: {
			icon: <CheckCircle2 className="mx-auto mb-3 size-8 text-teal-500" />,
			title: 'Document Signed',
			description:
				'This document has been fully executed and signed by all parties. It is now read-only.',
			action: null,
		},
	} as const

	const config =
		isReadOnly && docStatus ? readOnlyConfig[docStatus] : null

	return (
		<>
			{config && (
				<Dialog open onOpenChange={() => {}}>
					<DialogContent showCloseButton={false} className="text-center sm:max-w-sm">
						<DialogHeader>
							{config.icon}
							<DialogTitle className="text-center">{config.title}</DialogTitle>
							<DialogDescription className="text-center">
								{config.description}
							</DialogDescription>
						</DialogHeader>
						{config.action && (
							<DialogFooter className="justify-center sm:justify-center">
								{config.action}
							</DialogFooter>
						)}
					</DialogContent>
				</Dialog>
			)}
			<Editor
				document={document}
				editorSerializedState={editorState}
				onSerializedChange={(value) => setEditorState(value)}
				menuBar={
					<LeaseMenuBar
						document={document}
						tenantApplication={tenantApplication}
						onFinalize={handleFinalize}
						onRevertToDraft={handleRevertToDraft}
					/>
				}
			/>
		</>
	)
}
