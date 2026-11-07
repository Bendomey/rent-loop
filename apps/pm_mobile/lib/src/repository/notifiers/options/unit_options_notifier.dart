import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';

part 'unit_options_notifier.g.dart';

const _bookable = {'Unit.Status.Available', 'Unit.Status.PartiallyOccupied'};

@immutable
class UnitOptionsQuery {
  const UnitOptionsQuery({
    this.propertyIds,
    this.blockId,
    this.bookableOnly = false,
  });

  final List<String>? propertyIds;
  final String? blockId;
  final bool bookableOnly;

  @override
  bool operator ==(Object other) =>
      other is UnitOptionsQuery &&
      other.blockId == blockId &&
      other.bookableOnly == bookableOnly &&
      listEquals(other.propertyIds, propertyIds);

  @override
  int get hashCode => Object.hash(
    blockId,
    bookableOnly,
    propertyIds == null ? null : Object.hashAll(propertyIds!),
  );
}

@riverpod
class UnitOptionsNotifier extends _$UnitOptionsNotifier {
  late PagedOptionsController<UnitModel> _controller;
  bool _disposed = false;
  int _generation = 0;

  @override
  OptionsState<UnitModel> build(UnitOptionsQuery query) {
    ref.watch(currentWorkspaceNotifierProvider);
    final generation = ++_generation;
    _disposed = false;
    ref.onDispose(() => _disposed = true);
    _controller = PagedOptionsController<UnitModel>(
      fetch: _fetch,
      read: () => state,
      write: (value) => state = value,
      isDisposed: () => _disposed || generation != _generation,
      autoPage: query.bookableOnly,
    );
    Future.microtask(_controller.loadFirstPage);
    return const OptionsState();
  }

  Future<OptionsPage<UnitModel>> _fetch(int page, String search) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      return const OptionsPage(rows: [], hasNextPage: false);
    }
    final result = await ref
        .read(unitApiProvider)
        .getUnitsPageAcrossProperties(
          clientId: clientId,
          propertyIds: query.propertyIds,
          blockId: query.blockId,
          page: page,
          pageSize: optionsPageSize,
          search: search,
        );
    final rows = query.bookableOnly
        ? result.rows.where((u) => _bookable.contains(u.status)).toList()
        : result.rows;
    return OptionsPage(rows: rows, hasNextPage: result.meta.hasNextPage);
  }

  void setSearch(String value) => _controller.setSearch(value);
  Future<void> loadNextPage() => _controller.loadNextPage();
  Future<void> refresh() => _controller.refresh();
}
