import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/invoice_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

part 'bills_notifier.g.dart';

enum BillsView { owing, paid }

class BillsState {
  const BillsState({
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

  final List<InvoiceModel> items;
  final int total;
  final bool hasNextPage;
  final int currentPage;
  final bool isLoadingMore;
  final bool isLoading;
  final bool hasLoaded;
  final bool loadMoreFailed;
  final String? error;

  BillsState copyWith({
    List<InvoiceModel>? items,
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
    return BillsState(
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
class BillsNotifier extends _$BillsNotifier {
  static const int _pageSize = 20;

  String? _search;
  int _requestId = 0;
  bool _disposed = false;

  @override
  BillsState build(BillsView view, String? propertyId, {bool picker = false}) {
    _disposed = false;
    ref.onDispose(() => _disposed = true);
    Future.microtask(() => loadFirstPage(search: _search));
    return const BillsState();
  }

  String? get _clientId => ref.read(currentWorkspaceNotifierProvider)?.clientId;

  Future<InvoicesPage> _fetch(String clientId, int page) {
    final owing = view == BillsView.owing;
    return ref
        .read(invoiceApiProvider)
        .listInvoices(
          clientId: clientId,
          statuses: owing ? const ['ISSUED', 'PARTIALLY_PAID'] : const ['PAID'],
          propertyIds: propertyId == null ? null : [propertyId!],
          orderBy: owing ? 'invoices.due_date' : 'invoices.paid_at',
          order: owing ? 'asc' : 'desc',
          page: page,
          pageSize: _pageSize,
          search: _search,
        );
  }

  Future<void> loadFirstPage({String? search}) async {
    if (_disposed) return;
    final request = ++_requestId;
    _search = search;
    final clientId = _clientId;
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
      state = BillsState(
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

    final clientId = _clientId;
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
