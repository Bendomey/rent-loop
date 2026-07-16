import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';

part 'properties_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Pagination
/// (page/pageSize/currentPage) is tracked separately in [PropertiesState],
/// not here — this class is only the user-controlled filter set.
class PropertiesQuery {
  final String? search;
  final String?
  status; // full dotted API value (e.g. Property.Status.Active), or null for "all"

  const PropertiesQuery({this.search, this.status});

  PropertiesQuery copyWith({
    String? search,
    String? status,
    bool clearSearch = false,
    bool clearStatus = false,
  }) {
    return PropertiesQuery(
      search: clearSearch ? null : (search ?? this.search),
      status: clearStatus ? null : (status ?? this.status),
    );
  }
}

class PropertiesState {
  final List<PropertyModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  const PropertiesState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  PropertiesState copyWith({
    List<PropertyModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return PropertiesState(
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

@riverpod
class PropertiesNotifier extends _$PropertiesNotifier {
  static const int _pageSize = 10;

  PropertiesQuery _currentQuery = const PropertiesQuery();

  @override
  PropertiesState build() => const PropertiesState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  /// Load page 1 with [query]. Resets pagination state. Existing items are
  /// preserved during the load so the UI doesn't flash (mirrors
  /// apps/go's MaintenanceRequestsNotifier.loadFirstPage).
  Future<void> loadFirstPage(PropertiesQuery query) async {
    _currentQuery = query;
    final clientId = _clientId;
    // Screen only mounts once a workspace is selected — defensive, not an
    // expected runtime path (same precedent as onboarding_checklist_provider.dart).
    if (clientId == null) {
      state = state.copyWith(isLoading: false, items: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await ref
          .read(propertyApiProvider)
          .getProperties(
            clientId: clientId,
            page: 1,
            pageSize: _pageSize,
            search: query.search,
            status: query.status,
          );
      state = PropertiesState(
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

  /// Append the next page using the filters from the last [loadFirstPage] call.
  Future<void> loadNextPage() async {
    if (!state.hasNextPage || state.isLoadingMore) return;

    final clientId = _clientId;
    if (clientId == null) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(propertyApiProvider)
          .getProperties(
            clientId: clientId,
            page: nextPage,
            pageSize: _pageSize,
            search: _currentQuery.search,
            status: _currentQuery.status,
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
