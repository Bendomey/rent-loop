import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from 'components/ui/shadcn-io/dropzone'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'
import { TypographyMuted } from '~/components/ui/typography'

export function ImportDocumentButton() {
	const [files, setFiles] = useState<File[] | undefined>()
	const handleDrop = (files: File[]) => {
		console.log(files)
		setFiles(files)
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<Download className="size-4" />
					Import
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Import Document</DialogTitle>
					<DialogDescription>
						Upload a document to import its content.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-1">
					<Dropzone
						accept={{
							'application/pdf': ['.pdf'],
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
								['.docx'],
						}}
						maxFiles={1}
						maxSize={1024 * 1024 * 10}
						onDrop={handleDrop}
						onError={console.error}
						src={files}
						caption={
							<TypographyMuted>Supported Format: .pdf, .docx</TypographyMuted>
						}
					>
						<DropzoneEmptyState />
						<DropzoneContent />
					</Dropzone>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button disabled={!files} type="submit">
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
