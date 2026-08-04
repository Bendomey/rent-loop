import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

part 'tenant_applications_notifier.g.dart';

/// Filters carried across loadFirstPage/loadNextPage calls. Pagination
/// (page/currentPage) is tracked separately in [TenantApplicationsState], not
/// here. Unlike MaintenanceRequestsQuery, status is a filter within the single
/// list rather than a family key — there is one applications list, not one per
/// status column.
class TenantApplicationsQuery {
  final String? statusLabel;
  final String? gender;
  final String? maritalStatus;
  final List<String> propertyIds;
  final List<String> desiredUnitIds;
  final String? search;

  const TenantApplicationsQuery({
    this.statusLabel,
    this.gender,
    this.maritalStatus,
    this.propertyIds = const [],
    this.desiredUnitIds = const [],
    this.search,
  });

  TenantApplicationsQuery copyWith({
    String? statusLabel,
    String? gender,
    String? maritalStatus,
    List<String>? propertyIds,
    List<String>? desiredUnitIds,
    String? search,
    bool clearStatusLabel = false,
    bool clearGender = false,
    bool clearMaritalStatus = false,
    bool clearSearch = false,
  }) {
    return TenantApplicationsQuery(
      statusLabel: clearStatusLabel ? null : (statusLabel ?? this.statusLabel),
      gender: clearGender ? null : (gender ?? this.gender),
      maritalStatus: clearMaritalStatus
          ? null
          : (maritalStatus ?? this.maritalStatus),
      propertyIds: propertyIds ?? this.propertyIds,
      desiredUnitIds: desiredUnitIds ?? this.desiredUnitIds,
      search: clearSearch ? null : (search ?? this.search),
    );
  }
}

class TenantApplicationsState {
  final List<TenantApplicationModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  const TenantApplicationsState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  /// True only on the very first load — drives the shimmer skeleton, so a
  /// pull-to-refresh over existing rows never replaces them with skeletons.
  bool get isLoadingFirstPage => isLoading && items.isEmpty;

  TenantApplicationsState copyWith({
    List<TenantApplicationModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return TenantApplicationsState(
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
class TenantApplicationsNotifier extends _$TenantApplicationsNotifier {
  static const int _pageSize = 20;

  TenantApplicationsQuery _currentQuery = const TenantApplicationsQuery();

  @override
  TenantApplicationsState build() => const TenantApplicationsState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<void> loadFirstPage(TenantApplicationsQuery query) async {
    _currentQuery = query;
    final clientId = _clientId;
    if (clientId == null) {
      state = state.copyWith(isLoading: false, items: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await ref
          .read(tenantApplicationApiProvider)
          .getTenantApplications(
            clientId: clientId,
            page: 1,
            pageSize: _pageSize,
            statusLabel: query.statusLabel,
            gender: query.gender,
            maritalStatus: query.maritalStatus,
            propertyIds: query.propertyIds,
            desiredUnitIds: query.desiredUnitIds,
            search: query.search,
          );
      state = TenantApplicationsState(
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
    if (!state.hasNextPage || state.isLoadingMore || state.isLoading) return;

    final clientId = _clientId;
    if (clientId == null) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref
          .read(tenantApplicationApiProvider)
          .getTenantApplications(
            clientId: clientId,
            page: nextPage,
            pageSize: _pageSize,
            statusLabel: _currentQuery.statusLabel,
            gender: _currentQuery.gender,
            maritalStatus: _currentQuery.maritalStatus,
            propertyIds: _currentQuery.propertyIds,
            desiredUnitIds: _currentQuery.desiredUnitIds,
            search: _currentQuery.search,
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

  /// Re-runs the current filters — pull-to-refresh.
  Future<void> refresh() => loadFirstPage(_currentQuery);
}
