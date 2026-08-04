import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/property_stats_logic.dart';
import 'package:rentloop_manager/src/repository/models/property_stats_model.dart';

part 'property_stats_provider.g.dart';

@riverpod
Future<PropertyStats> propertyStats(
  PropertyStatsRef ref,
  String propertyId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  try {
    final token = await ref
        .read(analyticsApiProvider)
        .getToken(clientId: clientId);
    final cube = ref.read(cubeApiProvider);
    final monthRange = currentMonthDateRange(DateTime.now());

    Map<String, dynamic> propertyFilter(String member) => {
      'member': member,
      'operator': 'equals',
      'values': [propertyId],
    };

    final results = await Future.wait([
      cube.load(
        token: token,
        query: {
          'measures': [
            'Units.count',
            'Units.occupiedCount',
            'Units.availableCount',
            'Units.maintenanceCount',
            'Units.draftCount',
            'Units.partiallyOccupiedCount',
          ],
          'filters': [propertyFilter('Units.propertyId')],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Invoices.paidAmount'],
          'timeDimensions': [
            {
              'dimension': 'Invoices.paidAt',
              'granularity': 'month',
              'dateRange': monthRange,
            },
          ],
          'filters': [propertyFilter('Invoices.propertyId')],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Leases.activeCount'],
          'filters': [propertyFilter('Leases.propertyId')],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['Bookings.confirmedCount', 'Bookings.checkedInCount'],
          'filters': [propertyFilter('Bookings.propertyId')],
        },
      ),
      cube.load(
        token: token,
        query: {
          'measures': ['TenantApplications.inProgressCount'],
          'filters': [propertyFilter('TenantApplications.propertyId')],
        },
      ),
    ]);

    return computePropertyStats(
      unitsRows: results[0],
      invoiceRows: results[1],
      leaseRows: results[2],
      bookingRows: results[3],
      applicationRows: results[4],
    );
  } on ApiException catch (e) {
    // Analytics token fetch failed (e.g. expired session, no analytics
    // access for this client) — same translation convention as every
    // other ApiException in this app.
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } on CubeException catch (e) {
    // Cube.js REST call failed (bad query, Cube service down/still
    // building, malformed response) — no confirmed Cube error codes to
    // special-case yet, so this always falls through to the default
    // message, same as ApiException's unmatched-code case.
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } catch (_) {
    throw Exception(translateApiErrorMessage());
  }
}
