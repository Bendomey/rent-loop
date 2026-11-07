import 'dart:math' as math;

import 'package:rentloop_manager/src/lib/property_stats_logic.dart'
    show parseCubeNum;

/// How many months the Home rent chart covers, the current one included.
const homeTrendMonths = 6;

/// Every Home slice carries the workspace it was loaded for, so a reload
/// after a workspace switch can't briefly show the previous workspace's
/// numbers.
abstract class HomeSlice {
  const HomeSlice(this.clientId);
  final String? clientId;
}

class HomeMonthTotal {
  const HomeMonthTotal(this.month, this.amount);

  /// The first day of the month.
  final DateTime month;
  final int amount;
}

/// Successful payments, money in integer pesewas.
class HomePayments extends HomeSlice {
  const HomePayments({
    this.months = const [],
    this.thisMonthByProperty = const {},
    String? clientId,
  }) : super(clientId);

  /// Oldest first; the last entry is the current month.
  final List<HomeMonthTotal> months;
  final Map<String, int> thisMonthByProperty;

  int get thisMonth => months.isEmpty ? 0 : months.last.amount;
  int get lastMonth => months.length < 2 ? 0 : months[months.length - 2].amount;
}

class HomeCharges extends HomeSlice {
  const HomeCharges({
    this.stillToCollect = 0,
    this.late = 0,
    this.lateProperties = 0,
    String? clientId,
  }) : super(clientId);

  final int stillToCollect;
  final int late;
  final int lateProperties;
}

class HomeLeases extends HomeSlice {
  const HomeLeases({this.active = 0, this.expiring = 0, String? clientId})
    : super(clientId);

  final int active;
  final int expiring;
}

class HomeRepairs extends HomeSlice {
  const HomeRepairs({this.open = 0, this.urgent = 0, String? clientId})
    : super(clientId);

  final int open;
  final int urgent;
}

class HomeUnits extends HomeSlice {
  const HomeUnits({
    this.total = 0,
    this.occupied = 0,
    this.empty = 0,
    String? clientId,
  }) : super(clientId);

  final int total;
  final int occupied;
  final int empty;

  int get occupiedPercent => total == 0 ? 0 : (occupied * 100 / total).round();
}

class HomePendingTenants extends HomeSlice {
  const HomePendingTenants({this.count = 0, String? clientId})
    : super(clientId);

  final int count;
}

class HomePropertyNames extends HomeSlice {
  const HomePropertyNames({this.names = const {}, String? clientId})
    : super(clientId);

  /// Insertion order is the order the API listed them in.
  final Map<String, String> names;
}

class HomePropertyAmount {
  const HomePropertyAmount({
    required this.id,
    required this.name,
    required this.amount,
  });

  final String id;
  final String name;
  final int amount;
}

String _isoDate(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';

/// From the first day of the month [homeTrendMonths] - 1 months back to the
/// last day of [now]'s month, as Cube 'YYYY-MM-DD' bounds.
List<String> homeTrendDateRange(DateTime now) {
  final start = DateTime(now.year, now.month - (homeTrendMonths - 1), 1);
  final end = DateTime(now.year, now.month + 1, 0);
  return [_isoDate(start), _isoDate(end)];
}

/// Rows are one per (property, month). Months with no payments are filled
/// with 0 so the chart always has [homeTrendMonths] bars; rows without a
/// property still count towards the monthly totals.
HomePayments parseHomePayments(
  List<Map<String, dynamic>> rows, {
  required DateTime now,
  String? clientId,
}) {
  final months = [
    for (var i = homeTrendMonths - 1; i >= 0; i--)
      DateTime(now.year, now.month - i, 1),
  ];
  final totals = List.filled(months.length, 0);
  final byProperty = <String, int>{};

  for (final row in rows) {
    final raw = row['Payments.successfulAt.month'];
    final at = raw == null ? null : DateTime.tryParse(raw.toString());
    if (at == null) continue;
    final index = months.indexWhere(
      (m) => m.year == at.year && m.month == at.month,
    );
    if (index < 0) continue;
    final amount = parseCubeNum(row['Payments.totalAmount']);
    totals[index] += amount;
    final propertyId = row['Payments.propertyId'];
    if (index == months.length - 1 && propertyId != null) {
      final id = propertyId.toString();
      byProperty[id] = (byProperty[id] ?? 0) + amount;
    }
  }

  return HomePayments(
    months: [
      for (var i = 0; i < months.length; i++)
        HomeMonthTotal(months[i], totals[i]),
    ],
    thisMonthByProperty: byProperty,
    clientId: clientId,
  );
}

/// Charges arrive one row per financial account so one tenant's credit never
/// offsets another's debt; only positive balances count.
HomeCharges parseHomeCharges(
  List<Map<String, dynamic>> rows, {
  String? clientId,
}) {
  var stillToCollect = 0;
  var late = 0;
  final lateProperties = <String>{};
  for (final row in rows) {
    final owed = math.max(parseCubeNum(row['Charges.outstandingAmount']), 0);
    final arrears = math.max(parseCubeNum(row['Charges.arrearsAmount']), 0);
    final accountLate = math.min(arrears, owed);
    stillToCollect += owed;
    late += accountLate;
    final propertyId = row['Charges.propertyId'];
    if (accountLate > 0 && propertyId != null) {
      lateProperties.add(propertyId.toString());
    }
  }
  return HomeCharges(
    stillToCollect: stillToCollect,
    late: late,
    lateProperties: lateProperties.length,
    clientId: clientId,
  );
}

HomeLeases parseHomeLeases(
  List<Map<String, dynamic>> rows, {
  String? clientId,
}) {
  final row = rows.isNotEmpty ? rows.first : const <String, dynamic>{};
  return HomeLeases(
    active: parseCubeNum(row['Leases.activeCount']),
    expiring: parseCubeNum(row['Leases.expiringCount']),
    clientId: clientId,
  );
}

const urgentRepairPriority = 'EMERGENCY';

/// Rows are one per priority.
HomeRepairs parseHomeRepairs(
  List<Map<String, dynamic>> rows, {
  String? clientId,
}) {
  var open = 0;
  var urgent = 0;
  for (final row in rows) {
    final count =
        parseCubeNum(row['MaintenanceRequests.newCount']) +
        parseCubeNum(row['MaintenanceRequests.inProgressCount']) +
        parseCubeNum(row['MaintenanceRequests.inReviewCount']);
    open += count;
    if (row['MaintenanceRequests.priority'] == urgentRepairPriority) {
      urgent += count;
    }
  }
  return HomeRepairs(open: open, urgent: urgent, clientId: clientId);
}

HomeUnits parseHomeUnits(List<Map<String, dynamic>> rows, {String? clientId}) {
  final row = rows.isNotEmpty ? rows.first : const <String, dynamic>{};
  return HomeUnits(
    total: parseCubeNum(row['Units.count']),
    occupied: parseCubeNum(row['Units.occupiedCount']),
    empty: parseCubeNum(row['Units.availableCount']),
    clientId: clientId,
  );
}

HomePendingTenants parseHomePendingTenants(
  List<Map<String, dynamic>> rows, {
  String? clientId,
}) {
  final row = rows.isNotEmpty ? rows.first : const <String, dynamic>{};
  return HomePendingTenants(
    count: parseCubeNum(row['TenantApplications.inProgressCount']),
    clientId: clientId,
  );
}

/// Every known property with what it collected this month, highest first.
/// A property Cube reports but the name list lacks still shows, so no money
/// goes missing from the list.
List<HomePropertyAmount> rankHomeProperties({
  required Map<String, int> amounts,
  required Map<String, String> names,
}) {
  final rows = [
    for (final e in names.entries)
      HomePropertyAmount(id: e.key, name: e.value, amount: amounts[e.key] ?? 0),
    for (final e in amounts.entries)
      if (!names.containsKey(e.key))
        HomePropertyAmount(id: e.key, name: 'Other property', amount: e.value),
  ];
  final order = {for (final (i, r) in rows.indexed) r.id: i};
  rows.sort((a, b) {
    final byAmount = b.amount.compareTo(a.amount);
    return byAmount != 0 ? byAmount : order[a.id]!.compareTo(order[b.id]!);
  });
  return rows;
}

/// Whole-percent change from [previous] to [current]; null when [previous]
/// is 0, since no meaningful percentage exists.
int? percentChange(int current, int previous) {
  if (previous == 0) return null;
  return ((current - previous) * 100 / previous).round();
}

const _monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

String shortMonthName(DateTime d) => _monthNames[d.month - 1];

/// "Good morning" / "Good afternoon" / "Good evening" for [now].
String greetingFor(DateTime now) {
  if (now.hour < 12) return 'Good morning';
  if (now.hour < 17) return 'Good afternoon';
  return 'Good evening';
}
