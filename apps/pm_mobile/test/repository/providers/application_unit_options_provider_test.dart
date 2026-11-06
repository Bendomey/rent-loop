import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_unit_options_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

UnitModel _unit(String id, String status, String propertyId) => UnitModel(
  id: id,
  name: id,
  type: 'Unit.Type.Apartment',
  status: status,
  rentFee: 1,
  rentFeeCurrency: 'GHS',
  propertyId: propertyId,
);

class _FakeUnitApi extends UnitApi {
  _FakeUnitApi(this.rows) : super(tokenManager: TokenManager(_NoStorage()));

  final List<UnitModel> rows;
  final calls = <List<String>?>[];

  @override
  Future<List<UnitModel>> getUnitsAcrossProperties({
    required String clientId,
    List<String>? propertyIds,
  }) async {
    calls.add(propertyIds);
    return rows;
  }
}

class _SignedIn extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

ProviderContainer _container(_FakeUnitApi api, Map<String, String> roles) {
  final container = ProviderContainer(
    overrides: [
      unitApiProvider.overrideWithValue(api),
      currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
      myPropertyRolesProvider.overrideWith((ref) async => roles),
    ],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  const available = 'Unit.Status.Available';
  const partial = 'Unit.Status.PartiallyOccupied';
  const occupied = 'Unit.Status.Occupied';

  test('asks only for managed properties and drops occupied units', () async {
    final api = _FakeUnitApi([
      _unit('u1', available, 'p1'),
      _unit('u2', partial, 'p1'),
      _unit('u3', occupied, 'p1'),
    ]);
    final container = _container(api, {'p1': 'MANAGER', 'p2': 'STAFF'});

    final units = await container.read(
      applicationUnitOptionsProvider(null).future,
    );

    expect(api.calls, [
      ['p1'],
    ]);
    expect(units.map((u) => u.id), ['u1', 'u2']);
  });

  test('a property id narrows to that property when managed', () async {
    final api = _FakeUnitApi([_unit('u1', available, 'p2')]);
    final container = _container(api, {'p1': 'MANAGER', 'p2': 'MANAGER'});

    await container.read(applicationUnitOptionsProvider('p2').future);

    expect(api.calls, [
      ['p2'],
    ]);
  });

  test('a property id the caller does not manage yields nothing', () async {
    final api = _FakeUnitApi([_unit('u1', available, 'p2')]);
    final container = _container(api, {'p1': 'MANAGER', 'p2': 'STAFF'});

    final units = await container.read(
      applicationUnitOptionsProvider('p2').future,
    );

    expect(units, isEmpty);
    expect(api.calls, isEmpty);
  });

  test('managing nothing makes no units call', () async {
    final api = _FakeUnitApi([_unit('u1', available, 'p2')]);
    final container = _container(api, {'p2': 'STAFF'});

    final units = await container.read(
      applicationUnitOptionsProvider(null).future,
    );

    expect(units, isEmpty);
    expect(api.calls, isEmpty);
  });
}
