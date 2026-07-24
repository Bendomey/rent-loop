import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_requests_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Pagination
/// (page/pageSize/currentPage) is tracked separately in
/// [MaintenanceRequestsState], not here. Unlike PropertiesQuery/UnitsQuery,
/// this has no `status` field — status is the family key on the notifier
/// itself (one instance per board column), not a filter within one instance.
class MaintenanceRequestsQuery {
  final String? priorityLabel;
  final String? categoryLabel;
  final String? assignedWorkerId;
  final String? assignedManagerId;

  const MaintenanceRequestsQuery({
    this.priorityLabel,
    this.categoryLabel,
    this.assignedWorkerId,
    this.assignedManagerId,
  });

  MaintenanceRequestsQuery copyWith({
    String? priorityLabel,
    String? categoryLabel,
    String? assignedWorkerId,
    String? assignedManagerId,
    bool clearPriorityLabel = false,
    bool clearCategoryLabel = false,
    bool clearAssignedWorkerId = false,
    bool clearAssignedManagerId = false,
  }) {
    return MaintenanceRequestsQuery(
      priorityLabel: clearPriorityLabel
          ? null
          : (priorityLabel ?? this.priorityLabel),
      categoryLabel: clearCategoryLabel
          ? null
          : (categoryLabel ?? this.categoryLabel),
      assignedWorkerId: clearAssignedWorkerId
          ? null
          : (assignedWorkerId ?? this.assignedWorkerId),
      assignedManagerId: clearAssignedManagerId
          ? null
          : (assignedManagerId ?? this.assignedManagerId),
    );
  }
}

class MaintenanceRequestsState {
  final List<MaintenanceRequestModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  const MaintenanceRequestsState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  MaintenanceRequestsState copyWith({
    List<MaintenanceRequestModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return MaintenanceRequestsState(
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

/// One instance per status label (family, e.g.
/// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
/// holds 5 simultaneous instances, one per column, each independently
/// paginated. This mirrors web's 5 separate per-status infinite queries.
@riverpod
class MaintenanceRequestsNotifier extends _$MaintenanceRequestsNotifier {
  static const int _pageSize = 20;

  MaintenanceRequestsQuery _currentQuery = const MaintenanceRequestsQuery();

  @override
  MaintenanceRequestsState build(String statusLabel) =>
      const MaintenanceRequestsState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<void> loadFirstPage(MaintenanceRequestsQuery query) async {
    _currentQuery = query;
    final clientId = _clientId;
    if (clientId == null) {
      state = state.copyWith(isLoading: false, items: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await ref
          .read(maintenanceRequestApiProvider)
          .getMaintenanceRequests(
            clientId: clientId,
            statusLabel: statusLabel,
            page: 1,
            pageSize: _pageSize,
            priorityLabel: query.priorityLabel,
            categoryLabel: query.categoryLabel,
            assignedWorkerId: query.assignedWorkerId,
            assignedManagerId: query.assignedManagerId,
          );
      state = MaintenanceRequestsState(
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
          .read(maintenanceRequestApiProvider)
          .getMaintenanceRequests(
            clientId: clientId,
            statusLabel: statusLabel,
            page: nextPage,
            pageSize: _pageSize,
            priorityLabel: _currentQuery.priorityLabel,
            categoryLabel: _currentQuery.categoryLabel,
            assignedWorkerId: _currentQuery.assignedWorkerId,
            assignedManagerId: _currentQuery.assignedManagerId,
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
