import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/financial_mode.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

import 'helpers.dart';

TenantApplicationModel app({
  String status = 'TenantApplication.Status.InProgress',
  DateTime? moveIn,
  int? duration = 12,
  String? frequency = 'MONTHLY',
  bool hasAccount = true,
}) => TenantApplicationModel(
  id: 'x',
  code: 'c',
  status: status,
  desiredMoveInDate: moveIn ?? DateTime.utc(2026, 9, 1),
  stayDuration: duration,
  stayDurationFrequency: frequency,
  financialAccount: hasAccount ? FinancialAccountSummaryModel(id: 'a') : null,
);

void main() {
  final live = detail([charge()]);

  test('readonly when completed, ahead of every other rule', () {
    final a = app(
      status: 'TenantApplication.Status.Completed',
      duration: null,
      hasAccount: false,
    );
    expect(resolveFinancialMode(a, null), FinancialMode.readonly);
  });

  test('blocked when move-in details are missing', () {
    expect(
      resolveFinancialMode(app(duration: null), live),
      FinancialMode.blocked,
    );
    expect(resolveFinancialMode(app(duration: 0), live), FinancialMode.blocked);
    expect(
      resolveFinancialMode(app(frequency: null), live),
      FinancialMode.blocked,
    );
    expect(
      resolveFinancialMode(app(frequency: ''), live),
      FinancialMode.blocked,
    );
  });

  test('blocked when there is no move-in date', () {
    final a = TenantApplicationModel(
      id: 'x',
      code: 'c',
      status: 'TenantApplication.Status.InProgress',
      stayDuration: 12,
      stayDurationFrequency: 'MONTHLY',
    );
    expect(resolveFinancialMode(a, live), FinancialMode.blocked);
  });

  test('setup when there is no account or it has not loaded', () {
    expect(
      resolveFinancialMode(app(hasAccount: false), live),
      FinancialMode.setup,
    );
    expect(resolveFinancialMode(app(), null), FinancialMode.setup);
  });

  test('locked once a rent charge is billed or paid', () {
    expect(
      resolveFinancialMode(app(), detail([charge(invoiced: 1)])),
      FinancialMode.locked,
    );
    expect(
      resolveFinancialMode(app(), detail([charge(settled: 1)])),
      FinancialMode.locked,
    );
  });

  test("a deposit that is billed alone doesn't lock", () {
    final d = detail([
      charge(),
      charge(id: 'dep', category: 'DEPOSIT', invoiced: 100000),
    ]);
    expect(resolveFinancialMode(app(), d), FinancialMode.live);
  });

  test('live otherwise', () {
    expect(resolveFinancialMode(app(), live), FinancialMode.live);
  });
}
