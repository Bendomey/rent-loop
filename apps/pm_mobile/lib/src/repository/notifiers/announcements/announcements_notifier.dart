import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/announcement_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'announcements_notifier.g.dart';

class AnnouncementsState {
  const AnnouncementsState({
    this.items = const [],
    this.total = 0,
    this.hasNextPage = false,
    this.currentPage = 1,
    this.isLoadingMore = false,
    this.isLoading = false,
    this.hasLoaded = false,
    this.loadMoreFailed = false,
    this.error,
  });

  final List<AnnouncementModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final bool hasLoaded;
  final bool loadMoreFailed;
  final String? error;

  AnnouncementsState copyWith({
    List<AnnouncementModel>? items,
    int? total,
    bool? hasNextPage,
    int? currentPage,
    bool? isLoadingMore,
    bool? isLoading,
    bool? hasLoaded,
    bool? loadMoreFailed,
    String? error,
    bool clearError = false,
  }) {
    return AnnouncementsState(
      items: items ?? this.items,
      total: total ?? this.total,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      currentPage: currentPage ?? this.currentPage,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isLoading: isLoading ?? this.isLoading,
      hasLoaded: hasLoaded ?? this.hasLoaded,
      loadMoreFailed: loadMoreFailed ?? this.loadMoreFailed,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

@riverpod
class AnnouncementsNotifier extends _$AnnouncementsNotifier {
  static const int _pageSize = 20;

  int _requestId = 0;
  bool _disposed = false;

  @override
  AnnouncementsState build(String? propertyId) {
    _disposed = false;
    ref.onDispose(() => _disposed = true);
    Future.microtask(loadFirstPage);
    return const AnnouncementsState();
  }

  Future<AnnouncementsPage> _fetch(String clientId, int page) {
    return ref
        .read(announcementApiProvider)
        .listAnnouncements(
          clientId: clientId,
          propertyId: propertyId,
          page: page,
          pageSize: _pageSize,
        );
  }

  Future<void> loadFirstPage() async {
    if (_disposed) return;
    final request = ++_requestId;
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = state.copyWith(
        isLoading: false,
        hasLoaded: true,
        loadMoreFailed: false,
        items: [],
      );
      return;
    }

    state = state.copyWith(
      isLoading: true,
      isLoadingMore: false,
      loadMoreFailed: false,
      clearError: true,
    );
    try {
      final result = await _fetch(clientId, 1);
      if (_disposed || request != _requestId) return;
      state = AnnouncementsState(
        items: result.rows,
        total: result.meta.total,
        hasNextPage: result.meta.hasNextPage,
        currentPage: 1,
        hasLoaded: true,
      );
    } on ApiException catch (e) {
      if (_disposed || request != _requestId) return;
      state = state.copyWith(
        isLoading: false,
        hasLoaded: true,
        loadMoreFailed: false,
        error: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      if (_disposed || request != _requestId) return;
      state = state.copyWith(
        isLoading: false,
        hasLoaded: true,
        loadMoreFailed: false,
        error: translateApiErrorMessage(),
      );
    }
  }

  Future<void> loadNextPage() async {
    if (!state.hasNextPage || state.isLoadingMore) return;

    final clientId = workspaceClientId(ref);
    if (clientId == null) return;

    final nextPage = state.currentPage + 1;
    final request = _requestId;
    state = state.copyWith(isLoadingMore: true, loadMoreFailed: false);
    try {
      final result = await _fetch(clientId, nextPage);
      if (_disposed || request != _requestId) return;
      state = state.copyWith(
        items: [...state.items, ...result.rows],
        total: result.meta.total,
        hasNextPage: result.meta.hasNextPage,
        currentPage: nextPage,
        isLoadingMore: false,
      );
    } catch (_) {
      if (_disposed || request != _requestId) return;
      state = state.copyWith(isLoadingMore: false, loadMoreFailed: true);
    }
  }
}
