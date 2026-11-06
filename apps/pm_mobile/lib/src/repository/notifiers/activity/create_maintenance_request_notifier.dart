import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_requests_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';

part 'create_maintenance_request_notifier.g.dart';

class CreateMaintenanceRequestState extends ApiState {
  CreateMaintenanceRequestState({
    super.status,
    super.errorMessage,
    this.createdId,
  });

  final String? createdId;
}

@riverpod
class CreateMaintenanceRequestNotifier
    extends _$CreateMaintenanceRequestNotifier {
  @override
  CreateMaintenanceRequestState build() => CreateMaintenanceRequestState();

  Future<void> submit({
    required String propertyId,
    required List<String> unitIds,
    required List<String> blockIds,
    required String title,
    required String description,
    required String priority,
    required String category,
    required String visibility,
    required List<String> attachments,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = CreateMaintenanceRequestState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateMaintenanceRequestState(status: ApiStatus.pending);
    try {
      final created = await ref
          .read(maintenanceRequestApiProvider)
          .createMaintenanceRequest(
            clientId: clientId,
            propertyId: propertyId,
            unitIds: unitIds,
            blockIds: blockIds,
            title: title,
            description: description,
            priority: priority,
            category: category,
            visibility: visibility,
            attachments: attachments,
          );
      ref.invalidate(activityCountsProvider);
      for (final status in kMaintenanceStatusOrder) {
        if (ref.exists(maintenanceRequestsNotifierProvider(status))) {
          unawaited(
            ref
                .read(maintenanceRequestsNotifierProvider(status).notifier)
                .reload(),
          );
        }
      }
      state = CreateMaintenanceRequestState(
        status: ApiStatus.success,
        createdId: created.firstOrNull?.id,
      );
    } on ApiException catch (e) {
      state = CreateMaintenanceRequestState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateMaintenanceRequestState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CreateMaintenanceRequestState();
}
