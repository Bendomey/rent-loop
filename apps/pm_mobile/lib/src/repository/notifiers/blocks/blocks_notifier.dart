import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';

part 'blocks_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Mirrors
/// UnitsQuery in units_notifier.dart.
class BlocksQuery {
  final String? search;
  final String?
  status; // full dotted API value (e.g. PropertyBlock.Status.Active), or null for "all"

  const BlocksQuery({this.search, this.status});

  BlocksQuery copyWith({
    String? search,
    String? status,
    bool clearSearch = false,
    bool clearStatus = false,
  }) {
    return BlocksQuery(
      search: clearSearch ? null : (search ?? this.search),
      status: clearStatus ? null : (status ?? this.status),
    );
  }
}

class BlocksState {
  const BlocksState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  final List<PropertyBlockModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  BlocksState copyWith({
    List<PropertyBlockModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return BlocksState(
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

/// Paginated list of a property's blocks — mirrors UnitsNotifier's shape,
/// used by blocks_list.dart. Distinct from propertyBlocksProvider (a plain
/// family FutureProvider used for cheap totals + the add-unit block picker).
@riverpod
class BlocksNotifier extends _$BlocksNotifier {
  static const int _pageSize = 10;

  String? _propertyId;
  BlocksQuery _currentQuery = const BlocksQuery();

  @override
  BlocksState build() => const BlocksState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<void> loadFirstPage(
    String propertyId, [
    BlocksQuery query = const BlocksQuery(),
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
          .read(propertyBlockApiProvider)
          .getBlocks(
            clientId: clientId,
            propertyId: propertyId,
            page: 1,
            pageSize: _pageSize,
            search: query.search,
            status: query.status,
          );
      state = BlocksState(
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
    final propertyId = _propertyId;
    if (clientId == null || propertyId == null) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(propertyBlockApiProvider)
          .getBlocks(
            clientId: clientId,
            propertyId: propertyId,
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
