import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';

part 'create_application_notifier.g.dart';

class CreateApplicationState extends ApiState {
  CreateApplicationState({super.status, super.errorMessage, this.application});

  final TenantApplicationModel? application;
}

@riverpod
class CreateApplicationNotifier extends _$CreateApplicationNotifier {
  @override
  CreateApplicationState build() => CreateApplicationState();

  Future<void> submit(
    CreateTenantApplicationInput input, {
    required String propertyId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateApplicationState(status: ApiStatus.pending);
    try {
      final created = await ref
          .read(tenantApplicationApiProvider)
          .createApplication(
            clientId: clientId,
            propertyId: propertyId,
            input: input,
          );
      ref.invalidate(pendingTenantsProvider);
      ref.invalidate(propertyStatsProvider(propertyId));
      state = CreateApplicationState(
        status: ApiStatus.success,
        application: created,
      );
    } on ApiException catch (e) {
      state = CreateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CreateApplicationState();
}
