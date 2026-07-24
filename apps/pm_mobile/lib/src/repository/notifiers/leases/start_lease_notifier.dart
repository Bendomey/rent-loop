import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'start_lease_notifier.g.dart';

class StartLeaseState extends ApiState {
  StartLeaseState({super.status, super.errorMessage});
}

/// Backs the Start Lease bottom sheet — mirrors the web `StartLeaseDialog`'s
/// two actions as two methods on the same notifier (both go through the
/// same `PATCH .../leases/{id}` call first, since the backend always wants
/// `utility_transfers_date` recorded regardless of whether the lease is
/// activated in the same step).
@riverpod
class StartLeaseNotifier extends _$StartLeaseNotifier {
  @override
  StartLeaseState build() => StartLeaseState();

  /// "Save And Continue Later" — records the utility transfer date without
  /// activating the lease.
  Future<void> saveUtilityTransfer({
    required String propertyId,
    required String leaseId,
    required DateTime utilityTransfersDate,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = StartLeaseState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseApiProvider)
          .updateLease(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            utilityTransfersDate: utilityTransfersDate,
          );
      state = StartLeaseState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// "Activate" — records the utility transfer date, then activates the
  /// lease. Two sequential requests, same as the web dialog's
  /// `handleActivate()`.
  Future<void> activate({
    required String propertyId,
    required String leaseId,
    required DateTime utilityTransfersDate,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = StartLeaseState(status: ApiStatus.pending);
    try {
      final api = ref.read(leaseApiProvider);
      await api.updateLease(
        clientId: clientId,
        propertyId: propertyId,
        leaseId: leaseId,
        utilityTransfersDate: utilityTransfersDate,
      );
      await api.activateLease(
        clientId: clientId,
        propertyId: propertyId,
        leaseId: leaseId,
      );
      state = StartLeaseState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = StartLeaseState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = StartLeaseState();
}
