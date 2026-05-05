import { createHeadlessEditor } from '@lexical/headless'
import { $generateHtmlFromNodes } from '@lexical/html'

import { nodes } from '~/components/blocks/template-editor/nodes'
import { editorTheme } from '~/components/editor/themes/editor-theme'
import { blobToDataUrl } from '~/lib/utils'

const PDF_STYLES = `
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		font-family: 'Times New Roman', Georgia, serif;
		font-size: 13px;
		line-height: 1.7;
		color: #1a1a1a;
		background: #fff;
	}
	h1 { font-size: 22px; font-weight: bold; margin: 16px 0 8px; }
	h2 { font-size: 18px; font-weight: bold; margin: 14px 0 6px; }
	h3 { font-size: 16px; font-weight: bold; margin: 12px 0 6px; }
	h4 { font-size: 14px; font-weight: bold; margin: 10px 0 4px; }
	h5 { font-size: 13px; font-weight: bold; margin: 8px 0 4px; }
	p { margin: 6px 0; }
	ul, ol { margin: 6px 0; padding-left: 24px; }
	li { margin: 2px 0; }
	table { width: 100%; border-collapse: collapse; margin: 8px 0; }
	th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 12px; }
	th { background: #f5f5f5; font-weight: bold; }
	hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
	blockquote { border-left: 3px solid #ccc; padding-left: 12px; margin: 8px 0; color: #555; }
	strong, b { font-weight: bold; }
	em, i { font-style: italic; }
	u { text-decoration: underline; }
	img { max-width: 100%; height: auto; }
`

async function waitForImageLoad(img: HTMLImageElement): Promise<void> {
	if (img.complete) return

	await new Promise<void>((resolve) => {
		const onDone = () => {
			img.removeEventListener('load', onDone)
			img.removeEventListener('error', onDone)
			resolve()
		}

		img.addEventListener('load', onDone, { once: true })
		img.addEventListener('error', onDone, { once: true })
		setTimeout(onDone, 8000)
	})
}

async function prepareImagesForPdf(root: HTMLElement): Promise<void> {
	const images = Array.from(root.querySelectorAll('img'))

	await Promise.all(
		images.map(async (img) => {
			const src = img.getAttribute('src')
			if (!src) return

			img.setAttribute('crossorigin', 'anonymous')
			img.crossOrigin = 'anonymous'
			img.referrerPolicy = 'no-referrer'

			if (src.startsWith('data:') || src.startsWith('blob:')) {
				await waitForImageLoad(img)
				return
			}

			try {
				const response = await fetch(src, {
					mode: 'cors',
					credentials: 'omit',
				})
				if (response.ok) {
					const blob = await response.blob()
					const dataUrl = await blobToDataUrl(blob)
					if (dataUrl) {
						img.src = dataUrl
					}
				}
			} catch {
				// no-op; keep original URL
			}

			await waitForImageLoad(img)
		}),
	)
}

/**
 * Converts a serialized Lexical editor state (JSON string) to a PDF Blob.
 *
 * Uses html2canvas's `onclone` callback to strip all page stylesheets
 * (which contain Tailwind v4 oklch colors) from the cloned document and
 * inject clean CSS before rendering.
 */
export async function lexicalToPdf(
	serializedContent: string,
	documentTitle: string,
): Promise<Blob> {
	const editor = createHeadlessEditor({
		namespace: 'PDFGenerator',
		nodes,
		theme: editorTheme,
	})

	const parsed = JSON.parse(serializedContent)
	const editorState = editor.parseEditorState(parsed)
	editor.setEditorState(editorState)

	let html = ''
	editorState.read(() => {
		html = $generateHtmlFromNodes(editor)
	})

	// Strip Tailwind class attributes so html2canvas doesn't resolve
	// them against oklch CSS custom properties.
	html = html.replace(/\s*class="[^"]*"/g, '')

	const container = document.createElement('div')
	container.innerHTML = `
		<div style="padding: 48px 40px; max-width: 800px; margin: 0 auto;">
			${html}
		</div>
	`
	container.style.position = 'absolute'
	container.style.left = '-9999px'
	container.style.top = '0'
	container.style.width = '800px'
	document.body.appendChild(container)

	await prepareImagesForPdf(container)

	try {
		const { default: html2pdf } = await import('html2pdf.js')

		const pdfBlob: Blob = await html2pdf()
			.set({
				margin: [10, 10, 10, 10],
				filename: `${documentTitle}.pdf`,
				image: { type: 'jpeg', quality: 0.98 },
				html2canvas: {
					scale: 2,
					useCORS: true,
					imageTimeout: 20000,
					windowWidth: 800,
					onclone: (clonedDoc: Document) => {
						// Remove ALL stylesheets so Tailwind's oklch colors
						// are completely absent from the cloned document.
						clonedDoc
							.querySelectorAll('style, link[rel="stylesheet"]')
							.forEach((el) => el.remove())

						// Inject our own clean CSS with only hex/rgb values.
						const style = clonedDoc.createElement('style')
						style.textContent = PDF_STYLES
						clonedDoc.head.appendChild(style)

						clonedDoc.querySelectorAll('img').forEach((img) => {
							img.setAttribute('crossorigin', 'anonymous')
						})
					},
				},
				jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
			})
			.from(container.firstElementChild)
			.outputPdf('blob')

		return pdfBlob
	} finally {
		document.body.removeChild(container)
	}
}
