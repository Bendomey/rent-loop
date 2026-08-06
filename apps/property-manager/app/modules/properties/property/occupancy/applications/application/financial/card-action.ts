/**
 * Class for a CardAction that has to survive a narrow screen.
 *
 * CardHeader switches to `grid-cols-[1fr_auto]` as soon as a CardAction is
 * present and pins the action to column two. With a long title and a button
 * like "Create these charges", the two columns together are wider than a phone
 * and the whole page scrolls sideways. This drops the action onto a row of its
 * own until there is room for it beside the title.
 */
export const STACKED_CARD_ACTION =
	'col-span-2 col-start-1 row-start-3 justify-self-start pt-1 sm:col-span-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0'

/**
 * Required on the title and the description of any card using
 * STACKED_CARD_ACTION.
 *
 * Those two are auto-placed, and they only stack because the action normally
 * occupies both cells of column two. Once the action moves out of that column
 * on a phone, the description flows into the gap and sits alongside the
 * heading instead of beneath it. Naming the column keeps them in one stack at
 * every width.
 */
export const STACKED_CARD_TEXT = 'col-start-1'
