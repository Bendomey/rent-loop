import { type SerializedEditorState } from 'lexical'
import { CheckCircle2, Lock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useUpdateTenantApplication } from '~/api/tenant-applications'
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
	const updateTenantApplication = useUpdateTenantApplication()
	const revalidator = useRevalidator()
	const navigate = useNavigate()

	const [editorState, setEditorState] = useState<SerializedEditorState>(
		document?.content ? JSON.parse(document.content) : initialValue,
	)

	if (!document || !tenantApplication) return null

	const handleFinalize = () => {
		if (updateTenantApplication.isPending) return
		updateTenantApplication.mutate(
			{
				id: tenantApplication.id,
				data: { lease_agreement_document_status: 'FINALIZED' },
			},
			{
				onSuccess: () => {
					toast.success('Document finalized')
					void revalidator.revalidate()
					void navigate(
						`/properties/${tenantApplication.desired_unit.property_id}/tenants/applications/${tenantApplication.id}/docs`,
					)
				},
				onError: () => {
					toast.error('Failed to finalize')
				},
			},
		)
	}

	const handleRevertToDraft = () => {
		if (updateTenantApplication.isPending) return
		updateTenantApplication.mutate(
			{
				id: tenantApplication.id,
				data: { lease_agreement_document_status: 'DRAFT' },
			},
			{
				onSuccess: () => {
					toast.success('Reverted to draft')
					void revalidator.revalidate()
				},
				onError: () => {
					toast.error('Failed to revert')
				},
			},
		)
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
				<div className="space-x-2">
					<Link
						to={`/properties/${tenantApplication.desired_unit.property_id}/tenants/applications/${tenantApplication.id}/docs`}
					>
						<Button variant="outline">Go Back</Button>
					</Link>
					<Button
						disabled={updateTenantApplication.isPending}
						onClick={handleRevertToDraft}
					>
						Back to Draft
					</Button>
				</div>
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

	const config = isReadOnly && docStatus ? readOnlyConfig[docStatus] : null

	return (
		<>
			{config && (
				<Dialog open onOpenChange={() => {}}>
					<DialogContent
						showCloseButton={false}
						className="text-center sm:max-w-sm"
					>
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
