import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';

part 'block_options_notifier.g.dart';

@riverpod
class BlockOptionsNotifier extends _$BlockOptionsNotifier {
  late PagedOptionsController<PropertyBlockModel> _controller;
  bool _disposed = false;
  int _generation = 0;

  @override
  OptionsState<PropertyBlockModel> build(String propertyId) {
    ref.watch(currentWorkspaceNotifierProvider);
    final generation = ++_generation;
    _disposed = false;
    ref.onDispose(() => _disposed = true);
    _controller = PagedOptionsController<PropertyBlockModel>(
      fetch: _fetch,
      read: () => state,
      write: (value) => state = value,
      isDisposed: () => _disposed || generation != _generation,
    );
    Future.microtask(_controller.loadFirstPage);
    return const OptionsState();
  }

  Future<OptionsPage<PropertyBlockModel>> _fetch(
    int page,
    String search,
  ) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      return const OptionsPage(rows: [], hasNextPage: false);
    }
    final result = await ref
        .read(propertyBlockApiProvider)
        .getBlocks(
          clientId: clientId,
          propertyId: propertyId,
          page: page,
          pageSize: optionsPageSize,
          search: search,
        );
    return OptionsPage(rows: result.rows, hasNextPage: result.meta.hasNextPage);
  }

  void setSearch(String value) => _controller.setSearch(value);
  Future<void> loadNextPage() => _controller.loadNextPage();
  Future<void> refresh() => _controller.refresh();
}
