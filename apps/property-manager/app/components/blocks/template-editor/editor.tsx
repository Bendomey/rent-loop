import {
	type InitialConfigType,
	LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { type EditorState, type SerializedEditorState } from 'lexical'

import { MenuBar } from './menu-bar'
import { nodes } from './nodes'
import { Plugins } from './plugins'
import { editorTheme } from '~/components/editor/themes/editor-theme'
import { TooltipProvider } from '~/components/ui/tooltip'

const editorConfig: InitialConfigType = {
	namespace: 'Editor',
	theme: editorTheme,
	nodes,
	onError: (error: Error) => {
		console.error(error)
	},
}

export function Editor({
	editorState,
	editorSerializedState,
	onChange,
	onSerializedChange,
}: {
	editorState?: EditorState
	editorSerializedState?: SerializedEditorState
	onChange?: (editorState: EditorState) => void
	onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
}) {
	return (
		<div className="overflow-hidden">
			<LexicalComposer
				initialConfig={{
					...editorConfig,
					...(editorState ? { editorState } : {}),
					...(editorSerializedState
						? { editorState: JSON.stringify(editorSerializedState) }
						: {}),
				}}
			>
				<TooltipProvider>
					<main>
						<MenuBar />
						<Plugins />

						<OnChangePlugin
							ignoreSelectionChange={true}
							onChange={(editorState) => {
								onChange?.(editorState)
								onSerializedChange?.(editorState.toJSON())
							}}
						/>
					</main>
				</TooltipProvider>
			</LexicalComposer>
		</div>
	)
}
