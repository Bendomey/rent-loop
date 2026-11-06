import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/lib/property_stats_logic.dart';

part 'home_stats_provider.g.dart';

/// The Home screen's money and unit numbers, read from Cube.
///
/// No filters: each cube scopes itself to the caller's property access from
/// the analytics JWT. Three calls because these cubes have no join path.
@riverpod
Future<HomeStats> homeStats(HomeStatsRef ref) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return const HomeStats();

  try {
    final token = await ref
        .read(analyticsApiProvider)
        .getToken(clientId: clientId);
    final cube = ref.read(cubeApiProvider);
    final monthRange = currentMonthDateRange(DateTime.now());

    final results = await Future.wait([
      cube.load(
        token: token,
        query: {
          'measures': ['Payments.totalAmount'],
          'timeDimensions': [
            {'dimension': 'Payments.successfulAt', 'dateRange': monthRange},
          ],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Charges.outstandingAmount', 'Charges.arrearsAmount'],
          'dimensions': ['Charges.financialAccountId'],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Units.availableCount', 'Units.count'],
        },
      ),
    ]);

    return computeHomeStats(
      paymentRows: results[0],
      chargeRows: results[1],
      unitRows: results[2],
      clientId: clientId,
    );
  } on ApiException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } on CubeException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } catch (_) {
    throw Exception(translateApiErrorMessage());
  }
}
