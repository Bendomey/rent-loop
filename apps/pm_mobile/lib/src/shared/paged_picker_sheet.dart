import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _searchDebounce = Duration(milliseconds: 300);
const _loadMoreThreshold = 200.0;

/// Single mode resolves to a one-item list on tap; multi mode resolves to every
/// ticked item, including ones no longer in the current results, on Done.
Future<List<T>?> showPagedPickerSheet<T>({
  required BuildContext context,
  required String title,
  required ProviderListenable<OptionsState<T>> state,
  required void Function(String) onSearch,
  required VoidCallback onLoadMore,
  VoidCallback? onRetry,
  required String Function(T) label,
  String Function(T)? sub,
  required String Function(T) id,
  bool multi = false,
  List<T> initial = const [],
  String emptyText = 'Nothing found',
}) {
  return showModalBottomSheet<List<T>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _PagedPickerSheet<T>(
      title: title,
      state: state,
      onSearch: onSearch,
      onLoadMore: onLoadMore,
      onRetry: onRetry,
      label: label,
      sub: sub,
      id: id,
      multi: multi,
      initial: initial,
      emptyText: emptyText,
    ),
  );
}

class _PagedPickerSheet<T> extends ConsumerStatefulWidget {
  const _PagedPickerSheet({
    required this.title,
    required this.state,
    required this.onSearch,
    required this.onLoadMore,
    required this.onRetry,
    required this.label,
    required this.sub,
    required this.id,
    required this.multi,
    required this.initial,
    required this.emptyText,
  });

  final String title;
  final ProviderListenable<OptionsState<T>> state;
  final void Function(String) onSearch;
  final VoidCallback onLoadMore;
  final VoidCallback? onRetry;
  final String Function(T) label;
  final String Function(T)? sub;
  final String Function(T) id;
  final bool multi;
  final List<T> initial;
  final String emptyText;

  @override
  ConsumerState<_PagedPickerSheet<T>> createState() =>
      _PagedPickerSheetState<T>();
}

class _PagedPickerSheetState<T> extends ConsumerState<_PagedPickerSheet<T>> {
  final _search = TextEditingController();
  final _scroll = ScrollController();
  late final Map<String, T> _picked = {
    for (final item in widget.initial) widget.id(item): item,
  };
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_maybeLoadMore);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _maybeLoadMore() {
    if (!_scroll.hasClients || ref.read(widget.state).loadMoreFailed) return;
    final position = _scroll.position;
    if (position.maxScrollExtent - position.pixels <= _loadMoreThreshold) {
      widget.onLoadMore();
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(_searchDebounce, () => widget.onSearch(value));
  }

  void _tap(T item) {
    if (!widget.multi) {
      Navigator.of(context).pop(<T>[item]);
      return;
    }
    final key = widget.id(item);
    setState(() {
      if (_picked.remove(key) == null) _picked[key] = item;
    });
  }

  @override
  Widget build(BuildContext context) {
    final options = ref.watch(widget.state);
    final media = MediaQuery.of(context);
    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: Container(
        height: media.size.height * 0.7,
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(RLTokens.rXl),
          ),
          boxShadow: RLTokens.elevSheet,
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontWeight: RLTokens.headingWeight,
                        fontSize: 20,
                        color: RLTokens.ink,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  if (widget.multi && _picked.isNotEmpty)
                    TextButton(
                      onPressed: () => setState(_picked.clear),
                      child: const Text('Clear'),
                    ),
                  RLIconBtn(
                    icon: Icons.close,
                    bg: RLTokens.fill,
                    iconColor: RLTokens.inkSoft,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
              child: RLSearchBar(
                hint: 'Search',
                controller: _search,
                onChanged: _onSearchChanged,
              ),
            ),
            Expanded(child: _body(options)),
            if (widget.multi)
              Padding(
                padding: EdgeInsets.fromLTRB(
                  20,
                  10,
                  20,
                  20 + media.padding.bottom,
                ),
                child: RLBtn(
                  label: 'Done (${_picked.length})',
                  full: true,
                  onPressed: () =>
                      Navigator.of(context).pop(_picked.values.toList()),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _body(OptionsState<T> options) {
    if (!options.hasLoaded) return const _SkeletonRows(count: 6);
    if (options.items.isEmpty && options.hasNextPage && options.error == null) {
      return options.isLoadingMore
          ? const _SkeletonRows(count: 3)
          : Center(
              child: TextButton(
                onPressed: widget.onLoadMore,
                child: const Text('Load more'),
              ),
            );
    }
    if (options.items.isEmpty) {
      final retry = options.error != null ? widget.onRetry : null;
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                options.error ?? widget.emptyText,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14,
                  color: RLTokens.muted,
                ),
              ),
              if (retry != null)
                TextButton(onPressed: retry, child: const Text('Try again')),
            ],
          ),
        ),
      );
    }
    final footer = options.loadMoreFailed || options.hasNextPage;
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 20),
      itemCount: options.items.length + (footer ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == options.items.length) {
          if (options.loadMoreFailed) {
            return _LoadMoreFailed(onRetry: widget.onLoadMore);
          }
          if (options.isLoadingMore) {
            return const _SkeletonRows(count: 1, scrollable: false);
          }
          return Center(
            child: TextButton(
              onPressed: widget.onLoadMore,
              child: const Text('Load more'),
            ),
          );
        }
        final item = options.items[index];
        final selected = _picked.containsKey(widget.id(item));
        return _Row(
          label: widget.label(item),
          sub: widget.sub?.call(item),
          selected: selected,
          isLast: index == options.items.length - 1 && !footer,
          onTap: () => _tap(item),
        );
      },
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.label,
    required this.sub,
    required this.selected,
    required this.isLast,
    required this.onTap,
  });

  final String label;
  final String? sub;
  final bool selected;
  final bool isLast;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 8),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      fontWeight: selected ? RLTokens.bold : RLTokens.medium,
                      color: RLTokens.ink,
                    ),
                  ),
                  if (sub != null && sub!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      sub!,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (selected)
              const Icon(
                Icons.check_rounded,
                size: 18,
                color: RLTokens.crimson,
              ),
          ],
        ),
      ),
    );
  }
}

class _LoadMoreFailed extends StatelessWidget {
  const _LoadMoreFailed({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            "Couldn't load more.",
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    );
  }
}

class _SkeletonRows extends StatelessWidget {
  const _SkeletonRows({required this.count, this.scrollable = true});

  final int count;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    final rows = [
      for (var i = 0; i < count; i++)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
          child: Container(
            height: 18,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
            ),
          ),
        ),
    ];
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: scrollable
          ? ListView(
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(14, 4, 14, 20),
              children: rows,
            )
          : Column(children: rows),
    );
  }
}
