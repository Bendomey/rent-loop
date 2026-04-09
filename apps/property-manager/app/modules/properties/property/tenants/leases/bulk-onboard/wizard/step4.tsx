import { ArrowLeft, FileText, UploadCloud } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'

interface Step4Props {
	initialUrl?: string
	onSave: (url: string) => void
	onBack: () => void
	onCancel: () => void
}

export function WizardStep4({
	initialUrl,
	onSave,
	onBack,
	onCancel,
}: Step4Props) {
	const { upload, isLoading, objectUrl, error } =
		useUploadObject('lease-agreements')
	const inputRef = useRef<HTMLInputElement>(null)

	const resolvedUrl = objectUrl ?? initialUrl

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		if (file.type !== 'application/pdf') {
			alert('Only PDF files are accepted.')
			return
		}
		await upload(file)
	}

	return (
		<div className="mx-auto mb-10 space-y-8 md:max-w-2xl">
			<div className="mt-10 space-y-2 border-b pb-6">
				<TypographyH2 className="text-2xl font-bold">
					Upload Lease Agreement
				</TypographyH2>
				<TypographyMuted>
					Upload the existing PDF lease agreement for this tenant.
				</TypographyMuted>
			</div>

			<div
				className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-10 transition-colors hover:border-rose-400 dark:border-slate-700 dark:bg-slate-900"
				onClick={() => inputRef.current?.click()}
			>
				{isLoading ? (
					<Spinner />
				) : resolvedUrl ? (
					<>
						<FileText className="mb-3 h-10 w-10 text-rose-600" />
						<p className="text-sm font-medium text-rose-600">
							PDF uploaded successfully
						</p>
						<p className="text-muted-foreground mt-1 text-xs">
							Click to replace
						</p>
					</>
				) : (
					<>
						<UploadCloud className="mb-3 h-10 w-10 text-slate-400" />
						<p className="text-sm font-medium">Click to upload PDF</p>
						<p className="text-muted-foreground mt-1 text-xs">PDF files only</p>
					</>
				)}
				<input
					ref={inputRef}
					type="file"
					accept="application/pdf"
					className="hidden"
					onChange={(e) => void handleFileChange(e)}
				/>
			</div>

			{error ? (
				<TypographySmall className="text-destructive">
					Upload failed. Please try again.
				</TypographySmall>
			) : null}

			<div className="flex items-center justify-between border-t pt-6">
				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Back to Overview
					</Button>
					<Button type="button" variant="ghost" onClick={onBack}>
						<ArrowLeft className="mr-1 h-4 w-4" /> Back
					</Button>
				</div>
				<Button
					type="button"
					disabled={!resolvedUrl || isLoading}
					className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
					onClick={() => resolvedUrl && onSave(resolvedUrl)}
				>
					Save & Back to Table
				</Button>
			</div>
		</div>
	)
}
