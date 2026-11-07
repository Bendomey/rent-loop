import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';

class OptionsState<T> {
  const OptionsState({
    this.items = const [],
    this.hasLoaded = false,
    this.isLoading = false,
    this.hasNextPage = false,
    this.loadMoreFailed = false,
    this.isLoadingMore = false,
    this.error,
    this.search = '',
  });

  final List<T> items;
  final bool hasLoaded;
  final bool isLoading;
  final bool hasNextPage;
  final bool loadMoreFailed;
  final bool isLoadingMore;
  final String? error;
  final String search;

  OptionsState<T> copyWith({
    List<T>? items,
    bool? hasLoaded,
    bool? isLoading,
    bool? hasNextPage,
    bool? loadMoreFailed,
    bool? isLoadingMore,
    String? error,
    String? search,
    bool clearError = false,
  }) {
    return OptionsState<T>(
      items: items ?? this.items,
      hasLoaded: hasLoaded ?? this.hasLoaded,
      isLoading: isLoading ?? this.isLoading,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      loadMoreFailed: loadMoreFailed ?? this.loadMoreFailed,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      search: search ?? this.search,
    );
  }
}

class OptionsPage<T> {
  const OptionsPage({required this.rows, required this.hasNextPage});

  final List<T> rows;
  final bool hasNextPage;
}

const optionsPageSize = 20;
const _minVisibleRows = 8;
const _maxAutoPages = 5;

/// Paging logic shared by the three options notifiers. [fetch] returns one
/// server page already reduced to what the phone will show, so a page can come
/// back short; the controller then keeps paging until enough rows are visible.
class PagedOptionsController<T> {
  PagedOptionsController({
    required this.fetch,
    required this.read,
    required this.write,
    required this.isDisposed,
    this.autoPage = false,
  });

  final Future<OptionsPage<T>> Function(int page, String search) fetch;
  final OptionsState<T> Function() read;
  final void Function(OptionsState<T>) write;
  final bool Function() isDisposed;

  /// Set when [fetch] drops rows, so a short page triggers another request.
  final bool autoPage;

  int _requestId = 0;
  int _page = 0;
  bool _loadingMore = false;

  Future<void> loadFirstPage() async {
    if (isDisposed()) return;
    final request = ++_requestId;
    _loadingMore = false;
    final search = read().search;
    write(
      read().copyWith(isLoading: true, loadMoreFailed: false, clearError: true),
    );
    try {
      final result = await _collect(1, search, const [], request);
      if (result == null) return;
      _page = result.page;
      write(
        OptionsState<T>(
          items: result.items,
          hasNextPage: result.hasNextPage,
          hasLoaded: true,
          search: search,
        ),
      );
    } catch (e) {
      if (isDisposed() || request != _requestId) return;
      write(
        read().copyWith(
          items: const [],
          isLoading: false,
          hasLoaded: true,
          hasNextPage: false,
          error: e is ApiException
              ? translateApiErrorMessage(errorMessage: e.message)
              : translateApiErrorMessage(),
        ),
      );
    }
  }

  Future<void> loadNextPage() async {
    final current = read();
    if (!current.hasNextPage || current.isLoading || _loadingMore) return;
    final request = _requestId;
    _loadingMore = true;
    write(current.copyWith(loadMoreFailed: false, isLoadingMore: true));
    try {
      final result = await _collect(
        _page + 1,
        current.search,
        current.items,
        request,
      );
      if (result == null) return;
      _page = result.page;
      write(
        read().copyWith(
          items: result.items,
          hasNextPage: result.hasNextPage,
          isLoadingMore: false,
        ),
      );
    } catch (_) {
      if (isDisposed() || request != _requestId) return;
      write(read().copyWith(loadMoreFailed: true, isLoadingMore: false));
    } finally {
      if (request == _requestId) _loadingMore = false;
    }
  }

  void setSearch(String value) {
    final term = value.trim();
    if (term == read().search) return;
    write(read().copyWith(search: term));
    loadFirstPage();
  }

  Future<void> refresh() => loadFirstPage();

  Future<({List<T> items, bool hasNextPage, int page})?> _collect(
    int startPage,
    String search,
    List<T> existing,
    int request,
  ) async {
    final items = [...existing];
    var page = startPage - 1;
    var visible = 0;
    var hasNext = true;
    for (var fetched = 0; fetched < _maxAutoPages && hasNext; fetched++) {
      page++;
      final result = await fetch(page, search);
      if (isDisposed() || request != _requestId) return null;
      items.addAll(result.rows);
      visible += result.rows.length;
      hasNext = result.hasNextPage;
      if (!autoPage || visible >= _minVisibleRows) break;
    }
    return (items: items, hasNextPage: hasNext, page: page);
  }
}
