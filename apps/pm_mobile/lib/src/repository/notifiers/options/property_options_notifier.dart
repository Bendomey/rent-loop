import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

part 'property_options_notifier.g.dart';

@riverpod
class PropertyOptionsNotifier extends _$PropertyOptionsNotifier {
  late PagedOptionsController<PropertyModel> _controller;
  bool _disposed = false;
  int _generation = 0;

  @override
  OptionsState<PropertyModel> build({bool managerOnly = false}) {
    ref.watch(currentWorkspaceNotifierProvider);
    final generation = ++_generation;
    _disposed = false;
    ref.onDispose(() => _disposed = true);
    _controller = PagedOptionsController<PropertyModel>(
      fetch: _fetch,
      read: () => state,
      write: (value) => state = value,
      isDisposed: () => _disposed || generation != _generation,
      autoPage: managerOnly,
    );
    Future.microtask(_controller.loadFirstPage);
    return const OptionsState();
  }

  Future<OptionsPage<PropertyModel>> _fetch(int page, String search) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      return const OptionsPage(rows: [], hasNextPage: false);
    }
    final result = await ref
        .read(clientUserPropertyApiProvider)
        .getMyProperties(
          clientId: clientId,
          page: page,
          pageSize: optionsPageSize,
          search: search,
        );
    var rows = result.rows;
    if (managerOnly) {
      final roles = await ref.read(myPropertyRolesProvider.future);
      rows = [
        for (final p in rows)
          if (roles[p.id] == 'MANAGER') p,
      ];
    }
    return OptionsPage(rows: rows, hasNextPage: result.meta.hasNextPage);
  }

  void setSearch(String value) => _controller.setSearch(value);
  Future<void> loadNextPage() => _controller.loadNextPage();
  Future<void> refresh() => _controller.refresh();
}
