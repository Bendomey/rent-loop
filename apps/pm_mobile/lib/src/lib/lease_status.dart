import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// Ported from apps/property-manager's lease-checklist.utils.ts — keep the
/// alert-visibility rules identical to web rather than reinventing them.
const Map<String, int> _kFrequencyDays = {
  'DAILY': 1,
  'WEEKLY': 7,
  'MONTHLY': 30,
  'QUARTERLY': 90,
  'BIANNUALLY': 180,
  'ANNUALLY': 365,
};

/// Note: `stay_duration_frequency` values are plural (HOURS/DAYS/MONTHS),
/// which don't match this table's singular keys (DAILY/MONTHLY/...) — falls
/// through to the 30-day default in that case. This mismatch also exists on
/// web (`getPeriodDays` there has the same quirk); ported as-is rather than
/// silently fixed, so both apps keep behaving identically.
int _periodDays(String frequency) =>
    _kFrequencyDays[frequency.toUpperCase()] ?? 30;

/// Returns a lease's move-out date, preferring the persisted value and
/// falling back to a client-side computation (mirrors the web's
/// `getLeaseEndDate` fallback for leases predating the `move_out_date`
/// field).
DateTime leaseEndDate(LeaseModel lease) {
  if (lease.moveOutDate != null) return DateTime.parse(lease.moveOutDate!);

  final moveIn = lease.moveInDate != null
      ? DateTime.parse(lease.moveInDate!)
      : DateTime.now();
  final duration = lease.stayDuration;
  final frequency = lease.stayDurationFrequency;
  if (duration == null || duration == 0 || frequency == null) {
    return DateTime(2099, 1, 1);
  }

  switch (frequency.toLowerCase()) {
    case 'hours':
    case 'hour':
      return moveIn.add(Duration(hours: duration));
    case 'days':
    case 'day':
      return moveIn.add(Duration(days: duration));
    case 'months':
    case 'month':
      return DateTime(moveIn.year, moveIn.month + duration, moveIn.day);
    default:
      return DateTime(2099, 1, 1);
  }
}

/// Whether the check-in reminder banner should be shown.
/// Shows when: no CHECK_IN checklist exists, or one exists but is still in
/// DRAFT (not yet submitted) AND we're within the first 2 payment periods
/// from move_in_date. A SUBMITTED/ACKNOWLEDGED checklist means it's already
/// handled; DISPUTED gets its own dedicated alert (not ported to mobile —
/// see lease_checklists_provider.dart).
bool shouldShowCheckInAlert(
  LeaseModel lease,
  List<LeaseChecklistModel> checklists,
) {
  LeaseChecklistModel? checkIn;
  for (final c in checklists) {
    if (c.type == 'CHECK_IN') {
      checkIn = c;
      break;
    }
  }
  if (checkIn != null && checkIn.status != 'DRAFT') return false;

  final frequency =
      lease.paymentFrequency ?? lease.stayDurationFrequency ?? 'MONTHLY';
  final periodDays = _periodDays(frequency);
  if (lease.moveInDate == null) return false;
  final windowEnd = DateTime.parse(
    lease.moveInDate!,
  ).add(Duration(days: 2 * periodDays));

  return DateTime.now().isBefore(windowEnd) ||
      DateTime.now().isAtSameMomentAs(windowEnd);
}

/// Whether a checklist's move-in/move-out report has been handed off to the
/// tenant (submitted or acknowledged), as opposed to still sitting in DRAFT.
bool isChecklistHandled(String status) =>
    status == 'SUBMITTED' || status == 'ACKNOWLEDGED';

/// Whether a checklist's items/details can still be edited — mirrors the
/// backend's own gate (`ChecklistNotEditable` on any create/update/delete
/// item call once the checklist has moved past DRAFT/DISPUTED).
bool isChecklistEditable(String status) =>
    status == 'DRAFT' || status == 'DISPUTED';

/// Whether the "lease ending soon" banner should be shown. Shows when:
/// - The lease is still Active
/// - We're within 1 payment period of the lease end date (or past it — the
///   lease hasn't been renewed yet, so it still needs attention)
bool shouldShowLeaseEndingAlert(LeaseModel lease) {
  if (lease.status != 'Lease.Status.Active') return false;

  final frequency =
      lease.paymentFrequency ?? lease.stayDurationFrequency ?? 'MONTHLY';
  final periodDays = _periodDays(frequency);
  final daysUntilEnd =
      leaseEndDate(lease).difference(DateTime.now()).inHours / 24;

  return daysUntilEnd <= periodDays;
}

String leaseChecklistTypeLabel(String type) => switch (type) {
  'CHECK_IN' => 'Move-In Report',
  'CHECK_OUT' => 'Move-Out Report',
  'ROUTINE' => 'Routine Inspection',
  _ => type,
};

String leaseChecklistStatusLabel(String status) => switch (status) {
  'DRAFT' => 'Draft',
  'SUBMITTED' => 'Submitted',
  'ACKNOWLEDGED' => 'Approved',
  'DISPUTED' => 'Rejected',
  _ => status,
};

/// Mirrors the web's `getChecklistStatusClass` badge colors exactly —
/// DISPUTED is amber there (not danger/red), despite the separate dispute
/// alert banner using a rose treatment; ported as-is for parity.
RLTone leaseChecklistStatusTone(String status) => switch (status) {
  'DRAFT' => RLTone.neutral,
  'SUBMITTED' => RLTone.info,
  'ACKNOWLEDGED' => RLTone.success,
  'DISPUTED' => RLTone.warning,
  _ => RLTone.neutral,
};

/// Checklist item statuses a manager can pick when adding/editing an item —
/// PENDING is deliberately excluded (matches web's item form): it's only
/// ever set by server-side template seeding on a fresh CHECK_IN checklist,
/// never a value the manager chooses.
const List<String> kChecklistItemStatuses = [
  'FUNCTIONAL',
  'DAMAGED',
  'NEEDS_REPAIR',
  'MISSING',
  'NOT_PRESENT',
];

String checklistItemStatusLabel(String status) => switch (status) {
  'PENDING' => 'Pending',
  'FUNCTIONAL' => 'Functional',
  'DAMAGED' => 'Damaged',
  'MISSING' => 'Missing',
  'NEEDS_REPAIR' => 'Needs Repair',
  'NOT_PRESENT' => 'Not Present',
  _ => status,
};

/// Mirrors the web's `getItemStatusClass` exactly.
RLTone checklistItemStatusTone(String status) => switch (status) {
  'FUNCTIONAL' => RLTone.success,
  'DAMAGED' => RLTone.danger,
  'MISSING' => RLTone.warning,
  'NEEDS_REPAIR' => RLTone.warning,
  'NOT_PRESENT' => RLTone.neutral,
  _ => RLTone.neutral, // PENDING
};

/// "2 months" / "1 month" — `stay_duration_frequency` values are always
/// plural (HOURS/DAYS/MONTHS) per the backend's validation, so this just
/// singularizes for a count of 1 rather than needing a full label table.
String stayDurationLabel(int duration, String frequency) {
  final lower = frequency.toLowerCase();
  final word = duration == 1 && lower.endsWith('s')
      ? lower.substring(0, lower.length - 1)
      : lower;
  return '$duration $word';
}
