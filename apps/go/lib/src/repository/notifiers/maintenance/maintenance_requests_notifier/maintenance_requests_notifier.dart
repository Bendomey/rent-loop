import 'package:rentloop_go/src/api/maintenance.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';

part 'maintenance_requests_notifier.g.dart';

class MaintenanceRequestsState {
  final List<MaintenanceRequestModel> items;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  const MaintenanceRequestsState({
    this.items = const [],
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  MaintenanceRequestsState copyWith({
    List<MaintenanceRequestModel>? items,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return MaintenanceRequestsState(
      items: items ?? this.items,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      currentPage: currentPage ?? this.currentPage,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

@riverpod
class MaintenanceRequestsNotifier extends _$MaintenanceRequestsNotifier {
  static const int _pageSize = 20;

  MaintenanceRequestQuery _currentQuery = const MaintenanceRequestQuery();

  @override
  MaintenanceRequestsState build() => const MaintenanceRequestsState();

  String? get _leaseId => ref.read(currentLeaseNotifierProvider)?.id;

  /// Load page 1 with an optional [query]. Resets pagination state.
  /// Existing items are preserved during the load so the UI doesn't flash.
  Future<void> loadFirstPage([MaintenanceRequestQuery? query]) async {
    _currentQuery = (query ?? const MaintenanceRequestQuery()).copyWith(
      page: 1,
      pageSize: _pageSize,
    );
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final leaseId = _leaseId;
      if (leaseId == null) {
        state = state.copyWith(isLoading: false, items: []);
        return;
      }
      final result = await ref
          .read(maintenanceApiProvider)
          .getMaintenanceRequests(leaseId, _currentQuery);
      state = MaintenanceRequestsState(
        items: result.rows,
        hasNextPage: result.hasNextPage,
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

  /// Append the next page using the same filters as the last [loadFirstPage] call.
  Future<void> loadNextPage() async {
    if (!state.hasNextPage || state.isLoadingMore) return;

    final leaseId = _leaseId;
    if (leaseId == null) return;

    final nextPage = state.currentPage + 1;
    _currentQuery = _currentQuery.copyWith(page: nextPage);
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(maintenanceApiProvider)
          .getMaintenanceRequests(leaseId, _currentQuery);
      state = state.copyWith(
        items: [...state.items, ...result.rows],
        hasNextPage: result.hasNextPage,
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
