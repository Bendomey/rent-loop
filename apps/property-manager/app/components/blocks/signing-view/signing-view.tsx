import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import {
	type InitialConfigType,
	LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import type { SerializedEditorState } from 'lexical'

import { SigningProvider } from './signing-context'
import { SigningHeader } from './signing-header'
import { nodes } from '~/components/blocks/template-editor/nodes'
import { ContentEditable } from '~/components/editor/editor-ui/content-editable'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import { CodeHighlightPlugin } from '~/components/editor/plugins/code-highlight-plugin'
import { editorTheme } from '~/components/editor/themes/editor-theme'

interface SignatureStatus {
	role: SignatureRole
	signed: boolean
}

interface SigningViewProps {
	documentTitle: string
	applicationCode: string
	editorState: SerializedEditorState
	signerRole: SignatureRole
	signerName: string
	signatureStatuses: SignatureStatus[]
	onSign: (role: SignatureRole, signatureDataUrl: string) => void
	isSigning: boolean
}

const signingEditorConfig: InitialConfigType = {
	namespace: 'SigningView',
	theme: editorTheme,
	nodes,
	editable: false,
	onError: (error: Error) => {
		console.error(error)
	},
}

export function SigningView({
	documentTitle,
	applicationCode,
	editorState,
	signerRole,
	signerName,
	signatureStatuses,
	onSign,
	isSigning,
}: SigningViewProps) {
	return (
		<SigningProvider
			signerRole={signerRole}
			signerName={signerName}
			onSign={onSign}
			isSigning={isSigning}
		>
			<LexicalComposer
				initialConfig={{
					...signingEditorConfig,
					editorState: JSON.stringify(editorState),
				}}
			>
				<div className="flex min-h-screen flex-col bg-zinc-100">
					<SigningHeader
						documentTitle={documentTitle}
						applicationCode={applicationCode}
						signerRole={signerRole}
						signatureStatuses={signatureStatuses}
					/>

					<div className="mx-auto w-full max-w-4xl flex-1 py-8">
						<div className="rounded-lg bg-white shadow-sm">
							<RichTextPlugin
								contentEditable={
									<ContentEditable
										placeholder=""
										className="relative block min-h-[60vh] overflow-auto px-12 py-8 focus:outline-none"
									/>
								}
								ErrorBoundary={LexicalErrorBoundary}
							/>

							<ListPlugin />
							<TablePlugin />
							<CheckListPlugin />
							<HorizontalRulePlugin />
							<ClickableLinkPlugin />
							<CodeHighlightPlugin />
						</div>
					</div>
				</div>
			</LexicalComposer>
		</SigningProvider>
	)
}
