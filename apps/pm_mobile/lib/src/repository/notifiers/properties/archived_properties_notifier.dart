import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';

part 'archived_properties_notifier.g.dart';

class ArchivedPropertiesState {
  final List<PropertyModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final String? error;

  const ArchivedPropertiesState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.error,
  });

  ArchivedPropertiesState copyWith({
    List<PropertyModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return ArchivedPropertiesState(
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

/// Mirrors PropertiesNotifier exactly, but always filters `archived: true`
/// — this is the "recycle bin" list reached from More → Organisation
/// settings → Archived properties.
@riverpod
class ArchivedPropertiesNotifier extends _$ArchivedPropertiesNotifier {
  static const int _pageSize = 10;

  String? _search;

  @override
  ArchivedPropertiesState build() => const ArchivedPropertiesState();

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<void> loadFirstPage({String? search}) async {
    _search = search;
    final clientId = _clientId;
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
            search: search,
            archived: true,
          );
      state = ArchivedPropertiesState(
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
          .read(propertyApiProvider)
          .getProperties(
            clientId: clientId,
            page: nextPage,
            pageSize: _pageSize,
            search: _search,
            archived: true,
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
