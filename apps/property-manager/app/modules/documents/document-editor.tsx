import { type SerializedEditorState } from 'lexical'
import { CheckCircle2, Lock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { DocumentMenuBar } from '~/components/blocks/template-editor/document-menu-bar'
import { Editor } from '~/components/blocks/template-editor/editor'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId_.documents.$documentId.editor'

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

export function DocumentEditorModule() {
	const { document, tenantApplication, returnUrl } =
		useLoaderData<typeof loader>()
	const updateTenantApplication = useAdminUpdateTenantApplication()
	const revalidator = useRevalidator()
	const navigate = useNavigate()
	const { clientUser } = useClient()

	const [editorState, setEditorState] = useState<SerializedEditorState>(
		document?.content ? JSON.parse(document.content) : initialValue,
	)

	if (!document) return null

	const goBack = () => {
		if (returnUrl) {
			void navigate(returnUrl)
		} else {
			void navigate(-1)
		}
	}

	const handleFinalize = () => {
		if (!tenantApplication || updateTenantApplication.isPending) return
		updateTenantApplication.mutate(
			{
				client_id: safeString(clientUser?.client_id),
				id: tenantApplication.id,
				property_id: tenantApplication.desired_unit.property_id,
				data: { lease_agreement_document_status: 'FINALIZED' },
			},
			{
				onSuccess: () => {
					toast.success('Document finalized')
					void revalidator.revalidate()
					goBack()
				},
				onError: () => toast.error('Failed to finalize'),
			},
		)
	}

	const handleRevertToDraft = () => {
		if (!tenantApplication || updateTenantApplication.isPending) return
		updateTenantApplication.mutate(
			{
				client_id: safeString(clientUser?.client_id),
				id: tenantApplication.id,
				property_id: tenantApplication.desired_unit.property_id,
				data: { lease_agreement_document_status: 'DRAFT' },
			},
			{
				onSuccess: () => {
					toast.success('Reverted to draft')
					void revalidator.revalidate()
				},
				onError: () => toast.error('Failed to revert'),
			},
		)
	}

	const docStatus = tenantApplication?.lease_agreement_document_status ?? null

	const subtitle = tenantApplication
		? [
				[tenantApplication.first_name, tenantApplication.last_name]
					.filter(Boolean)
					.join(' '),
				tenantApplication.desired_unit?.name,
			]
				.filter(Boolean)
				.join(' / ') + ` • #${tenantApplication.code}`
		: undefined

	const readOnlyConfig = {
		FINALIZED: {
			icon: <Lock className="mx-auto mb-3 size-8 text-amber-500" />,
			title: 'Document Finalized',
			description:
				'This document has been finalized and is ready for signing. You cannot make edits in this state.',
			action: (
				<div className="space-x-2">
					<Button variant="outline" onClick={goBack}>
						Go Back
					</Button>
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

	const isReadOnly = docStatus != null && docStatus !== 'DRAFT'
	const config =
		isReadOnly && docStatus
			? (readOnlyConfig[docStatus as keyof typeof readOnlyConfig] ?? null)
			: null

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
					<DocumentMenuBar
						document={document}
						docStatus={docStatus}
						subtitle={subtitle}
						returnUrl={returnUrl}
						onFinalize={handleFinalize}
						onRevertToDraft={handleRevertToDraft}
					/>
				}
			/>
		</>
	)
}
