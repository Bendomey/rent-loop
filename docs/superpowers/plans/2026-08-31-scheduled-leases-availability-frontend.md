# Scheduled Leases and Real Availability — Property Manager Frontend Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Both date pickers read real availability from the server — every block, capacity-aware — instead of deriving it from a capped list of leases client-side.

**Architecture:** The server now returns *saturated ranges* alongside the raw blocks (backend plan Task 6). The frontend stops computing availability and starts consuming that answer: a small pure module turns ranges into the `disabled` predicate both pickers already accept, and into the term re-check the duration step needs. `use-unit-availability.ts` is deleted.

**Tech Stack:** React Router v7, React 19, TanStack Query v5, Tailwind v4, Shadcn/Radix, vitest. Pure logic lives in `app/lib/` with a sibling `.test.ts`, matching `app/lib/move-in-dates.ts`.

**Spec:** `docs/superpowers/specs/2026-08-19-scheduled-leases-availability-design.md` §5 — read it before starting.

**Depends on:** `docs/superpowers/plans/2026-08-31-scheduled-leases-availability-backend.md` Task 6 being merged. The endpoint's `data` is an object from that point on; nothing here works before it.

## Global Constraints

- **Never commit.** Per the root `CLAUDE.md`: leave every change unstaged for the user. Where the writing-plans template would end a task with a commit, this plan ends it with a verification run.
- **Comment sparingly.** Only where the code cannot carry the information. Never restate the code, never narrate the change, never label a block. This applies to test files.
- **Dark and light mode.** Every UI change must work in both. Use Tailwind `dark:` variants and the existing CSS variables (`bg-background`, `text-foreground`, `text-warning`, `bg-warning-bg`); never hardcode a colour that only reads in one mode. Verify in both before calling a task done.
- **Never set default query params inside hooks.** Callers own their own params.
- Commands, from `apps/property-manager/`: `yarn test`, `yarn types:check`, `yarn lint`, `yarn dev`.
- Saturation is an **additional** constraint on the pickers, never a looser one. Both keep their existing floors — a renewal still cannot start before its parent ends.
- **Fail open.** If availability fails to load, disable nothing and show the reason. Failing closed stops a PM from working; the server guard is the backstop either way.

---

## File Structure

**Created:**
- `apps/property-manager/app/lib/availability.ts` — pure. Parses the endpoint's ranges, answers "is this day disabled" and "does this term clear". No React, no fetching.
- `apps/property-manager/app/lib/availability.test.ts` — the six states from spec §5.

**Modified:**
- `apps/property-manager/types/booking.d.ts` — `SaturatedRange`, `UnitAvailability`, `slots_occupied` on `UnitDateBlock`.
- `apps/property-manager/app/api/bookings/index.ts:107-150` — the response shape and the `exclude_lease_id` option.
- `apps/property-manager/app/modules/properties/property/occupancy/bookings/new/components/booking-range-calendar.tsx:69` — reads `.blocks`.
- `apps/property-manager/app/modules/properties/property/occupancy/availability/index.tsx:135` — reads `.blocks`.
- `apps/property-manager/app/modules/properties/property/assets/units/unit/details/components/index.tsx:131` — reads `.blocks`.
- `apps/property-manager/app/modules/properties/property/occupancy/applications/application/move-in/index.tsx` — consumes the endpoint.
- `apps/property-manager/app/modules/properties/property/occupancy/applications/application/move-in/ask-date.tsx` — disabled predicate.
- `apps/property-manager/app/modules/properties/property/occupancy/applications/application/move-in/ask-duration.tsx` — term re-check.
- `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/renewal/index.tsx:442-447` — disabled predicate and term re-check.

**Deleted:**
- `apps/property-manager/app/modules/properties/property/occupancy/applications/application/move-in/use-unit-availability.ts`

---

## Task 1: The API layer follows the new shape

The endpoint's `data` is now `{ blocks, saturated_ranges }`. Three existing call sites read it as an array and break until they are updated; they are updated here, in the same task, because none of them can be reviewed independently of the shape change.

**Files:**
- Modify: `apps/property-manager/types/booking.d.ts:91-102`
- Modify: `apps/property-manager/app/api/bookings/index.ts:107-150`
- Modify: `apps/property-manager/app/modules/properties/property/occupancy/bookings/new/components/booking-range-calendar.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/occupancy/availability/index.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/assets/units/unit/details/components/index.tsx`

**Interfaces:**
- Produces: the global types `SaturatedRange` and `UnitAvailability`; `useGetUnitAvailability(clientId, propertyId, unitId, from, to, excludeLeaseId?)` returning `UnitAvailability`. Tasks 3 and 4 call exactly this.

- [ ] **Step 1: Add the types**

In `apps/property-manager/types/booking.d.ts`, add `slots_occupied` to `UnitDateBlock` and the two new interfaces beneath it:

```ts
interface UnitDateBlock {
	id: string
	unit_id: string
	start_date: Date
	end_date: Date
	block_type: BlockType
	slots_occupied: Nullable<number>
	booking_id: Nullable<string>
	lease_id: Nullable<string>
	reason: string
	created_at: Date
}

/** A span where the unit is at capacity. Half-open: `[start_date, end_date)`. */
interface SaturatedRange {
	start_date: string
	end_date: string
}

interface UnitAvailability {
	blocks: UnitDateBlock[]
	saturated_ranges: SaturatedRange[]
}
```

- [ ] **Step 2: Update the fetcher**

In `apps/property-manager/app/api/bookings/index.ts`, replace `getUnitAvailability` and `useGetUnitAvailability`:

```ts
const getUnitAvailability = async (
	clientId: string,
	propertyId: string,
	unitId: string,
	from: Date,
	to: Date,
	excludeLeaseId?: string,
) => {
	try {
		const params = new URLSearchParams({
			from: from.toISOString(),
			to: to.toISOString(),
		})
		if (excludeLeaseId) params.set('exclude_lease_id', excludeLeaseId)

		const response = await fetchClient<ApiResponse<UnitAvailability>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/units/${unitId}/availability?${params.toString()}`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetUnitAvailability = (
	clientId: string,
	propertyId: string,
	unitId: string,
	from: Date,
	to: Date,
	excludeLeaseId?: string,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.DATE_BLOCKS,
			clientId,
			propertyId,
			unitId,
			from.toISOString(),
			to.toISOString(),
			excludeLeaseId ?? null,
		],
		queryFn: () =>
			getUnitAvailability(clientId, propertyId, unitId, from, to, excludeLeaseId),
		enabled: !!clientId && !!propertyId && !!unitId,
	})
```

`excludeLeaseId` is part of the query key — without it a renewal and a plain view of the same unit would share a cache entry and show each other's answer.

- [ ] **Step 3: Update the three block-reading call sites**

Each currently destructures the query's `data` as the block array. Each now reads `data?.blocks`.

In `booking-range-calendar.tsx:69`:

```ts
	const { data: availability, isPending } = useGetUnitAvailability(
		clientId,
		propertyId,
		unitId,
		today,
		ninetyDaysOut,
	)
	const blocks = availability?.blocks ?? []
```

Then replace the component's remaining uses of the old `blocks` variable with this one. Read the file and follow its existing naming — if it already calls the result `blocks`, rename the query result to `availability` as above rather than shadowing.

Apply the same change in `occupancy/availability/index.tsx:135` and `assets/units/unit/details/components/index.tsx:131`, keeping each file's existing `isPending` handling intact.

- [ ] **Step 4: Verify the types compile**

Run: `cd apps/property-manager && yarn types:check`
Expected: no errors. A remaining error of the form "Property 'map' does not exist on type 'UnitAvailability'" means a fourth call site exists — find it with `grep -rn "useGetUnitAvailability" app` and fix it the same way.

- [ ] **Step 5: Verify the three screens still render**

Run: `cd apps/property-manager && yarn dev`

Check the unit details availability card, the occupancy availability page, and the new-booking range calendar. Each should show exactly the blocks it showed before.

Expected: unchanged behaviour on all three, in both dark and light mode.

- [ ] **Step 6: Verify**

Run: `cd apps/property-manager && yarn lint && yarn types:check`
Expected: clean. Leave changes unstaged.

---

## Task 2: The availability module

Pure, tested, and the single place the ranges are interpreted. Both pickers call it.

**Files:**
- Create: `apps/property-manager/app/lib/availability.ts`
- Test: `apps/property-manager/app/lib/availability.test.ts`

**Interfaces:**
- Consumes: the `SaturatedRange` type from Task 1.
- Produces:
  - `dayIsSaturated(day: Date, ranges: SaturatedRange[]): boolean`
  - `termIsSaturated(start: Date, end: Date, ranges: SaturatedRange[]): boolean`
  - `firstFreeDay(from: Date, ranges: SaturatedRange[]): Date`
  Tasks 3 and 4 call exactly these.

- [ ] **Step 1: Write the failing tests**

Create `apps/property-manager/app/lib/availability.test.ts`:

```ts
import { expect, test } from 'vitest'
import { dayIsSaturated, firstFreeDay, termIsSaturated } from './availability'

const day = (d: number) => new Date(Date.UTC(2026, 8, d))
const range = (from: number, to: number) => ({
	start_date: `2026-09-${String(from).padStart(2, '0')}`,
	end_date: `2026-09-${String(to).padStart(2, '0')}`,
})

test('a free room disables nothing', () => {
	expect(dayIsSaturated(day(5), [])).toBe(false)
})

test('a day inside a saturated span is disabled', () => {
	expect(dayIsSaturated(day(5), [range(1, 10)])).toBe(true)
})

// Half-open, matching the server. A term may begin on the day another ends,
// which is what every back-to-back renewal does.
test('the day a span ends is free', () => {
	expect(dayIsSaturated(day(10), [range(1, 10)])).toBe(false)
})

test('the day a span starts is taken', () => {
	expect(dayIsSaturated(day(1), [range(1, 10)])).toBe(true)
})

// A room with a hole in the middle — a short booking between two free spans.
// The old hook could not represent this at all.
test('days either side of a hole stay selectable', () => {
	const ranges = [range(10, 14)]
	expect(dayIsSaturated(day(5), ranges)).toBe(false)
	expect(dayIsSaturated(day(12), ranges)).toBe(true)
	expect(dayIsSaturated(day(20), ranges)).toBe(false)
})

// The picker only disables starts. A start that is free can still produce a
// term that runs into a saturated span, and the duration step must catch it.
test('a term running into a span is refused even from a free start', () => {
	expect(termIsSaturated(day(1), day(20), [range(10, 14)])).toBe(true)
})

test('a term that clears every span passes', () => {
	expect(termIsSaturated(day(1), day(9), [range(10, 14)])).toBe(false)
})

test('a term ending exactly where a span starts passes', () => {
	expect(termIsSaturated(day(1), day(10), [range(10, 14)])).toBe(false)
})

test('the first free day is the floor when nothing blocks it', () => {
	expect(firstFreeDay(day(1), []).getTime()).toBe(day(1).getTime())
})

test('the first free day skips past a span covering the floor', () => {
	expect(firstFreeDay(day(1), [range(1, 10)]).getTime()).toBe(day(10).getTime())
})

test('the first free day skips consecutive spans', () => {
	const ranges = [range(1, 10), range(10, 15)]
	expect(firstFreeDay(day(1), ranges).getTime()).toBe(day(15).getTime())
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/property-manager && yarn test availability`
Expected: FAIL — cannot resolve `./availability`.

- [ ] **Step 3: Write the module**

Create `apps/property-manager/app/lib/availability.ts`:

```ts
/**
 * What the server says about a unit's free days.
 *
 * A saturated range is a span where the blocks covering each day reach the
 * unit's capacity — which is not the same as "a block exists". A shared room
 * below capacity has blocks and no saturated ranges, and none of its days are
 * disabled.
 */

/*
 * Compared by calendar day, not by instant. The API sends UTC dates while the
 * calendar hands back local ones, so a raw comparison can disable the boundary
 * day itself — the one day back-to-back terms need.
 */
const dayKey = (value: Date) =>
	Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())

const localDayKey = (value: Date) =>
	Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())

const parse = (value: string) => new Date(`${value}T00:00:00Z`)

export function dayIsSaturated(day: Date, ranges: SaturatedRange[]): boolean {
	const at = localDayKey(day)
	return ranges.some(
		(range) =>
			at >= dayKey(parse(range.start_date)) &&
			at < dayKey(parse(range.end_date)),
	)
}

export function termIsSaturated(
	start: Date,
	end: Date,
	ranges: SaturatedRange[],
): boolean {
	const from = localDayKey(start)
	const to = localDayKey(end)
	return ranges.some(
		(range) =>
			dayKey(parse(range.start_date)) < to &&
			dayKey(parse(range.end_date)) > from,
	)
}

/** The earliest day at or after `from` that no range covers. */
export function firstFreeDay(from: Date, ranges: SaturatedRange[]): Date {
	let candidate = from
	let moved = true

	while (moved) {
		moved = false
		for (const range of ranges) {
			if (dayIsSaturated(candidate, [range])) {
				candidate = parse(range.end_date)
				moved = true
			}
		}
	}

	return candidate
}
```

`firstFreeDay` loops until nothing moves rather than sorting, because ranges arrive in boundary order but consecutive spans may still chain — a term ending exactly where the next begins moves the candidate twice.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/property-manager && yarn test availability`
Expected: PASS — all eleven tests.

- [ ] **Step 5: Verify**

Run: `cd apps/property-manager && yarn lint && yarn types:check`
Expected: clean. Leave changes unstaged.

---

## Task 3: The move-in step reads real availability

Spec §5. This replaces `use-unit-availability.ts`, which sees only leases, is capped at `per: 20`, and returns one date rather than a shape.

**Files:**
- Modify: `.../occupancy/applications/application/move-in/index.tsx:84-91`
- Modify: `.../occupancy/applications/application/move-in/ask-date.tsx`
- Modify: `.../occupancy/applications/application/move-in/ask-duration.tsx`
- Delete: `.../occupancy/applications/application/move-in/use-unit-availability.ts`

(All paths under `apps/property-manager/app/modules/properties/property/`.)

**Interfaces:**
- Consumes: `useGetUnitAvailability` (Task 1); `dayIsSaturated`, `termIsSaturated`, `firstFreeDay` (Task 2).

- [ ] **Step 1: Swap the hook for the endpoint**

In `move-in/index.tsx`, delete the `useUnitAvailability` import and its call (the block commented `M3`), and replace with:

```ts
	const today = new Date()
	const twoYearsOut = new Date(today)
	twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2)

	const {
		data: availability,
		isPending: availabilityPending,
		isError: availabilityFailed,
	} = useGetUnitAvailability(
		clientId,
		propertyId,
		safeString(unit?.id),
		today,
		twoYearsOut,
	)

	// Fail open: a picker that disables everything because a request failed
	// stops a PM working, and the server refuses the term either way.
	const ranges = availability?.saturated_ranges ?? []
	const freeFrom = ranges.length > 0 ? firstFreeDay(today, ranges) : null
	const clashes = Boolean(date && dayIsSaturated(date, ranges))
```

The application's own lease is excluded by the endpoint only if it names one; a not-yet-approved application has no lease and no block, so nothing self-blocks here. Remove the `applicationId` argument that existed purely for that purpose.

`occupant` no longer exists — the endpoint returns dates, not tenants. Task 3 Step 3 removes its use from the copy.

- [ ] **Step 2: Pass the ranges down**

Still in `move-in/index.tsx`, extend the `<AskDate />` props with the ranges and the load state, keeping `freeFrom` for the existing quick-pick and copy:

```tsx
			<AskDate
				value={date}
				onChange={setDate}
				freeFrom={freeFrom}
				ranges={ranges}
				availabilityFailed={availabilityFailed}
				availabilityPending={availabilityPending}
				blocked={clashes}
				readonly={readonly}
				applicantName={applicantName}
				pronouns={pronouns}
			/>
```

Read the existing JSX before editing and keep every prop it already passes that is still meaningful; drop only `occupant`.

- [ ] **Step 3: Disable the saturated days**

In `ask-date.tsx`, replace the `occupant` prop with the new ones and wire the picker:

```tsx
export function AskDate({
	value,
	onChange,
	freeFrom,
	ranges,
	availabilityFailed,
	availabilityPending,
	blocked,
	readonly,
	applicantName,
	pronouns,
}: {
	value: Nullable<Date>
	onChange: (next: Nullable<Date>) => void
	freeFrom: Nullable<Date>
	ranges: SaturatedRange[]
	availabilityFailed: boolean
	availabilityPending: boolean
	blocked: boolean
	readonly: boolean
	applicantName: string
	pronouns: Pronouns
}) {
```

and on the `DatePickerInput`:

```tsx
					<DatePickerInput
						value={value ?? undefined}
						placeholder="Pick a date"
						readOnly={readonly || availabilityPending}
						disabled={(day) => dayIsSaturated(day, ranges)}
						onChange={(next) => onChange(next ?? null)}
					/>
```

Import `dayIsSaturated` from `~/lib/availability`.

`quickDates({ today: new Date(), freeFrom, occupant })` loses its occupant — pass `occupant: null` or drop the argument, whichever `quickDates` accepts; read `app/lib/move-in-dates.ts` first. The copy that named the sitting tenant becomes the date alone:

```tsx
					<>
						The application doesn&rsquo;t come with a date — agree one with{' '}
						{applicantName} and set it here.{' '}
						<b className="text-foreground">
							This unit is taken until {formatDay(freeFrom)}
						</b>
						, so {pronouns.subject} cannot start before{' '}
						{firstFree ? formatDay(firstFree) : 'then'}.
					</>
```

Apply the same substitution in the `blocked` alert lower in the file — it names `occupant ?? 'The sitting tenant'` and must now say the unit is full, because a booking or a maintenance block can be the cause and neither has a tenant.

- [ ] **Step 4: Say when availability could not be loaded**

Still in `ask-date.tsx`, above the existing `blocked` alert:

```tsx
			{availabilityFailed ? (
				<Alert className="bg-warning-bg mt-4 border-transparent">
					<TriangleAlert className="text-warning size-4" />
					<AlertTitle className="text-warning">
						Couldn&rsquo;t check what this unit already has booked
					</AlertTitle>
					<AlertDescription>
						Every date is selectable, but a clash will be refused when the
						tenancy is approved.
					</AlertDescription>
				</Alert>
			) : null}
```

`bg-warning-bg` and `text-warning` are the existing theme variables and carry both modes.

- [ ] **Step 5: Re-check the whole term at the duration step**

The picker only disables starts. In `move-in/index.tsx`, alongside the existing `end` computation:

```ts
	const termClashes = Boolean(date && end && termIsSaturated(date, end, ranges))
```

Pass `termClashes` into `<AskDuration />` and render a warning there, at the point the duration is chosen rather than at submission. In `ask-duration.tsx`, add the prop and:

```tsx
			{termClashes ? (
				<Alert className="bg-warning-bg mt-4 border-transparent">
					<TriangleAlert className="text-warning size-4" />
					<AlertTitle className="text-warning">
						The unit fills up partway through this term
					</AlertTitle>
					<AlertDescription>
						The start date is free but a later part of the term is not. Shorten
						the stay or pick a later start.
					</AlertDescription>
				</Alert>
			) : null}
```

Import `Alert`, `AlertTitle`, `AlertDescription` and `TriangleAlert` if that file does not already have them.

- [ ] **Step 6: Delete the old hook**

Run: `cd apps/property-manager && rm app/modules/properties/property/occupancy/applications/application/move-in/use-unit-availability.ts`

Then confirm nothing still imports it:

Run: `grep -rn "useUnitAvailability" app`
Expected: no matches.

- [ ] **Step 7: Verify the states**

Run: `cd apps/property-manager && yarn dev`, and walk the move-in step for each:

- a free unit — nothing disabled, and the step looks exactly as it did before
- a unit with a sitting tenant — days before the free date disabled, quick-pick offers the first workable day
- a shared unit below capacity — blocks exist, **nothing disabled** (this is the case the old hook got wrong)
- a shared unit where a booking and a lease together fill it — that span disabled, the rest selectable
- a free start whose term runs into a full span — start selectable, duration step warns
- availability still loading — picker not openable, no crash
- availability failed — everything selectable, warning shown

Expected: all seven, in both dark and light mode.

- [ ] **Step 8: Verify**

Run: `cd apps/property-manager && yarn test && yarn lint && yarn types:check`
Expected: clean. Leave changes unstaged.

---

## Task 4: The renewal picker

Spec §5. A renewal keeps its floor at the parent's end and gains saturation on top — and must not see its own chain as an obstacle.

**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/renewal/index.tsx:155-175`, `:442-447`

**Interfaces:**
- Consumes: `useGetUnitAvailability` with `excludeLeaseId` (Task 1); `dayIsSaturated`, `termIsSaturated` (Task 2).

- [ ] **Step 1: Fetch availability for the renewal's unit**

In `renewal/index.tsx`, near the existing `earliestStart` / `dayKey` block, add:

```ts
	const {
		data: availability,
		isPending: availabilityPending,
		isError: availabilityFailed,
	} = useGetUnitAvailability(
		clientId,
		propertyId,
		unitId,
		earliestStart,
		latestStart,
		leaseId,
	)

	const ranges = availability?.saturated_ranges ?? []
```

`leaseId` is the parent lease being renewed — the endpoint excludes its whole chain, so neither the parent's own term nor an earlier renewal in the same room counts against this one. Use the identifiers the file already has in scope for `clientId`, `propertyId` and `unitId`; read the surrounding code rather than inventing names.

The window is `earliestStart` to `latestStart`, which the file already computes as the parent's end and five years on — the same span the picker can reach.

- [ ] **Step 2: Add saturation to the existing floor**

At `:447`, the predicate today is the floor alone. It becomes the floor **and** saturation — an additional constraint, never a looser one:

```tsx
										<DatePickerInput
											value={date ?? undefined}
											onChange={(next) => setDate(next ?? null)}
											startMonth={earliestStart}
											endMonth={latestStart}
											readOnly={availabilityPending}
											disabled={(day) =>
												dayKey(day) < dayKey(earliestStart) ||
												dayIsSaturated(day, ranges)
											}
										/>
```

Keep every prop the element already has; only `readOnly` and the second clause of `disabled` are new. Import `dayIsSaturated` and `termIsSaturated` from `~/lib/availability`.

- [ ] **Step 3: Re-check the renewal's term**

The renewal step chooses a duration after a start. Compute the end with the helper the file already uses for it, then:

```ts
	const termClashes = Boolean(
		date && renewalEnd && termIsSaturated(date, renewalEnd, ranges),
	)
```

Read the file to find what it already calls the computed end — it derives one for the summary — and reuse that rather than adding a second derivation. Render a warning beside the duration control, in the same shape as Task 3 Step 5, and include `termClashes` in whatever gates the step's "Next" button so a known-bad term cannot be carried forward.

- [ ] **Step 4: Say when availability could not be loaded**

Add the same fail-open notice as Task 3 Step 4, worded for this step:

```tsx
			{availabilityFailed ? (
				<Alert className="bg-warning-bg mt-4 border-transparent">
					<TriangleAlert className="text-warning size-4" />
					<AlertTitle className="text-warning">
						Couldn&rsquo;t check what this room already has booked
					</AlertTitle>
					<AlertDescription>
						Every date is selectable, but a clash will be refused when the
						renewal is created.
					</AlertDescription>
				</Alert>
			) : null}
```

- [ ] **Step 5: Verify the states**

Run: `cd apps/property-manager && yarn dev`, and renew a lease for each:

- straight after the parent — the parent's move-out day is selectable, which is the common answer and the one the chain exclusion exists to protect
- a chain of three terms in one room — renewing the third must not be blocked by the second
- a renewal into a room with a booking later in the year — that span disabled
- a renewal into a shared room below capacity — nothing disabled
- a free start whose term runs into a full span — warned at the duration step, "Next" blocked
- availability failed — everything selectable, warning shown

Expected: all six, in both dark and light mode.

- [ ] **Step 6: Verify**

Run: `cd apps/property-manager && yarn test && yarn lint && yarn types:check`
Expected: clean. Leave every change unstaged for the user to commit.

---

## What this plan does not do

Spec §Scope and §7, restated so a reviewer does not read them as gaps:

- **No calendar UI.** Blocks become correct and readable; nothing here shows a PM the whole picture of a room's year.
- **No per-bed block form.** `slots_occupied` exists on the API from the backend plan's Task 1, and the date-block form does not offer it. Manual blocks stay absolute.
- **No change to the booking flow's own writes.** The booking calendar keeps reading raw blocks.
- **No multi-unit or property-level availability.**
