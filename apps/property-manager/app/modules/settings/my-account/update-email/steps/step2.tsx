import { useUpdateClientEmailContext } from '../context'
import { Button } from '~/components/ui/button'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'

export function Step2() {
	const { goToPage, closeModal } = useUpdateClientEmailContext()

	return (
		<div className="p-8 text-center">
			<TypographyH3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
				Success
			</TypographyH3>
			<TypographyMuted className="dark:text-zinc-400">
				Your email has been updated successfully.
			</TypographyMuted>
			<div className="mt-6">
				<Button
					onClick={() => {
						closeModal()
						goToPage(0)
					}}
					size="lg"
				>
					Close
				</Button>
			</div>
		</div>
	)
}
