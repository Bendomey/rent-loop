import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/activity_counts_logic.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/activity_counts_model.dart';

part 'activity_counts_provider.g.dart';

/// The Maintenance / Applications / Bookings badge numbers on the Activity
/// screen, read from Cube in one round of parallel queries.
///
/// Cube rather than the REST list endpoints because only maintenance has a
/// cross-property route (`/clients/{id}/maintenance-requests`) — applications
/// and bookings are property-scoped, so a REST total would mean one request
/// per property.
///
/// The queries carry no filters. Each cube resolves the caller's property
/// access itself from the ids in the analytics JWT, mirroring what the REST
/// middleware enforces: an OWNER reaches their whole client, everyone else
/// reaches their explicit `client_user_properties` grants. So these totals are
/// already scoped — a manager sees their own portfolio, not the client's.
///
/// Three calls rather than one: Cube only merges measures from different cubes
/// when they are joined, and these three have no join path.
@riverpod
Future<ActivityCounts> activityCounts(ActivityCountsRef ref) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return const ActivityCounts();

  try {
    final token = await ref
        .read(analyticsApiProvider)
        .getToken(clientId: clientId);
    final cube = ref.read(cubeApiProvider);

    final results = await Future.wait([
      cube.load(
        token: token,
        query: {
          'measures': [
            'MaintenanceRequests.newCount',
            'MaintenanceRequests.inProgressCount',
            'MaintenanceRequests.inReviewCount',
          ],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['TenantApplications.inProgressCount'],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Bookings.confirmedCount', 'Bookings.checkedInCount'],
        },
      ),
    ]);

    return computeActivityCounts(
      maintenanceRows: results[0],
      applicationRows: results[1],
      bookingRows: results[2],
    );
  } on ApiException catch (e) {
    // Analytics token fetch failed (expired session, no analytics access for
    // this client) — same translation convention as PropertyStatsProvider.
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } on CubeException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } catch (_) {
    throw Exception(translateApiErrorMessage());
  }
}
