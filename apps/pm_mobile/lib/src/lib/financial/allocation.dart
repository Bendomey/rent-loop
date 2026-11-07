import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

DateTime _due(ChargeModel c) => DateTime.parse(c.dueDate).toUtc();

List<ChargeModel> _byDueDate(Iterable<ChargeModel> charges) {
  final indexed = charges.toList().asMap().entries.toList()
    ..sort((a, b) {
      final byDate = _due(a.value).compareTo(_due(b.value));
      return byDate != 0 ? byDate : a.key.compareTo(b.key);
    });
  return [for (final e in indexed) e.value];
}

/// Not voided, not settled, and with something no bill has claimed yet.
List<ChargeModel> payableCharges(List<ChargeModel> charges) => _byDueDate(
  charges.where(
    (c) =>
        c.voidedAt == null &&
        c.settledAmount < c.amount &&
        c.amount - c.invoicedAmount > 0,
  ),
);

/// What is still refundable on [charge]: what was paid, less refunds already
/// recorded against it.
int refundableAmount(ChargeModel charge, List<ChargeModel> all) {
  final reversed = all
      .where(
        (c) => c.voidedAt == null && c.reversesChargeInstanceId == charge.id,
      )
      .fold(0, (sum, c) => sum - c.amount);
  return charge.settledAmount - reversed;
}

/// Refunds are negative charges, so `amount > 0` keeps them from being offered
/// for a second refund.
List<ChargeModel> refundableCharges(List<ChargeModel> charges) => _byDueDate(
  charges.where(
    (c) =>
        c.voidedAt == null && c.amount > 0 && refundableAmount(c, charges) > 0,
  ),
);

/// Oldest due first, the same walk the backend does when it settles a bill's
/// lines. [partial] marks a line that takes less than the charge has left.
List<({String chargeId, int amount, bool partial})> allocateAmount(
  List<ChargeModel> payable,
  int amount,
) {
  final lines = <({String chargeId, int amount, bool partial})>[];
  var left = amount;
  for (final c in _byDueDate(payable)) {
    if (left <= 0) break;
    final open = c.amount - c.invoicedAmount;
    if (open <= 0 || c.voidedAt != null) continue;
    final take = open < left ? open : left;
    lines.add((chargeId: c.id, amount: take, partial: take < open));
    left -= take;
  }
  return lines;
}
