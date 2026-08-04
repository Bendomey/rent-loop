import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'units_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Pagination
/// (page/pageSize/currentPage) is tracked separately in [UnitsState],
/// not here — this class is only the user-controlled filter set.
/// Mirrors PropertiesQuery in properties_notifier.dart.
class UnitsQuery {
  final String? search;
  final String?
  status; // full dotted API value (e.g. Unit.Status.Available), or null for "all"
  final String? blockId;

  const UnitsQuery({this.search, this.status, this.blockId});

  UnitsQuery copyWith({
    String? search,
    String? status,
    String? blockId,
    bool clearSearch = false,
    bool clearStatus = false,
    bool clearBlockId = false,
  }) {
    return UnitsQuery(
      search: clearSearch ? null : (search ?? this.search),
      status: clearStatus ? null : (status ?? this.status),
      blockId: clearBlockId ? null : (blockId ?? this.blockId),
    );
  }
}

class UnitsState {
  const UnitsState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  final List<UnitModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  UnitsState copyWith({
    List<UnitModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return UnitsState(
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
class UnitsNotifier extends _$UnitsNotifier {
  static const int _pageSize = 10;

  String? _propertyId;
  UnitsQuery _currentQuery = const UnitsQuery();

  @override
  UnitsState build() => const UnitsState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  /// Load page 1 of [propertyId]'s units filtered by [query]. Resets
  /// pagination state.
  Future<void> loadFirstPage(
    String propertyId, [
    UnitsQuery query = const UnitsQuery(),
  ]) async {
    _propertyId = propertyId;
    _currentQuery = query;
    final clientId = _clientId;
    if (clientId == null) {
      state = state.copyWith(isLoading: false, items: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await ref
          .read(unitApiProvider)
          .getUnits(
            clientId: clientId,
            propertyId: propertyId,
            page: 1,
            pageSize: _pageSize,
            search: query.search,
            status: query.status,
            blockId: query.blockId,
          );
      state = UnitsState(
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

  /// Append the next page using the filters from the last [loadFirstPage]
  /// call, for the property passed to that call.
  Future<void> loadNextPage() async {
    if (!state.hasNextPage || state.isLoadingMore) return;

    final clientId = _clientId;
    final propertyId = _propertyId;
    if (clientId == null || propertyId == null) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(unitApiProvider)
          .getUnits(
            clientId: clientId,
            propertyId: propertyId,
            page: nextPage,
            pageSize: _pageSize,
            search: _currentQuery.search,
            status: _currentQuery.status,
            blockId: _currentQuery.blockId,
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
