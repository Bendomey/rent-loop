import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import type { NodeKey } from 'lexical'
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
} from 'lexical'
import { Clock, Pen } from 'lucide-react'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'

import { useSigningContext } from '~/components/blocks/signing-view/signing-context'
import {
	$isSignatureNode,
	type SignatureRole,
} from '~/components/editor/nodes/signature-node'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { SignaturePad } from '~/components/ui/signature-pad'

interface SignatureComponentProps {
	role: SignatureRole
	label: string
	signatureUrl: string | null
	signedByName: string | null
	signedAt: string | null
	nodeKey: NodeKey
}

export default function SignatureComponent({
	role,
	label,
	signatureUrl,
	signedByName,
	signedAt,
	nodeKey,
}: SignatureComponentProps): JSX.Element {
	const [editor] = useLexicalComposerContext()
	const isEditable = useLexicalEditable()
	const signingContext = useSigningContext()
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey)
	const [showSignModal, setShowSignModal] = useState(false)
	const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
	const [hasDrawnSignature, setHasDrawnSignature] = useState(false)
	const wasSigningRef = useRef(false)

	const isSigned = signatureUrl !== null
	const isSigningMode = signingContext !== null
	const isMyRole = signingContext?.signerRole === role

	const $onDelete = useCallback(
		(payload: KeyboardEvent) => {
			const selection = $getSelection()
			if (isSelected && $isNodeSelection(selection)) {
				payload.preventDefault()
				editor.update(() => {
					selection.getNodes().forEach((node) => {
						if ($isSignatureNode(node)) {
							node.remove()
						}
					})
				})
			}
			return false
		},
		[editor, isSelected],
	)

	const onClick = useCallback(
		(payload: MouseEvent) => {
			const event = payload
			const target = event.target as HTMLElement
			const signatureEl = target.closest('[data-signature-node]')
			if (!signatureEl) return false

			const key = signatureEl.getAttribute('data-signature-key')
			if (key !== nodeKey) return false

			if (event.shiftKey) {
				setSelected(!isSelected)
			} else {
				clearSelection()
				setSelected(true)
			}
			return true
		},
		[nodeKey, isSelected, setSelected, clearSelection],
	)

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				onClick,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				KEY_DELETE_COMMAND,
				$onDelete,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				$onDelete,
				COMMAND_PRIORITY_LOW,
			),
		)
	}, [editor, onClick, $onDelete])

	// Close the modal once the async signing operation completes
	useEffect(() => {
		const isSigning = signingContext?.isSigning ?? false
		if (wasSigningRef.current && !isSigning) {
			setShowSignModal(false)
			setSignatureDataUrl(null)
			setHasDrawnSignature(false)
		}
		wasSigningRef.current = isSigning
	}, [signingContext?.isSigning])

	const handleSignatureChange = useCallback(
		(hasSig: boolean, dataUrl: string | null) => {
			setHasDrawnSignature(hasSig)
			setSignatureDataUrl(dataUrl)
		},
		[],
	)

	const handleConfirmSignature = () => {
		if (!signatureDataUrl) return

		if (signingContext) {
			// In signing mode: delegate to the signing context callback.
			// Modal is closed by useEffect once isSigning transitions back to false.
			signingContext.onSign(role, signatureDataUrl)
		} else {
			// In editor mode: update the node directly and close immediately.
			editor.update(() => {
				const node = $getNodeByKey(nodeKey)
				if ($isSignatureNode(node)) {
					node.setSignature(
						signatureDataUrl,
						'Current User',
						new Date().toISOString(),
					)
				}
			})
			setShowSignModal(false)
			setSignatureDataUrl(null)
			setHasDrawnSignature(false)
		}
	}

	const isFocused = isSelected && isEditable

	// --- Signed state (same in all modes) ---
	if (isSigned) {
		return (
			<div
				data-signature-node=""
				data-signature-key={nodeKey}
				data-signature-role={role}
				className={`my-2 rounded-lg border p-4 ${
					isFocused ? 'ring-primary ring-2 ring-offset-2' : ''
				}`}
			>
				<div className="flex flex-col items-center gap-2">
					<img
						src={signatureUrl}
						alt={`${label} Signature`}
						className="max-h-20 object-contain"
						draggable={false}
					/>
					<div className="text-center text-xs text-zinc-500">
						{[
							signedByName,
							signedAt ? new Date(signedAt).toLocaleDateString() : null,
						]
							.filter(Boolean)
							.join(' — ')}
					</div>
					<div className="text-xs font-medium text-zinc-400">{label}</div>
				</div>
			</div>
		)
	}

	// --- Signing mode: current signer's role ---
	if (isSigningMode && isMyRole) {
		return (
			<>
				<div
					data-signature-node=""
					data-signature-key={nodeKey}
					data-signature-role={role}
					className="my-2 rounded-lg border-2 border-dashed border-rose-300 bg-rose-50 p-6 transition-colors"
				>
					<div className="flex flex-col items-center gap-3">
						<Pen className="size-5 text-rose-500" />
						<span className="text-sm font-medium text-rose-700">
							{label} Signature
						</span>
						<Button
							size="sm"
							className="bg-rose-600 hover:bg-rose-700"
							onClick={() => setShowSignModal(true)}
							disabled={signingContext.isSigning}
						>
							<Pen className="size-3" />
							Sign Here
						</Button>
					</div>
				</div>

				<Dialog open={showSignModal} onOpenChange={setShowSignModal}>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Sign as {label}</DialogTitle>
							<DialogDescription>
								Draw your signature in the box below to sign this document.
							</DialogDescription>
						</DialogHeader>
						<SignaturePad onSignatureChange={handleSignatureChange} />
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowSignModal(false)}>
								Cancel
							</Button>
							<Button
								disabled={!hasDrawnSignature || signingContext.isSigning}
								onClick={handleConfirmSignature}
							>
								<Pen className="size-4" />
								{signingContext.isSigning ? 'Saving...' : 'Confirm Signature'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		)
	}

	// --- Signing mode: another signer's role (greyed out) ---
	if (isSigningMode && !isMyRole) {
		return (
			<div
				data-signature-node=""
				data-signature-key={nodeKey}
				data-signature-role={role}
				className="my-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 p-6"
			>
				<div className="flex flex-col items-center gap-1.5">
					<Clock className="size-5 text-zinc-300" />
					<span className="text-sm font-medium text-zinc-400">
						{label} Signature
					</span>
					<span className="text-xs text-zinc-300">Awaiting signature</span>
				</div>
			</div>
		)
	}

	// --- Editor mode: placeholder (default) ---
	return (
		<>
			<div
				data-signature-node=""
				data-signature-key={nodeKey}
				data-signature-role={role}
				className={`my-2 cursor-pointer rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 transition-colors hover:border-zinc-400 hover:bg-zinc-100 ${
					isFocused ? 'ring-primary ring-2 ring-offset-2' : ''
				}`}
				onDoubleClick={() => {
					if (!isEditable) {
						setShowSignModal(true)
					}
				}}
			>
				<div className="flex flex-col items-center gap-1.5">
					<Pen className="size-5 text-zinc-400" />
					<span className="text-sm font-medium text-zinc-500">
						{label} Signature
					</span>
					{!isEditable && (
						<span className="text-xs text-zinc-400">Double-click to sign</span>
					)}
				</div>
			</div>

			<Dialog open={showSignModal} onOpenChange={setShowSignModal}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Sign as {label}</DialogTitle>
						<DialogDescription>
							Draw your signature in the box below to sign this document.
						</DialogDescription>
					</DialogHeader>
					<SignaturePad onSignatureChange={handleSignatureChange} />
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSignModal(false)}>
							Cancel
						</Button>
						<Button
							disabled={!hasDrawnSignature}
							onClick={handleConfirmSignature}
						>
							<Pen className="size-4" />
							Confirm Signature
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
