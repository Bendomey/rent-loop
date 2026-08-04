import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';

part 'leases_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Mirrors
/// TenantsQuery.
class LeasesQuery {
  final String? search;
  final String? status; // full dotted Lease.Status.* value, or null for "all"
  final String? propertyId;

  const LeasesQuery({this.search, this.status, this.propertyId});

  LeasesQuery copyWith({
    String? search,
    String? status,
    String? propertyId,
    bool clearSearch = false,
    bool clearStatus = false,
    bool clearPropertyId = false,
  }) {
    return LeasesQuery(
      search: clearSearch ? null : (search ?? this.search),
      status: clearStatus ? null : (status ?? this.status),
      propertyId: clearPropertyId ? null : (propertyId ?? this.propertyId),
    );
  }
}

class LeasesState {
  const LeasesState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  final List<LeaseModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  LeasesState copyWith({
    List<LeaseModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return LeasesState(
      items: items ?? this.items,
      total: total ?? this.total,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      currentPage: currentPage ?? this.currentPage,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Global leases list — not property-scoped in construction (unlike
/// UnitsNotifier/BlocksNotifier); property is just one optional filter here,
/// since GET .../leases spans every property the caller can access. Mirrors
/// TenantsNotifier exactly.
@riverpod
class LeasesNotifier extends _$LeasesNotifier {
  static const int _pageSize = 10;

  LeasesQuery _currentQuery = const LeasesQuery();

  @override
  LeasesState build() => const LeasesState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<void> loadFirstPage([LeasesQuery query = const LeasesQuery()]) async {
    _currentQuery = query;
    final clientId = _clientId;
    if (clientId == null) {
      state = state.copyWith(isLoading: false, items: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await ref
          .read(leaseApiProvider)
          .getLeases(
            clientId: clientId,
            page: 1,
            pageSize: _pageSize,
            search: query.search,
            status: query.status,
            propertyId: query.propertyId,
          );
      state = LeasesState(
        items: result.rows,
        total: result.meta.total,
        hasNextPage: result.meta.hasNextPage,
        currentPage: 1,
        isLoading: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: translateApiErrorMessage(),
      );
    }
  }

  Future<void> loadNextPage() async {
    if (!state.hasNextPage || state.isLoadingMore) return;

    final clientId = _clientId;
    if (clientId == null) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(leaseApiProvider)
          .getLeases(
            clientId: clientId,
            page: nextPage,
            pageSize: _pageSize,
            search: _currentQuery.search,
            status: _currentQuery.status,
            propertyId: _currentQuery.propertyId,
          );
      state = state.copyWith(
        items: [...state.items, ...result.rows],
        total: result.meta.total,
        hasNextPage: result.meta.hasNextPage,
        currentPage: nextPage,
        isLoadingMore: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = state.copyWith(
        isLoadingMore: false,
        error: translateApiErrorMessage(),
      );
    }
  }
}
