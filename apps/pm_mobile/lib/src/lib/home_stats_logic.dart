import 'dart:math' as math;

import 'package:rentloop_manager/src/lib/property_stats_logic.dart'
    show parseCubeNum;

/// The Home screen's headline numbers. Money is integer pesewas.
class HomeStats {
  const HomeStats({
    this.collectedThisMonth = 0,
    this.stillToCollect = 0,
    this.late = 0,
    this.emptyUnits = 0,
    this.totalUnits = 0,
    this.clientId,
  });

  final int collectedThisMonth;
  final int stillToCollect;
  final int late;
  final int emptyUnits;
  final int totalUnits;
  final String? clientId;
}

/// Combines the rows of three separate Cube `/load` results (Payments,
/// Charges, Units — no join path between them). Charges arrive one row per
/// financial account so one tenant's credit never offsets another's debt;
/// only positive balances count. Empty lists and missing values read as 0.
HomeStats computeHomeStats({
  required List<Map<String, dynamic>> paymentRows,
  required List<Map<String, dynamic>> chargeRows,
  required List<Map<String, dynamic>> unitRows,
  String? clientId,
}) {
  final payment = paymentRows.isNotEmpty ? paymentRows.first : const {};
  final unit = unitRows.isNotEmpty ? unitRows.first : const {};

  var stillToCollect = 0;
  var late = 0;
  for (final row in chargeRows) {
    final owed = math.max(parseCubeNum(row['Charges.outstandingAmount']), 0);
    final arrears = math.max(parseCubeNum(row['Charges.arrearsAmount']), 0);
    stillToCollect += owed;
    late += math.min(arrears, owed);
  }

  return HomeStats(
    collectedThisMonth: parseCubeNum(payment['Payments.totalAmount']),
    stillToCollect: stillToCollect,
    late: late,
    emptyUnits: parseCubeNum(unit['Units.availableCount']),
    totalUnits: parseCubeNum(unit['Units.count']),
    clientId: clientId,
  );
}
