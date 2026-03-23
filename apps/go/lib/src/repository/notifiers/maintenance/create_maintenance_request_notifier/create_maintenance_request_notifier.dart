import 'package:rentloop_go/src/api/maintenance.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/analytics_service.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/api_state.dart';
import 'package:rentloop_go/src/repository/notifiers/maintenance/maintenance_requests_notifier/maintenance_requests_notifier.dart';
import 'package:rentloop_go/src/repository/providers/maintenance_badge_provider.dart';

part 'create_maintenance_request_notifier.g.dart';

class CreateMaintenanceRequestState extends ApiState {
  CreateMaintenanceRequestState({super.status, super.errorMessage});
}

@riverpod
class CreateMaintenanceRequestNotifier
    extends _$CreateMaintenanceRequestNotifier {
  @override
  CreateMaintenanceRequestState build() => CreateMaintenanceRequestState();

  /// Returns the new MR's ID on success, null on failure.
  Future<String?> submit({
    required String leaseId,
    required String title,
    required String description,
    required String category,
    required String priority,
    List<String> attachments = const [],
  }) async {
    state = CreateMaintenanceRequestState(status: ApiStatus.pending);
    try {
      final mr = await ref
          .read(maintenanceApiProvider)
          .createMaintenanceRequest(leaseId, {
            'title': title,
            'description': description,
            'category': category,
            'priority': priority,
            if (attachments.isNotEmpty) 'attachments': attachments,
          });
      // Refresh the list from the first page and update the badge count.
      ref.read(maintenanceRequestsNotifierProvider.notifier).loadFirstPage();
      ref.invalidate(mrStatsProvider);
      await AnalyticsService.logEvent(
        'maintenance_request_submitted',
        parameters: {
          'mr_id': mr.id,
          'category': category,
          'priority': priority,
        },
      );
      state = CreateMaintenanceRequestState(status: ApiStatus.success);
      return mr.id;
    } on ApiException catch (e) {
      state = CreateMaintenanceRequestState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return null;
    } catch (_) {
      state = CreateMaintenanceRequestState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return null;
    }
  }
}
