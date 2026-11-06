import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

const _rent = 'RENT';

DateTime _due(ChargeModel c) => DateTime.parse(c.dueDate).toUtc();

int _byDue(ChargeModel a, ChargeModel b) => _due(a).compareTo(_due(b));

bool _isLive(ChargeModel c) => c.voidedAt == null;

int _uninvoiced(ChargeModel c) => c.amount - c.invoicedAmount;

/// Past due and not paid, whether or not a bill went out for it.
int lateAmount(List<ChargeModel> charges, DateTime now) => charges
    .where(
      (c) => _isLive(c) && c.settledAmount < c.amount && _due(c).isBefore(now),
    )
    .fold<int>(0, (sum, c) => sum + (c.amount - c.settledAmount));

/// Null for a MANUAL cadence, where nothing is sent automatically. The amount
/// is the next uninvoiced rent plus every fee already due by then, since those
/// ride along on the same bill.
({int amount, DateTime sendDate})? nextBill(
  FinancialAccountDetailModel detail,
  DateTime now,
) {
  if (detail.account.rentBillingCadence == 'MANUAL') return null;

  final live = detail.charges.where(_isLive);
  final rents =
      live.where((c) => c.category == _rent && _uninvoiced(c) > 0).toList()
        ..sort(_byDue);
  if (rents.isEmpty) return null;

  final next = rents.first;
  final dueOn = _due(next);
  final fees = live.where(
    (c) => c.category != _rent && _uninvoiced(c) > 0 && !_due(c).isAfter(dueOn),
  );
  final amount =
      _uninvoiced(next) + fees.fold<int>(0, (sum, c) => sum + _uninvoiced(c));
  final lead = detail.account.autoIssueDaysBefore;
  return (amount: amount, sendDate: dueOn.subtract(Duration(days: lead)));
}

/// True when the nightly run is about to send the very first bill: nothing is
/// billed yet and an unpaid charge is overdue or inside the lead window. Once
/// it is on a bill it leaves `payableCharges`, so a prepayment typed afterwards
/// would land on the wrong months.
bool firstBillDueSoon(FinancialAccountDetailModel detail, DateTime now) {
  if (detail.account.rentBillingCadence == 'MANUAL') return false;
  final live = detail.charges.where((c) => _isLive(c) && c.amount > 0);
  if (live.any((c) => c.invoicedAmount > 0)) return false;
  final tonight = now.add(const Duration(days: 1));
  final lead = Duration(days: detail.account.autoIssueDaysBefore);
  return live.any(
    (c) =>
        c.settledAmount < c.amount && !_due(c).subtract(lead).isAfter(tonight),
  );
}

/// Refunds are negative charges and are listed on their own.
List<ChargeModel> rentRows(List<ChargeModel> charges) =>
    charges
        .where((c) => _isLive(c) && c.amount > 0 && c.category == _rent)
        .toList()
      ..sort(_byDue);

List<ChargeModel> feeRows(List<ChargeModel> charges) => charges
    .where((c) => _isLive(c) && c.amount > 0 && c.category != _rent)
    .toList();

List<ChargeModel> refundRows(List<ChargeModel> charges) =>
    charges.where((c) => _isLive(c) && c.amount < 0).toList();

List<ChargeModel> removedRows(List<ChargeModel> charges) =>
    charges.where((c) => !_isLive(c)).toList();

int wholeTermTotal(List<ChargeModel> charges) =>
    charges.where(_isLive).fold<int>(0, (sum, c) => sum + c.amount);
