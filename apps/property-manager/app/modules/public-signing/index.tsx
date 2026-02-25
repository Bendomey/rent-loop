import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData } from 'react-router'
import { toast } from 'sonner'

import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import { SIGNATURE_ROLE_LABELS } from '~/components/editor/nodes/signature-node'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { loader } from '~/routes/sign.$token'

function DocumentExpired() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-100">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm text-center">
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
				<h1 className="text-xl font-semibold text-zinc-900">Link Unavailable</h1>
				<p className="mt-2 text-sm text-zinc-500">
					This signing link has expired or the document no longer exists. Please
					contact the sender to request a new link.
				</p>
			</div>
		</div>
	)
}

export function PublicSigningModule() {
	const { signingToken, expired } = useLoaderData<typeof loader>()

	const signerName = signingToken?.signer_name ?? null
	const [isSigning, setIsSigning] = useState(false)
	const [enteredName, setEnteredName] = useState('')
	const [nameConfirmed, setNameConfirmed] = useState(!!signerName)

	if (expired || !signingToken?.document) return <DocumentExpired />

	const document = signingToken.document
	const signerRole = signingToken.role as SignatureRole
	const applicationCode = signingToken.tenant_application?.code ?? ''

	const editorState: SerializedEditorState = document.content
		? JSON.parse(document.content)
		: null

	if (!editorState) return null

	const resolvedName = signerName || enteredName
	const signatureStatuses = getSignatureStatuses(editorState)

	const handleSign = (_role: SignatureRole, _signatureDataUrl: string) => {
		setIsSigning(true)

		// TODO: In the full implementation:
		// 1. Upload signatureDataUrl to S3
		// 2. POST to /v1/signing/:token/sign with the S3 URL
		// 3. Backend creates document_signatures record
		// 4. Backend updates the SignatureNode in the document JSON
		// 5. Backend stamps signed_at on the tenant application

		setTimeout(() => {
			toast.success('Signature captured')
			setIsSigning(false)
		}, 500)
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

	// --- Signing view ---
	return (
		<SigningView
			documentTitle={document.title}
			applicationCode={applicationCode}
			editorState={editorState}
			signerRole={signerRole}
			signerName={resolvedName}
			signatureStatuses={signatureStatuses}
			onSign={handleSign}
			isSigning={isSigning}
		/>
	)
}

/**
 * Scans the serialized Lexical state for signature nodes and returns their statuses.
 */
function getSignatureStatuses(
	state: SerializedEditorState,
): Array<{ role: SignatureRole; signed: boolean }> {
	const statuses: Array<{ role: SignatureRole; signed: boolean }> = []

	function walk(node: Record<string, unknown>) {
		if (node.type === 'signature') {
			statuses.push({
				role: node.role as SignatureRole,
				signed: node.signatureUrl !== null && node.signatureUrl !== undefined,
			})
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				walk(child as Record<string, unknown>)
			}
		}
	}

	walk(state.root as unknown as Record<string, unknown>)
	return statuses
}
