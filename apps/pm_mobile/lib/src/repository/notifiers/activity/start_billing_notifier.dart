import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'start_billing_notifier.g.dart';

class StartBillingState extends ApiState {
  StartBillingState({
    super.status,
    super.errorMessage,
    this.accountId,
    this.failedFees = const [],
    this.policyFailed = false,
  });

  final String? accountId;
  final List<String> failedFees;
  final bool policyFailed;
}

@riverpod
class StartBillingNotifier extends _$StartBillingNotifier {
  @override
  StartBillingState build() => StartBillingState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String? existingAccountId,
    required int rentMinor,
    required String currency,
    required List<({String name, String category, int amount})> fees,
    required BillingChoice choice,
    required int leadDays,
    required DateTime moveIn,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = StartBillingState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = StartBillingState(status: ApiStatus.pending);
    final applications = ref.read(tenantApplicationApiProvider);
    final accounts = ref.read(financialAccountApiProvider);

    try {
      await applications.updateApplication(
        clientId: clientId,
        propertyId: propertyId,
        id: applicationId,
        patch: {'rent_fee': rentMinor},
      );
    } catch (_) {
      state = StartBillingState(
        status: ApiStatus.failed,
        errorMessage: 'Could not save the rent. Nothing was created.',
      );
      return;
    }

    String accountId;
    try {
      accountId =
          existingAccountId ??
          await applications.prepareCharges(
            clientId: clientId,
            propertyId: propertyId,
            id: applicationId,
          );
    } catch (e) {
      invalidateFinancials(
        ref,
        propertyId: propertyId,
        applicationId: applicationId,
      );
      final code = e is ApiException ? e.message : null;
      final found = code == 'ChargesAlreadyPrepared'
          ? await _preparedAccountId(clientId, propertyId, applicationId)
          : null;
      if (found == null) {
        state = StartBillingState(
          status: ApiStatus.failed,
          errorMessage: translateApiErrorMessage(errorMessage: code),
        );
        return;
      }
      accountId = found;
    }

    final failedFees = <String>[];
    for (final fee in fees) {
      final name = fee.name.trim();
      if (name.isEmpty || fee.amount <= 0) continue;
      try {
        await accounts.addCharge(
          clientId: clientId,
          propertyId: propertyId,
          accountId: accountId,
          name: name,
          category: fee.category,
          amount: fee.amount,
          currency: currency,
          dueDate: moveIn,
        );
      } catch (_) {
        failedFees.add(fee.name);
      }
    }

    var policyFailed = false;
    try {
      final cadence = cadenceForChoice(choice);
      await accounts.updateBillingPolicy(
        clientId: clientId,
        propertyId: propertyId,
        accountId: accountId,
        cadence: cadence.cadence,
        interval: cadence.interval,
        autoIssueDaysBefore: leadDays,
      );
    } catch (_) {
      policyFailed = true;
    }

    invalidateFinancials(
      ref,
      propertyId: propertyId,
      applicationId: applicationId,
      accountId: accountId,
    );
    state = StartBillingState(
      status: ApiStatus.success,
      accountId: accountId,
      failedFees: failedFees,
      policyFailed: policyFailed,
    );
  }

  /// A second tap or a retry after a dropped response lands here: the account
  /// exists, so the rest of setup can still run against it.
  Future<String?> _preparedAccountId(
    String clientId,
    String propertyId,
    String applicationId,
  ) async {
    try {
      final application = await ref
          .read(tenantApplicationApiProvider)
          .getApplication(
            clientId: clientId,
            propertyId: propertyId,
            id: applicationId,
          );
      return application.financialAccount?.id;
    } catch (_) {
      return null;
    }
  }

  void reset() => state = StartBillingState();
}
