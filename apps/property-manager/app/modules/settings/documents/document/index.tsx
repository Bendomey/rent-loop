import { type SerializedEditorState } from 'lexical'
import { useState } from 'react'

import { Editor } from '~/components/blocks/template-editor/editor'

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

export function SingleDocumentModule() {
	const [editorState, setEditorState] =
		useState<SerializedEditorState>(initialValue)
	return (
		<Editor
			editorSerializedState={editorState}
			onSerializedChange={(value) => setEditorState(value)}
		/>
	)
}
