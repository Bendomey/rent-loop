import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useUpdateDocument } from '~/api/documents'
import { useSignDocument } from '~/api/signing'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import { SIGNATURE_ROLE_LABELS } from '~/components/editor/nodes/signature-node'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	getSignatureStatuses,
	injectSignatureIntoState,
} from '~/lib/lexical.utils'
import { dataUrlToBlob } from '~/lib/utils'
import type { loader } from '~/routes/sign.$token'

function DocumentExpired() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-100">
			<div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
				<div className="mb-4 flex justify-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-7 w-7 text-zinc-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
							/>
						</svg>
					</div>
				</div>
				<h1 className="text-xl font-semibold text-zinc-900">
					Link Unavailable
				</h1>
				<p className="mt-2 text-sm text-zinc-500">
					This signing link has expired or the document no longer exists. Please
					contact the sender to request a new link.
				</p>
			</div>
		</div>
	)
}

export function PublicSigningModule() {
	const { signingToken, expired, tenantApplication } =
		useLoaderData<typeof loader>()
	const signDocument = useSignDocument()
	const updateDocument = useUpdateDocument()
	const updateTenantApplication = useUpdateTenantApplication()
	const revalidator = useRevalidator()

	const signerName = signingToken?.signer_name ?? null
	const [isSigning, setIsSigning] = useState(false)
	const [enteredName, setEnteredName] = useState('')
	const [nameConfirmed, setNameConfirmed] = useState(!!signerName)

	if (
		expired ||
		!signingToken?.document ||
		(signingToken?.tenant_application_id && !tenantApplication)
	) {
		return <DocumentExpired />
	}

	const document = signingToken.document
	const signerRole = signingToken.role as SignatureRole
	const applicationCode = tenantApplication?.code ?? '' // TODO: if it's a lease instead, lets use it's code instead.

	const editorState: SerializedEditorState = document.content
		? JSON.parse(document.content)
		: null

	if (!editorState) return null

	const resolvedName = signerName || enteredName
	const signatureStatuses = getSignatureStatuses(editorState)

	const uploadSignature = async (dataUrl: string) => {
		const blob = dataUrlToBlob(dataUrl)
		const file = new File([blob], 'signature.png', { type: 'image/png' })
		const formData = new FormData()
		formData.append('file', file)
		formData.append(
			'objectKey',
			`signatures/${document.id}-${Date.now()}-${signerRole}.png`,
		)

		const uploadResponse = await fetch('/api/r2/upload', {
			method: 'POST',
			body: formData,
		})
		const uploadResult = (await uploadResponse.json()) as { url?: string }

		if (!uploadResponse.ok || !uploadResult.url) {
			toast.error('Failed to upload signature')
			return
		}

		return uploadResult
	}

	const handleSign = async (role: SignatureRole, signatureDataUrl: string) => {
		setIsSigning(true)

		try {
			// 1. Upload signature image to R2
			const uploadResult = await uploadSignature(signatureDataUrl)
			if (!uploadResult?.url) return

			// 2. Submit signature using the signing token
			await signDocument.mutateAsync({
				token: signingToken.token,
				signature_url: uploadResult.url,
				signer_name: resolvedName,
			})

			// 3. Stamp the matching SignatureNode in the serialized editor state
			const signedAt = new Date().toISOString()
			const updatedState = injectSignatureIntoState(
				editorState,
				role,
				uploadResult.url,
				resolvedName,
				signedAt,
			)

			// 4. Save the updated document content
			await updateDocument.mutateAsync({
				id: document.id,
				content: JSON.stringify(updatedState),
			})

			// 5. Update application status based on remaining unsigned signatures
			if (tenantApplication) {
				const allSigned = getSignatureStatuses(updatedState).every(
					(s) => s.signed,
				)
				await updateTenantApplication.mutateAsync({
					id: tenantApplication.id,
					data: {
						lease_agreement_document_status: allSigned ? 'SIGNED' : 'SIGNING',
					},
				})
			}

			toast.success('Document signed successfully')
			void revalidator.revalidate()
		} catch {
			toast.error('Failed to sign document')
		} finally {
			setIsSigning(false)
		}
	}

	// --- Name entry gate ---
	if (!nameConfirmed) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-100">
				<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
					<div className="mb-6 text-center">
						<h1 className="text-xl font-semibold">Sign Document</h1>
						<p className="mt-1 text-sm text-zinc-500">
							You&apos;ve been invited to sign as{' '}
							<span className="font-medium text-zinc-700">
								{SIGNATURE_ROLE_LABELS[signerRole]}
							</span>
						</p>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="signer-name">Enter your full name</Label>
							<Input
								id="signer-name"
								placeholder="e.g. Kofi Mensah"
								value={enteredName}
								onChange={(e) => setEnteredName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && enteredName.trim()) {
										setNameConfirmed(true)
									}
								}}
							/>
							<p className="text-xs text-zinc-400">
								This name will appear alongside your signature on the document.
							</p>
						</div>

						<Button
							className="w-full"
							disabled={!enteredName.trim()}
							onClick={() => setNameConfirmed(true)}
						>
							Continue to Document
						</Button>
					</div>
				</div>
			</div>
		)
	}

	const signedCount = signatureStatuses.filter((s) => s.signed).length

	// --- Signing view ---
	return (
		<SigningView
			key={signedCount}
			documentTitle={document.title}
			applicationCode={applicationCode}
			editorState={editorState}
			signerRole={signerRole.toLowerCase() as SignatureRole}
			signerName={resolvedName}
			signatureStatuses={signatureStatuses}
			onSign={handleSign}
			isSigning={isSigning}
		/>
	)
}
