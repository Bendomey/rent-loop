import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_filter_options_provider.dart';
import 'package:rentloop_manager/src/repository/providers/activity/repair_form_options_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

PaginationMetaModel _meta() => PaginationMetaModel(
  total: 1,
  page: 1,
  pageSize: 200,
  hasNextPage: false,
  hasPreviousPage: false,
);

class _BlockApi extends PropertyBlockApi {
  _BlockApi() : super(tokenManager: TokenManager(_NoStorage()));

  final calls = <(String, int)>[];

  @override
  Future<PropertyBlocksPage> getBlocks({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 100,
    String? status,
    String? search,
  }) async {
    calls.add((propertyId, pageSize));
    return PropertyBlocksPage(
      rows: [
        PropertyBlockModel(
          id: 'b1',
          name: 'Block A',
          status: 'ACTIVE',
          unitsCount: 2,
        ),
      ],
      meta: _meta(),
    );
  }
}

class _UnitApi extends UnitApi {
  _UnitApi() : super(tokenManager: TokenManager(_NoStorage()));

  final calls = <(String, int, String?)>[];

  @override
  Future<UnitsPage> getUnits({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? blockId,
  }) async {
    calls.add((propertyId, pageSize, status));
    return UnitsPage(
      rows: [
        UnitModel(
          id: 'u1',
          name: 'U1',
          type: 'Unit.Type.Apartment',
          status: 'Unit.Status.Occupied',
          rentFee: 1,
          rentFeeCurrency: 'GHS',
          propertyId: propertyId,
        ),
      ],
      meta: _meta(),
    );
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

PropertyModel _property(String id) => PropertyModel(
  id: id,
  name: id,
  type: 'Property.Type.Apartment',
  status: 'ACTIVE',
);

void main() {
  test('repairPropertyOptions keeps only MANAGER properties', () async {
    final container = ProviderContainer(
      overrides: [
        activityFilterPropertiesProvider.overrideWith(
          (ref) async => [_property('p1'), _property('p2')],
        ),
        myPropertyRolesProvider.overrideWith(
          (ref) async => {'p1': 'MANAGER', 'p2': 'STAFF'},
        ),
      ],
    );
    addTearDown(container.dispose);

    final options = await container.read(repairPropertyOptionsProvider.future);

    expect(options.map((p) => p.id), ['p1']);
  });

  test('repairAssetOptions loads blocks and units for one property', () async {
    final blocks = _BlockApi();
    final units = _UnitApi();
    final container = ProviderContainer(
      overrides: [
        propertyBlockApiProvider.overrideWithValue(blocks),
        unitApiProvider.overrideWithValue(units),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
      ],
    );
    addTearDown(container.dispose);

    final assets = await container.read(
      repairAssetOptionsProvider('p1').future,
    );

    expect(blocks.calls, [('p1', 200)]);
    expect(units.calls, [('p1', 200, null)]);
    expect(assets.blocks.single.id, 'b1');
    expect(assets.units.single.id, 'u1');
  });
}
