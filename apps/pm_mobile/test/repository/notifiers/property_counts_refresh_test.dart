import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/create_block_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/delete_block_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/create_unit_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/delete_unit_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';

import '../../support/real_notifier_support.dart';

class _UnitApi extends UnitApi {
  _UnitApi() : super(tokenManager: fakeTokenManager());

  @override
  Future<UnitModel> createUnit({
    required String clientId,
    required String propertyId,
    required String blockId,
    required String name,
    String? description,
    List<String>? images,
    required String type,
    required String status,
    required int rentFee,
    required String rentFeeCurrency,
    required String paymentFrequency,
    required int maxOccupantsAllowed,
  }) async => UnitModel(
    id: 'u1',
    name: name,
    type: type,
    status: status,
    rentFee: rentFee,
    rentFeeCurrency: rentFeeCurrency,
  );

  @override
  Future<void> deleteUnit({
    required String clientId,
    required String propertyId,
    required String unitId,
  }) async {}
}

class _BlockApi extends PropertyBlockApi {
  _BlockApi() : super(tokenManager: fakeTokenManager());

  @override
  Future<PropertyBlockModel> createBlock({
    required String clientId,
    required String propertyId,
    required String name,
    String? description,
    List<String>? images,
    required String status,
  }) async =>
      PropertyBlockModel(id: 'b1', name: name, status: status, unitsCount: 0);

  @override
  Future<void> deleteBlock({
    required String clientId,
    required String propertyId,
    required String blockId,
  }) async {}
}

Future<void> _expectDetailRefetched(
  Future<void> Function(ProviderContainer c) act,
) async {
  var loads = 0;
  final container = ProviderContainer(
    overrides: [
      unitApiProvider.overrideWithValue(_UnitApi()),
      propertyBlockApiProvider.overrideWithValue(_BlockApi()),
      currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
      propertyDetailProvider('p1').overrideWith((ref) async {
        loads++;
        return PropertyModel(
          id: 'p1',
          name: 'Palm Court',
          type: 'MULTI',
          status: 'ACTIVE',
        );
      }),
    ],
  );
  addTearDown(container.dispose);
  container.listen(propertyDetailProvider('p1'), (_, _) {});
  await container.read(propertyDetailProvider('p1').future);
  expect(loads, 1);

  await act(container);
  await container.read(propertyDetailProvider('p1').future);

  expect(loads, 2);
}

void main() {
  test('creating a unit refetches the property so Units count updates', () {
    return _expectDetailRefetched(
      (c) => c
          .read(createUnitNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            blockId: 'b1',
            name: 'A1',
            type: 'APARTMENT',
            status: 'AVAILABLE',
            rentFee: 100,
            rentFeeCurrency: 'GHS',
            paymentFrequency: 'MONTHLY',
            maxOccupantsAllowed: 1,
          ),
    );
  });

  test('deleting a unit refetches the property', () {
    return _expectDetailRefetched(
      (c) => c
          .read(deleteUnitNotifierProvider.notifier)
          .submit(propertyId: 'p1', unitId: 'u1'),
    );
  });

  test('creating a block refetches the property so Blocks count updates', () {
    return _expectDetailRefetched(
      (c) => c
          .read(createBlockNotifierProvider.notifier)
          .submit(propertyId: 'p1', name: 'B', status: 'ACTIVE'),
    );
  });

  test('deleting a block refetches the property', () {
    return _expectDetailRefetched(
      (c) => c
          .read(deleteBlockNotifierProvider.notifier)
          .submit(propertyId: 'p1', blockId: 'b1'),
    );
  });
}
