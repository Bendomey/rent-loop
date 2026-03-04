declare module 'html2pdf.js' {
	interface Html2PdfWorker {
		set(options: Record<string, unknown>): Html2PdfWorker
		from(element: Element | string | null): Html2PdfWorker
		outputPdf(type: 'blob'): Promise<Blob>
		outputPdf(type: 'datauristring'): Promise<string>
		save(): Promise<void>
	}

	export default function html2pdf(): Html2PdfWorker
}
