import type { SerializedEditorState } from 'lexical'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'

/**
 * Deep-clones the serialized Lexical state and stamps the matching signature node
 * with the uploaded URL, signer name, and timestamp.
 */
export function injectSignatureIntoState(
	state: SerializedEditorState,
	role: SignatureRole,
	signatureUrl: string,
	signedByName: string,
	signedAt: string,
): SerializedEditorState {
	const clone = JSON.parse(JSON.stringify(state)) as SerializedEditorState

	function walk(node: Record<string, unknown>) {
		if (node.type === 'signature' && node.role === role) {
			node.signatureUrl = signatureUrl
			node.signedByName = signedByName
			node.signedAt = signedAt
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				walk(child as Record<string, unknown>)
			}
		}
	}

	walk(clone.root as unknown as Record<string, unknown>)
	return clone
}

/**
 * Scans the serialized Lexical state for signature nodes and returns their statuses.
 */
export function getSignatureStatuses(
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
