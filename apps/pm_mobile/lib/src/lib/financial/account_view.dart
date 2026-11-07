import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

const _rent = 'RENT';

DateTime _due(ChargeModel c) => DateTime.parse(c.dueDate).toUtc();

int _byDue(ChargeModel a, ChargeModel b) => _due(a).compareTo(_due(b));

bool _isLive(ChargeModel c) => c.voidedAt == null;

int _uninvoiced(ChargeModel c) => c.amount - c.invoicedAmount;

/// Past due and not paid, whether or not a bill went out for it. A charge is
/// only late from the day after its due date, compared as calendar days.
int lateAmount(List<ChargeModel> charges, DateTime now) {
  final today = DateTime.utc(now.year, now.month, now.day);
  return charges
      .where(
        (c) =>
            _isLive(c) &&
            c.settledAmount < c.amount &&
            DateTime.utc(
              _due(c).year,
              _due(c).month,
              _due(c).day,
            ).isBefore(today),
      )
      .fold<int>(0, (sum, c) => sum + (c.amount - c.settledAmount));
}

/// Mirrors the server's selection: a due one-off is enough to issue a bill, so
/// the send date is the earliest of the one-offs and the next rent, less the
/// lead. It is clamped to today, and `tonight` says the nightly run takes it.
/// Null for a MANUAL cadence, where nothing is sent automatically.
({int amount, DateTime sendDate, bool tonight})? nextBill(
  FinancialAccountDetailModel detail,
  DateTime now,
) {
  if (detail.account.rentBillingCadence == 'MANUAL') return null;

  bool billable(ChargeModel c) =>
      _isLive(c) && _uninvoiced(c) > 0 && c.settledAmount < c.amount;
  final live = detail.charges.where(billable).toList()..sort(_byDue);
  final rents = live.where((c) => c.category == _rent).toList();
  final oneOffs = live.where((c) => c.category != _rent).toList();
  if (rents.isEmpty && oneOffs.isEmpty) return null;

  final lead = Duration(days: detail.account.autoIssueDaysBefore);
  final today = DateTime.utc(now.year, now.month, now.day);
  final firstDue = [
    if (rents.isNotEmpty) _due(rents.first),
    if (oneOffs.isNotEmpty) _due(oneOffs.first),
  ].reduce((a, b) => a.isBefore(b) ? a : b);
  final raw = firstDue.subtract(lead);
  final sendDate = raw.isAfter(today) ? raw : today;

  final cutoff = sendDate.add(lead);
  final included = oneOffs.where((c) => !_due(c).isAfter(cutoff));
  final amount =
      (rents.isEmpty ? 0 : _uninvoiced(rents.first)) +
      included.fold<int>(0, (sum, c) => sum + _uninvoiced(c));
  return (amount: amount, sendDate: sendDate, tonight: !raw.isAfter(today));
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
