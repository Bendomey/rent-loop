import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_assignees_notifier.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _FakeApi extends ClientUserPropertyApi {
  _FakeApi() : super(tokenManager: TokenManager(_NoStorage()));

  final Map<String, Completer<List<MaintenanceAssigneeModel>>> pending = {};
  final List<String> started = [];
  final Set<String> failing = {};

  @override
  Future<List<MaintenanceAssigneeModel>> getClientUserProperties({
    required String clientId,
    required String propertyId,
  }) {
    started.add(propertyId);
    if (failing.contains(propertyId)) {
      return Future.error(Exception('boom'));
    }
    final completer = Completer<List<MaintenanceAssigneeModel>>();
    pending[propertyId] = completer;
    return completer.future;
  }
}

class _SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

ProviderContainer _container(_FakeApi api) {
  final container = ProviderContainer(
    overrides: [
      clientUserPropertyApiProvider.overrideWithValue(api),
      currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
    ],
  );
  addTearDown(container.dispose);
  container.listen(maintenanceAssigneesNotifierProvider, (_, __) {});
  return container;
}

void main() {
  test('assignee calls run in parallel', () async {
    final api = _FakeApi();
    final container = _container(api);
    final notifier = container.read(
      maintenanceAssigneesNotifierProvider.notifier,
    );

    final done = notifier.ensurePropertiesLoaded(['p1', 'p2', 'p3']);
    await Future<void>.delayed(Duration.zero);

    expect(api.started, ['p1', 'p2', 'p3']);

    api.pending['p3']!.complete([
      const MaintenanceAssigneeModel(id: 'a3', name: 'Cara'),
    ]);
    api.pending['p2']!.complete([
      const MaintenanceAssigneeModel(id: 'a2', name: 'Bo'),
    ]);
    api.pending['p1']!.complete([
      const MaintenanceAssigneeModel(id: 'a1', name: 'Al'),
    ]);
    await done;

    final ids = container
        .read(maintenanceAssigneesNotifierProvider)
        .map((p) => p.id)
        .toSet();
    expect(ids, {'a1', 'a2', 'a3'});
  });

  test('one failing property does not block the others', () async {
    final api = _FakeApi()..failing.add('p1');
    final container = _container(api);
    final notifier = container.read(
      maintenanceAssigneesNotifierProvider.notifier,
    );

    final done = notifier.ensurePropertiesLoaded(['p1', 'p2']);
    await Future<void>.delayed(Duration.zero);
    api.pending['p2']!.complete([
      const MaintenanceAssigneeModel(id: 'a2', name: 'Bo'),
    ]);
    await done;

    expect(
      container.read(maintenanceAssigneesNotifierProvider).map((p) => p.id),
      ['a2'],
    );
  });

  test('a second call waits for properties already in flight', () async {
    final api = _FakeApi();
    final container = _container(api);
    final notifier = container.read(
      maintenanceAssigneesNotifierProvider.notifier,
    );

    final first = notifier.ensurePropertiesLoaded(['p1']);
    await Future<void>.delayed(Duration.zero);
    var secondDone = false;
    final second = notifier
        .ensurePropertiesLoaded(['p1'])
        .then((_) => secondDone = true);
    await Future<void>.delayed(Duration.zero);
    expect(secondDone, isFalse);

    api.pending['p1']!.complete([
      const MaintenanceAssigneeModel(id: 'a1', name: 'Al'),
    ]);
    await Future.wait([first, second]);

    expect(api.started, ['p1']);
    expect(container.read(maintenanceAssigneesNotifierProvider), hasLength(1));
  });
}
