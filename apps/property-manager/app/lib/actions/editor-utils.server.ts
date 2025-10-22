import { createHeadlessEditor } from '@lexical/headless'
import { $generateNodesFromDOM } from '@lexical/html'
import { JSDOM } from 'jsdom'
import { $getRoot } from 'lexical'
import { nodes } from '~/components/blocks/template-editor/nodes'
import { editorTheme } from '~/components/editor/themes/editor-theme'

/**
 * Converts an HTML string to a Lexical editor state.
 * @param htmlString - The HTML string to convert.
 * @returns Lexical editor state in JSON format.
 *
 * @example
 * const htmlString = '<p>Hello, world!</p>';
 * const lexicalState = await htmlToLexicalState(htmlString);
 */
export async function htmlToLexicalState(htmlString: string) {
	const dom = new JSDOM(htmlString)
	const document = dom.window.document

	const editor = createHeadlessEditor({
		namespace: 'HeadlessEditors',
		nodes: nodes,
		theme: editorTheme,
	})

	// Populate the editor with converted nodes
	editor.update(
		() => {
			const nodes = $generateNodesFromDOM(editor, document.body)
			const root = $getRoot()
			root.clear()
			root.append(...nodes)
		},
		{ discrete: true },
	)

	return editor.getEditorState().toJSON()
}
