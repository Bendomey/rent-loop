import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement } from '@lexical/utils'
import {
	$createParagraphNode,
	$insertNodes,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	type LexicalCommand,
} from 'lexical'
import { type JSX, useEffect, useState } from 'react'

import {
	$createSignatureNode,
	SIGNATURE_ROLE_LABELS,
	SignatureNode,
	type SignaturePayload,
	type SignatureRole,
} from '~/components/editor/nodes/signature-node'
import { Button } from '~/components/ui/button'
import { DialogFooter } from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'

export type InsertSignaturePayload = Readonly<SignaturePayload>

export const INSERT_SIGNATURE_COMMAND: LexicalCommand<InsertSignaturePayload> =
	createCommand('INSERT_SIGNATURE_COMMAND')

export function InsertSignatureDialog({
	activeEditor,
	onClose,
}: {
	activeEditor: { dispatchCommand: (cmd: LexicalCommand<InsertSignaturePayload>, payload: InsertSignaturePayload) => boolean }
	onClose: () => void
}): JSX.Element {
	const [role, setRole] = useState<SignatureRole | ''>('')

	const handleInsert = () => {
		if (!role) return
		activeEditor.dispatchCommand(INSERT_SIGNATURE_COMMAND, { role })
		onClose()
	}

	return (
		<div className="grid gap-4 py-4">
			<div className="grid gap-2">
				<Label>Signer Role</Label>
				<Select
					value={role}
					onValueChange={(v) => setRole(v as SignatureRole)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select who will sign here" />
					</SelectTrigger>
					<SelectContent>
						{(
							Object.entries(SIGNATURE_ROLE_LABELS) as Array<
								[SignatureRole, string]
							>
						).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<DialogFooter>
				<Button
					type="submit"
					disabled={!role}
					onClick={handleInsert}
				>
					Insert Signature Block
				</Button>
			</DialogFooter>
		</div>
	)
}

export function SignaturePlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		if (!editor.hasNodes([SignatureNode])) {
			throw new Error(
				'SignaturePlugin: SignatureNode not registered on editor',
			)
		}

		return editor.registerCommand<InsertSignaturePayload>(
			INSERT_SIGNATURE_COMMAND,
			(payload) => {
				const signatureNode = $createSignatureNode(payload)
				$insertNodes([signatureNode])
				if ($isRootOrShadowRoot(signatureNode.getParentOrThrow())) {
					$wrapNodeInElement(
						signatureNode,
						$createParagraphNode,
					).selectEnd()
				}
				return true
			},
			COMMAND_PRIORITY_EDITOR,
		)
	}, [editor])

	return null
}
