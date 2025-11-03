import { SearchInput } from '~/components/search'
import { ImportDocumentButton } from '~/modules/settings/documents/components/import-document-button'
import {
	AddDocumentButton,
	type IDocumentTemplate,
} from '~/modules/settings/documents/controller'

export const PropertyDocumentsController = ({
	documentTemplates,
	property,
}: {
	documentTemplates: Array<IDocumentTemplate>
	property: Property
}) => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search documents..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<ImportDocumentButton property={property} />
					<AddDocumentButton
						property={property}
						documentTemplates={documentTemplates}
					/>
				</div>
			</div>
		</div>
	)
}
