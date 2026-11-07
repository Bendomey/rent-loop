import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

enum FinancialMode { readonly, blocked, setup, locked, live }

const _completed = 'TenantApplication.Status.Completed';

bool _moveInComplete(TenantApplicationModel a) =>
    a.desiredMoveInDate != null &&
    (a.stayDuration ?? 0) != 0 &&
    (a.stayDurationFrequency ?? '').isNotEmpty;

/// Only a billed or paid rent charge freezes the terms: rent alone derives
/// from the move-in date and unit, so a billed deposit must not lock it.
FinancialMode resolveFinancialMode(
  TenantApplicationModel application,
  FinancialAccountDetailModel? account,
) {
  if (application.status == _completed) return FinancialMode.readonly;
  if (!_moveInComplete(application)) return FinancialMode.blocked;
  if (application.financialAccount == null || account == null) {
    return FinancialMode.setup;
  }
  final billed = account.charges.any(
    (c) =>
        c.category == 'RENT' && (c.invoicedAmount != 0 || c.settledAmount != 0),
  );
  return billed ? FinancialMode.locked : FinancialMode.live;
}
