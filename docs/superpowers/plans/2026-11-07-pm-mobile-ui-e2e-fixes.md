# pm_mobile UI e2e Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the 25 findings from the 2026-11-07 simulator click-through, in the user's order: must-fix, then confusing, then layout and copy. Also allow move-in dates in the past.

**Source of findings:** `/private/tmp/claude-501/-Users-domeybenjamin-Kodes-personal-rent-loop/6a2a7b8d-55cd-4058-b3f0-74eade21b3b6/scratchpad/findings.md`. Screenshots are in `…/scratchpad/shots/`. Finding numbers below refer to that file.

**Spec:** `docs/superpowers/specs/2026-11-06-pm-mobile-v1-design.md`. It covers plain wording for non-tech-savvy Ghanaian landlords, "owes" meaning the account balance, and the web staying unchanged.

## Global Constraints

- **Already done, keep it:** #1, the Charges cube's dead `lease_id`, is fixed in `services/cube/model/cubes/Charges.js`.
- **No web changes:** don't change `apps/property-manager`.
- **Backend changes:**
  - Each one gets Swagger updates where handlers change, plus Go tests.
  - Each one gets an e2e case. The harness lives only in the main checkout: `/Users/domeybenjamin/Kodes/personal/rent-loop/services/main/scripts/e2e/cases/`. It is gitignored, so write new case files there directly.
  - Handlers never touch repositories directly.
  - JSON keys use snake_case.
- **pm_mobile conventions:**
  - Riverpod codegen.
  - Shimmer loaders.
  - `.valueOrNull`.
  - Comment sparingly.
  - Revert unrelated `.g.dart` and `pbxproj` churn.
- **Never commit.**
- **Tests must exercise the real failure.** For #24, test with the real autoDispose notifier rather than an override that keeps it alive. For #8, use the exact input a user types: `244551190` with the +233 prefix showing.

---

### Task 1: Phone entry (#8)

- `normalizePhone` (`apps/pm_mobile/lib/src/lib/phone.dart`) must accept a 9-digit national number, such as `244551190`, as Ghanaian. This is what users type next to the visible `+233` prefix. It must also keep accepting `0244551190`, `233244551190` and `+233244551190`.
- Check every phone field that shows the fixed `+233` prefix and confirm it validates and submits `+233XXXXXXXXX`. Grep the uses of `normalizePhone`, and the phone input widget used in `add_application.dart` and `application_edit_sheets.dart`.
- When Next fails validation on a step, scroll the first invalid field into view, using `Scrollable.ensureVisible`, and unfocus so the keyboard closes. The error must not stay hidden behind the keyboard.
- Investigate why `+233 200000011` was rejected. With the new 9-digit rule, 020 numbers must pass.
- **Tests:**
  - `normalizePhone` on all four input forms.
  - A widget test: type `244551190`, press Next, and land on step 2.
  - A widget test: an invalid phone scrolls to the error.

### Task 2: Mutation notifiers that die mid-request (#24)

- Fix `apps/pm_mobile/lib/src/modules/main/activity/add_maintenance.dart`. The screen must keep `createMaintenanceRequestNotifierProvider` alive for the life of the form, with `ref.watch` or `ref.listen` in `build`. After a successful create, it must show the toast and navigate.
- **Audit every screen** that calls `ref.read(<autoDispose mutation notifier>.notifier).something()`, awaits it, and then reads its state. For each screen, either watch or listen to the notifier in `build`, or have the mutation return its result.
  - An earlier grep listed many read-only uses. Check each one; don't assume. A notifier that is also watched by a child widget is fine.
  - List every screen you checked in the report.
- **Tests:** one regression test per fixed screen that uses the real notifier, with only the API faked, and asserts success handling (toast, navigation). It must not override the notifier with a keepAlive fake.

### Task 3: Keyboards that can't be closed (#6, iOS)

- App-wide:
  - Tapping outside a text field unfocuses it. Do this with one wrapper, for example in the `MaterialApp` builder: `GestureDetector(onTap: FocusManager.instance.primaryFocus?.unfocus, behavior: translucent)`.
  - Scrollable forms use `keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag` where it is safe.
- Numeric and phone fields on iOS (number pad, phone pad) get a "Done" bar above the keyboard. Build it as a small shared widget, `lib/src/shared/keyboard_done_bar.dart`, using `MediaQuery.viewInsets` and an overlay or Stack, or use `TextField`'s `contextMenu`/accessory if Flutter supports that. Do not add a new package without noting it in the report.
- Multi-line fields, such as the repair description, keep "return" for new lines. Tapping outside, or the Done bar, closes the keyboard.
- **Tests:** a widget test that a tap outside unfocuses, and a widget test that the Done bar appears for a number field and unfocuses it.

### Task 4: Dates (#12 and past move-in)

- **#12 (investigate, then fix):** 7 Nov move-in with 6 months gives lease end 7 May 2027, but the rent schedule is 6 charges due on the 14th, from 14 Nov to 14 Apr. Find where the due day of the 14th and the schedule come from:
  - mobile financial setup (`apps/pm_mobile/lib/src/modules/main/activity/financial/`, `lib/src/lib/financial/schedule.dart`)
  - the request it sends (`charges:prepare` or the billing plan)
  - the backend (`services/main/internal/services/financials/`)

  Compare with the web: `apps/property-manager/app/modules/properties/property/occupancy/applications/application/financial/`. Rent should be due on the move-in day each period, the first due on move-in, and the term should end at the lease end. If the web has the same behaviour, the fix must be correct for both clients, so fix the backend or the shared rule. If only mobile is wrong, fix mobile. Write the root cause in the report.
- **Past move-in (user decision):** a landlord must be able to enter a move-in date in the past, for tenants who already live there.
  - Mobile move-in pickers: remove the past-date restriction in the create flow, the Move-in setup sheet (`application_edit_sheets.dart`, which has `_datePast`), and the availability window.
  - Backend: find and relax any validation that rejects a past `desired_move_in_date`, a past lease start, or a past charge preparation. Check the tenant-application update and approve paths, and the availability check.
  - Make sure financial setup with a past move-in still works:
    - Past rent charges exist.
    - They show as owed or late correctly.
    - The prepaid flow ("Ama paid me") can settle them.
  - Do not change the web UI. The backend relaxation will simply also allow it.
  - **e2e case:** `services/main/scripts/e2e/cases/` gets a past move-in case, for example `n8-past-move-in.sh`, modelled on the existing cases. It should cover these steps:
    - create an application with a move-in 3 months ago
    - prepare charges
    - approve
    - assert that the lease starts in the past and that the past rent is outstanding

### Task 5: Money page confusion (#15, #13, #14, #11, #7)

- **#15:** the lease money page (`activity/financial/`) shows one "Ama paid me" action, not two. The first-bill banner keeps its text but loses its button. Alternatively, drop the banner when the owes card already shows the button. Pick one and keep it consistent.
- **#13:** "late" means the due date is before today, comparing local calendar dates, not midnight timestamps. Apply this in `lib/src/lib/financial/account_view.dart` `lateAmount`, and anywhere else that uses `dueDate.isBefore(now)` (grep for it). Also change the Cube `Charges.arrearsAmount` to `due_date < CURRENT_DATE`.
- **#14:** the first-bill banner copy must match the actual next send date. Derive it from the same `nextBill()` result the card uses, and never hard-code "tonight".
- **#11:** "Unit X is advertised at GH₵…" must fill the rent field. The rent box also shows the currency prefix when empty. Use one currency style everywhere: the `GH₵` symbol, not `GHS`.
- **#7:** after creating a unit, the property page's Units, Blocks and other manage-card counts must refresh. Find what the stats card invalidates and do the same for the counts.

### Task 6: Contradictions and blocked edits (#21, #22, #9, #17)

- **#21:**
  - The Rent tab summary card and empty state must not claim nothing is owed when tenants owe money. Reword them so they are clearly about bills: "Unpaid bills", "No unpaid bills right now.", and "{n} bills not paid yet".
  - Add one muted line under the summary: "Rent not billed yet isn't counted here."
  - Don't change the data source.
- **#22:**
  - Bills created during tenant setup have no `PayerLease`, so the bill row and detail say "Tenant".
  - Find what the backend puts on such invoices, for example `payer_client` or the financial account's tenant. Show the real name on the row and the detail. Any populate you add must not break the list. Earlier, `ContextTenantApplication` broke the API, so check the backend allows a new populate before adding it.
  - Hide the raw `INV-…` code on the row. On the detail page, show it only as a small "Bill number" line.
- **#9:**
  - Every field the setup checklist requires (`lib/src/lib/application_checklist.dart` `_tenantItems`) must be marked required in the create form and the edit sheets.
  - Fields the checklist doesn't require must stay optional.
  - Make the two agree. Check what the web's checklist requires (`apps/property-manager/.../application/components/checklist-*.ts`) and follow the web. If the web requires fewer fields, relax the mobile checklist to match.
- **#17:** email is optional in the Basic Information edit sheet (`application_edit_sheets.dart:722-727`). When it's filled in, it must be valid. Any disabled Save must say why, either as inline errors on the fields or as a line above the button.

### Task 7: Layout and copy (#3, #19, #23, #2, #16, #4, #5, #18, #20, #25)

- **#3:** the property detail manage-card label overflows. Keep it to one line with ellipsis or scale it down, and give all the cards the same height.
- **#19:** tall `RLSheet`s must stay below the status bar and safe area, with the keyboard open or closed. Fix this once in the shared sheet.
- **#23:** Home quick-action labels must not break mid-word. Use a shorter label ("Announce"), or allow 2 lines at word boundaries with scaleDown.
- **#2:**
  - With a search or filter active, the Properties and Tenants empty states keep the current copy.
  - With no search or filter, they show "No properties yet" / "Add your first property to get started." with an add button. For tenants: "No tenants yet" / "Add your first tenant." with an "Add tenant" button.
- **#16, #9b and Rent:**
  - Replace "Applicant" with "Tenant" in pm_mobile UI copy. Grep `'Applicant`.
  - Replace "by SELF" with "by you", or with the creator's name if the API provides it. Map the backend values; don't show raw enums.
  - Hide "INV-" codes as in Task 6.
- **#4:** the property address line must not repeat the city when the address already contains it.
- **#5:** Add Unit preselects the block when the property has exactly one.
- **#18:**
  - Show "Ghana Card" for the national ID value and drop the duplicate option.
  - Map the backend values. Check which ID type values the backend accepts, and keep sending the one the web sends for a Ghana Card.
- **#20:** the approve sheet should say "No lease document is attached. You can add one on the web."
- **#25:** the backend tenant approval SMS template must say "you're approved for Unit {unit}" without "application". Find the template in `services/main`. No e2e case is needed for a copy-only change, but update any Go test that asserts the text.

Each task: write failing tests first, then run the full `flutter test` and `flutter analyze` from `apps/pm_mobile`, with no new analyzer issues. For backend tasks, also run `go test ./...` for the touched packages from `services/main`.
