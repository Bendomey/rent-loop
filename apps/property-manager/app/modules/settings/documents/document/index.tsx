import { type SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData } from 'react-router'

import { Editor } from '~/components/blocks/template-editor/editor'
import type { loader } from '~/routes/_auth.settings.documents.$documentId._index'

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
	const { document } = useLoaderData<typeof loader>()
	const [editorState, setEditorState] = useState<SerializedEditorState>(
		document?.content ? JSON.parse(document.content) : initialValue,
	)
	if (!document) return null

	return (
		<Editor
			document={document}
			editorSerializedState={editorState}
			onSerializedChange={(value) => setEditorState(value)}
		/>
	)
}
