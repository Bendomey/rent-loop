import 'package:flutter_riverpod/flutter_riverpod.dart' show Ref;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/repository/providers/analytics_token_provider.dart';

part 'home_stats_provider.g.dart';

// Each Home section reads its own slice so one failing cube never blanks the
// rest of the screen. Slices are keepAlive families keyed by property (null
// is "All properties"), so switching property never refetches another key.
// No property filter means each cube scopes itself to the caller's property
// access from the analytics JWT.

/// Every Home slice, for invalidating after a change that moves its numbers.
List<ProviderOrFamily> get homeStatsProviders => [
  homePaymentsProvider,
  homeChargesProvider,
  homeLeasesProvider,
  homeRepairsProvider,
  homeUnitsProvider,
  homePendingTenantsProvider,
  homePropertyNamesProvider,
];

@Riverpod(keepAlive: true)
class HomeProperty extends _$HomeProperty {
  @override
  ({String id, String name})? build() {
    ref.watch(currentWorkspaceNotifierProvider.select((w) => w?.clientId));
    return null;
  }

  void select(({String id, String name})? property) => state = property;
}

List<Map<String, dynamic>> _propertyFilter(String member, String? propertyId) =>
    [
      if (propertyId != null)
        {
          'member': member,
          'operator': 'equals',
          'values': [propertyId],
        },
    ];

Future<T> _load<T>(
  Ref ref,
  T empty,
  Map<String, dynamic> query,
  T Function(List<Map<String, dynamic>> rows, String clientId) parse,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return empty;
  try {
    final cube = ref.read(cubeApiProvider);
    final rows = await withCubeToken(
      ref,
      (token) => cube.load(token: token, query: query),
    );
    return parse(rows, clientId);
  } on ApiException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } on CubeException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } catch (_) {
    throw Exception(translateApiErrorMessage());
  }
}

/// One query feeds the money card, the chart and the property list: monthly
/// successful payments per property over the chart window.
@Riverpod(keepAlive: true)
Future<HomePayments> homePayments(HomePaymentsRef ref, String? propertyId) {
  final now = DateTime.now();
  return _load(
    ref,
    const HomePayments(),
    {
      'measures': ['Payments.totalAmount'],
      'dimensions': ['Payments.propertyId'],
      'timeDimensions': [
        {
          'dimension': 'Payments.successfulAt',
          'granularity': 'month',
          'dateRange': homeTrendDateRange(now),
        },
      ],
      'filters': _propertyFilter('Payments.propertyId', propertyId),
    },
    (rows, clientId) => parseHomePayments(rows, now: now, clientId: clientId),
  );
}

/// Per account (and so per property) rows, so credits never offset debts and
/// late properties can be counted.
@Riverpod(keepAlive: true)
Future<HomeCharges> homeCharges(HomeChargesRef ref, String? propertyId) {
  return _load(
    ref,
    const HomeCharges(),
    {
      'measures': ['Charges.outstandingAmount', 'Charges.arrearsAmount'],
      'dimensions': ['Charges.financialAccountId', 'Charges.propertyId'],
      'filters': _propertyFilter('Charges.propertyId', propertyId),
    },
    (rows, clientId) => parseHomeCharges(rows, clientId: clientId),
  );
}

@Riverpod(keepAlive: true)
Future<HomeLeases> homeLeases(HomeLeasesRef ref, String? propertyId) {
  return _load(
    ref,
    const HomeLeases(),
    {
      'measures': ['Leases.activeCount', 'Leases.expiringCount'],
      'filters': _propertyFilter('Leases.propertyId', propertyId),
    },
    (rows, clientId) => parseHomeLeases(rows, clientId: clientId),
  );
}

@Riverpod(keepAlive: true)
Future<HomeRepairs> homeRepairs(HomeRepairsRef ref, String? propertyId) {
  return _load(
    ref,
    const HomeRepairs(),
    {
      'measures': [
        'MaintenanceRequests.newCount',
        'MaintenanceRequests.inProgressCount',
        'MaintenanceRequests.inReviewCount',
      ],
      'dimensions': ['MaintenanceRequests.priority'],
      'filters': _propertyFilter('MaintenanceRequests.propertyId', propertyId),
    },
    (rows, clientId) => parseHomeRepairs(rows, clientId: clientId),
  );
}

@Riverpod(keepAlive: true)
Future<HomeUnits> homeUnits(HomeUnitsRef ref, String? propertyId) {
  return _load(ref, const HomeUnits(), {
    'measures': ['Units.count', 'Units.occupiedCount', 'Units.availableCount'],
    'filters': _propertyFilter('Units.propertyId', propertyId),
  }, (rows, clientId) => parseHomeUnits(rows, clientId: clientId));
}

@Riverpod(keepAlive: true)
Future<HomePendingTenants> homePendingTenants(
  HomePendingTenantsRef ref,
  String? propertyId,
) {
  return _load(
    ref,
    const HomePendingTenants(),
    {
      'measures': ['TenantApplications.inProgressCount'],
      'filters': _propertyFilter('TenantApplications.propertyId', propertyId),
    },
    (rows, clientId) => parseHomePendingTenants(rows, clientId: clientId),
  );
}

const _namesPageSize = 100;
const _maxNamePages = 10;

/// Names for the property list; Cube only knows property ids.
@Riverpod(keepAlive: true)
Future<HomePropertyNames> homePropertyNames(HomePropertyNamesRef ref) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return const HomePropertyNames();
  try {
    final api = ref.read(clientUserPropertyApiProvider);
    final names = <String, String>{};
    for (var page = 1; page <= _maxNamePages; page++) {
      final result = await api.getMyProperties(
        clientId: clientId,
        page: page,
        pageSize: _namesPageSize,
      );
      for (final p in result.rows) {
        names[p.id] = p.name;
      }
      if (!result.meta.hasNextPage) break;
    }
    return HomePropertyNames(names: names, clientId: clientId);
  } on ApiException catch (e) {
    throw Exception(translateApiErrorMessage(errorMessage: e.message));
  } catch (_) {
    throw Exception(translateApiErrorMessage());
  }
}
