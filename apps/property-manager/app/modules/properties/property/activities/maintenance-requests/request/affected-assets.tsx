import { Building2, ChevronDown, Home } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Card } from '~/components/ui/card'
import { TypographyMuted } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

/**
 * Rows past this point collapse behind "Show more" so a request covering a
 * dozen assets doesn't push the rest of the rail off screen.
 */
const COLLAPSE_AFTER = 6

interface AffectedAssetsProps {
	assets: Array<MaintenanceRequestAsset>
	propertyId: string
}

type AssetRow = {
	key: string
	kind: 'Block' | 'Unit'
	name: string
	/** Which block a unit sits in — context on its own row, never containment. */
	context?: string
	to: string
}

function splitAssets(
	assets: Array<MaintenanceRequestAsset>,
	propertyId: string,
): { blocks: Array<AssetRow>; units: Array<AssetRow> } {
	const blocks: Array<AssetRow> = []
	const units: Array<AssetRow> = []

	for (const asset of assets) {
		if (asset.asset_type === 'BLOCK') {
			blocks.push({
				key: asset.id,
				kind: 'Block',
				name: asset.property_block?.name ?? 'Block',
				// No block detail route exists — the blocks list is the closest thing.
				to: `/properties/${propertyId}/assets/blocks`,
			})
			continue
		}

		const blockName = asset.unit?.property_block?.name
		units.push({
			key: asset.id,
			kind: 'Unit',
			name: asset.unit?.name ?? 'Unit',
			context: blockName ? `in ${blockName}` : undefined,
			to: `/properties/${propertyId}/assets/units/${asset.unit_id}`,
		})
	}

	return { blocks, units }
}

function AssetRowItem({ row, last }: { row: AssetRow; last: boolean }) {
	const Glyph = row.kind === 'Block' ? Building2 : Home

	return (
		<Link
			to={row.to}
			className={cn(
				'flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--row-hover)]',
				!last && 'border-border/60 border-b',
			)}
		>
			<span className="bg-muted border-border flex size-8 shrink-0 items-center justify-center rounded-md border">
				<Glyph className="text-muted-foreground size-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="text-primary block truncate text-sm font-medium">
					{row.name}
				</span>
				{row.context && (
					<span className="text-muted-foreground block truncate text-xs">
						{row.context}
					</span>
				)}
			</span>
			<span className="border-border text-muted-foreground shrink-0 rounded-[4px] border px-1.5 font-mono text-[10px] font-bold tracking-[0.7px] uppercase">
				{row.kind}
			</span>
		</Link>
	)
}

/**
 * Every selected asset stands on its own. Blocks and units are listed as peers
 * under type headings — a unit is deliberately NOT drawn inside a block,
 * because selecting a block does not select its units.
 */
export function AffectedAssetsCard({
	assets,
	propertyId,
}: AffectedAssetsProps) {
	const [expanded, setExpanded] = useState(false)
	const { blocks, units } = splitAssets(assets, propertyId)
	const total = blocks.length + units.length

	if (total === 0) {
		return (
			<Card className="p-5 shadow-none">
				<div className="flex flex-col gap-3">
					<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
						Selected assets
					</p>
					<div className="border-border flex items-center gap-3 rounded-lg border border-dashed p-3">
						<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
							<Home className="text-muted-foreground size-4" />
						</span>
						<div>
							<p className="text-sm font-semibold">Whole property</p>
							<TypographyMuted className="text-xs">
								No specific block or unit was selected.
							</TypographyMuted>
						</div>
					</div>
				</div>
			</Card>
		)
	}

	const sections = [
		{ key: 'blocks', label: 'Blocks', rows: blocks },
		{ key: 'units', label: 'Units', rows: units },
	].filter((section) => section.rows.length > 0)

	// The cap spans both sections, so a request with five blocks shows one unit
	// rather than six of each.
	let budget = COLLAPSE_AFTER

	return (
		<Card className="p-5 shadow-none">
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
						Selected assets
					</p>
					<div className="flex-1" />
					<span className="bg-muted text-foreground rounded-full px-2 py-0.5 font-mono text-[11px] font-bold">
						{total}
					</span>
				</div>
				<TypographyMuted className="text-xs">
					Each was selected on its own — a block does not include its units.
				</TypographyMuted>

				<div className="flex flex-col gap-3">
					{sections.map((section) => {
						const shown = expanded
							? section.rows
							: section.rows.slice(0, Math.max(0, budget))
						budget -= shown.length
						if (shown.length === 0) return null

						return (
							<div key={section.key}>
								<div className="mb-1.5 flex items-center gap-2">
									<span className="text-muted-foreground font-mono text-[10px] font-bold tracking-[0.7px] uppercase">
										{section.label}
									</span>
									<span className="text-muted-foreground font-mono text-[10px] font-bold">
										{section.rows.length}
									</span>
								</div>
								<div className="border-border/60 overflow-hidden rounded-lg border">
									{shown.map((row, index) => (
										<AssetRowItem
											key={row.key}
											row={row}
											last={index === shown.length - 1}
										/>
									))}
								</div>
							</div>
						)
					})}
				</div>

				{total > COLLAPSE_AFTER && (
					<button
						type="button"
						onClick={() => setExpanded((value) => !value)}
						className="text-primary flex w-full cursor-pointer items-center justify-center gap-1.5 py-1 text-xs font-semibold"
					>
						{expanded ? 'Show less' : `Show ${total - COLLAPSE_AFTER} more`}
						<ChevronDown
							className={cn(
								'size-3.5 transition-transform',
								expanded && 'rotate-180',
							)}
						/>
					</button>
				)}
			</div>
		</Card>
	)
}

/**
 * Compact scope line for the request header, so the reach of a request is
 * visible without going to the rail.
 */
export function AffectedAssetsSummary({
	assets,
	propertyId,
}: AffectedAssetsProps) {
	const { blocks, units } = splitAssets(assets, propertyId)
	const total = blocks.length + units.length

	const label =
		total === 0
			? 'Whole property'
			: [
					blocks.length &&
						`${blocks.length} block${blocks.length > 1 ? 's' : ''}`,
					units.length && `${units.length} unit${units.length > 1 ? 's' : ''}`,
				]
					.filter(Boolean)
					.join(' · ')

	const names = [...blocks, ...units].map((row) => row.name)
	const head = names.slice(0, 3).join(', ')

	return (
		<div className="border-border inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-1.5">
			<Building2 className="text-muted-foreground size-4 shrink-0" />
			<span className="text-sm font-semibold">{label}</span>
			{names.length > 0 && (
				<span className="text-muted-foreground truncate text-xs">
					{head}
					{names.length > 3 ? ` +${names.length - 3}` : ''}
				</span>
			)}
		</div>
	)
}
