import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical'
import { $applyNodeReplacement, DecoratorNode } from 'lexical'
import * as React from 'react'
import { type JSX, Suspense } from 'react'

const SignatureComponent = React.lazy(
	() => import('../editor-ui/signature-component'),
)

export type SignatureRole =
	| 'property_manager'
	| 'tenant'
	| 'pm_witness'
	| 'tenant_witness'

export const SIGNATURE_ROLE_LABELS: Record<SignatureRole, string> = {
	property_manager: 'Property Manager',
	tenant: 'Tenant',
	pm_witness: 'Property Manager Witness',
	tenant_witness: 'Tenant Witness',
}

export interface SignaturePayload {
	role: SignatureRole
	label?: string
	signatureUrl?: string | null
	signedByName?: string | null
	signedAt?: string | null
	key?: NodeKey
}

export type SerializedSignatureNode = Spread<
	{
		role: SignatureRole
		label: string
		signatureUrl: string | null
		signedByName: string | null
		signedAt: string | null
	},
	SerializedLexicalNode
>

function $convertSignatureElement(domNode: Node): null | DOMConversionOutput {
	const div = domNode as HTMLElement
	const role = div.getAttribute('data-signature-role') as SignatureRole | null
	if (!role) {
		return null
	}
	const node = $createSignatureNode({
		role,
		label: div.getAttribute('data-signature-label') || undefined,
		signatureUrl: div.getAttribute('data-signature-url') || null,
		signedByName: div.getAttribute('data-signed-by-name') || null,
		signedAt: div.getAttribute('data-signed-at') || null,
	})
	return { node }
}

export class SignatureNode extends DecoratorNode<JSX.Element> {
	__role: SignatureRole
	__label: string
	__signatureUrl: string | null
	__signedByName: string | null
	__signedAt: string | null

	static getType(): string {
		return 'signature'
	}

	static clone(node: SignatureNode): SignatureNode {
		return new SignatureNode(
			node.__role,
			node.__label,
			node.__signatureUrl,
			node.__signedByName,
			node.__signedAt,
			node.__key,
		)
	}

	static importJSON(serializedNode: SerializedSignatureNode): SignatureNode {
		return $createSignatureNode({
			role: serializedNode.role,
			label: serializedNode.label,
			signatureUrl: serializedNode.signatureUrl,
			signedByName: serializedNode.signedByName,
			signedAt: serializedNode.signedAt,
		})
	}

	static importDOM(): DOMConversionMap | null {
		return {
			div: (node: Node) => {
				const element = node as HTMLElement
				if (!element.hasAttribute('data-signature-role')) {
					return null
				}
				return {
					conversion: $convertSignatureElement,
					priority: 1,
				}
			},
		}
	}

	constructor(
		role: SignatureRole,
		label: string,
		signatureUrl: string | null,
		signedByName: string | null,
		signedAt: string | null,
		key?: NodeKey,
	) {
		super(key)
		this.__role = role
		this.__label = label
		this.__signatureUrl = signatureUrl
		this.__signedByName = signedByName
		this.__signedAt = signedAt
	}

	exportJSON(): SerializedSignatureNode {
		return {
			type: 'signature',
			version: 1,
			role: this.__role,
			label: this.__label,
			signatureUrl: this.__signatureUrl,
			signedByName: this.__signedByName,
			signedAt: this.__signedAt,
		}
	}

	exportDOM(): DOMExportOutput {
		const container = document.createElement('div')
		container.setAttribute('data-signature-role', this.__role)
		container.setAttribute('data-signature-label', this.__label)
		container.style.border = '1px solid #d4d4d8'
		container.style.borderRadius = '8px'
		container.style.padding = '16px'
		container.style.margin = '8px 0'
		container.style.minHeight = '80px'
		container.style.display = 'flex'
		container.style.flexDirection = 'column'
		container.style.alignItems = 'center'
		container.style.justifyContent = 'center'

		if (this.__signatureUrl) {
			container.setAttribute('data-signature-url', this.__signatureUrl)
			if (this.__signedByName) {
				container.setAttribute('data-signed-by-name', this.__signedByName)
			}
			if (this.__signedAt) {
				container.setAttribute('data-signed-at', this.__signedAt)
			}

			const img = document.createElement('img')
			img.src = this.__signatureUrl
			img.alt = `${this.__label} Signature`
			img.style.maxHeight = '80px'
			img.style.objectFit = 'contain'
			container.appendChild(img)

			const meta = document.createElement('div')
			meta.style.fontSize = '12px'
			meta.style.color = '#71717a'
			meta.style.marginTop = '8px'
			meta.style.textAlign = 'center'
			const parts: string[] = []
			if (this.__signedByName) parts.push(this.__signedByName)
			if (this.__signedAt) {
				parts.push(new Date(this.__signedAt).toLocaleDateString())
			}
			meta.textContent = parts.join(' — ')
			container.appendChild(meta)
		} else {
			container.style.borderStyle = 'dashed'
			container.style.borderWidth = '2px'
			container.style.borderColor = '#d4d4d8'
			container.style.backgroundColor = '#fafafa'

			const label = document.createElement('div')
			label.style.fontSize = '14px'
			label.style.color = '#a1a1aa'
			label.style.fontWeight = '500'
			label.textContent = `${this.__label} Signature`
			container.appendChild(label)
		}

		return { element: container }
	}

	createDOM(config: EditorConfig): HTMLElement {
		const div = document.createElement('div')
		const theme = config.theme
		const className = theme.signature
		if (className !== undefined) {
			div.className = className
		}
		return div
	}

	updateDOM(): false {
		return false
	}

	getRole(): SignatureRole {
		return this.__role
	}

	getLabel(): string {
		return this.__label
	}

	getSignatureUrl(): string | null {
		return this.__signatureUrl
	}

	getSignedByName(): string | null {
		return this.__signedByName
	}

	getSignedAt(): string | null {
		return this.__signedAt
	}

	setSignature(
		signatureUrl: string,
		signedByName: string,
		signedAt: string,
	): void {
		const writable = this.getWritable()
		writable.__signatureUrl = signatureUrl
		writable.__signedByName = signedByName
		writable.__signedAt = signedAt
	}

	clearSignature(): void {
		const writable = this.getWritable()
		writable.__signatureUrl = null
		writable.__signedByName = null
		writable.__signedAt = null
	}

	isSigned(): boolean {
		return this.__signatureUrl !== null
	}

	decorate(): JSX.Element {
		return (
			<Suspense fallback={null}>
				<SignatureComponent
					role={this.__role}
					label={this.__label}
					signatureUrl={this.__signatureUrl}
					signedByName={this.__signedByName}
					signedAt={this.__signedAt}
					nodeKey={this.getKey()}
				/>
			</Suspense>
		)
	}
}

export function $createSignatureNode({
	role,
	label,
	signatureUrl,
	signedByName,
	signedAt,
	key,
}: SignaturePayload): SignatureNode {
	const resolvedLabel = label || SIGNATURE_ROLE_LABELS[role]
	return $applyNodeReplacement(
		new SignatureNode(
			role,
			resolvedLabel,
			signatureUrl ?? null,
			signedByName ?? null,
			signedAt ?? null,
			key,
		),
	)
}

export function $isSignatureNode(
	node: LexicalNode | null | undefined,
): node is SignatureNode {
	return node instanceof SignatureNode
}
