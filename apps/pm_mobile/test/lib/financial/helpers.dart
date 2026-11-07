import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

ChargeModel charge({
  String id = 'c',
  String name = 'Charge',
  String category = 'RENT',
  int amount = 100000,
  String dueDate = '2026-09-08T00:00:00Z',
  int invoiced = 0,
  int settled = 0,
  String? voidedAt,
  String? voidedReason,
  String? reverses,
}) => ChargeModel(
  id: id,
  name: name,
  category: category,
  amount: amount,
  currency: 'GHS',
  dueDate: dueDate,
  invoicedAmount: invoiced,
  settledAmount: settled,
  outstandingAmount: amount - settled,
  status: 'OPEN',
  voidedAt: voidedAt,
  voidedReason: voidedReason,
  reversesChargeInstanceId: reverses,
);

FinancialAccountDetailModel detail(
  List<ChargeModel> charges, {
  String cadence = 'EVERY_PERIOD',
  int interval = 0,
  int leadDays = 5,
}) => FinancialAccountDetailModel(
  account: FinancialAccountModel(
    id: 'a',
    currency: 'GHS',
    rentBillingCadence: cadence,
    rentBillingInterval: interval,
    autoIssueDaysBefore: leadDays,
    status: 'ACTIVE',
  ),
  charges: charges,
  totalCharged: 0,
  totalSettled: 0,
  outstandingAmount: 0,
  availableCredit: 0,
);
