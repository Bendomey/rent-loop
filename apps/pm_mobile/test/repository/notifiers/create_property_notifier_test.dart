import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/create_property_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

final _tm = TokenManager(_NoStorage());

class _PropertyApi extends PropertyApi {
  _PropertyApi() : super(tokenManager: _tm);

  @override
  Future<PropertyModel> createProperty({
    required String clientId,
    required String type,
    required String status,
    required String name,
    String? description,
    List<String>? tags,
    List<String>? images,
    required List<String> modes,
    required String address,
    required String city,
    required String region,
    required String country,
    required double latitude,
    required double longitude,
    String? gpsAddress,
  }) async => PropertyModel(id: 'new', name: name, type: type, status: status);
}

class _BlockApi extends PropertyBlockApi {
  _BlockApi() : super(tokenManager: _tm);

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

void main() {
  test('creating a property refetches the roles', () async {
    var roleFetches = 0;
    final container = ProviderContainer(
      overrides: [
        propertyApiProvider.overrideWithValue(_PropertyApi()),
        propertyBlockApiProvider.overrideWithValue(_BlockApi()),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        myPropertyRolesProvider.overrideWith((ref) async {
          roleFetches++;
          return {};
        }),
      ],
    );
    addTearDown(container.dispose);
    container.listen(myPropertyRolesProvider, (_, __) {});
    await container.read(myPropertyRolesProvider.future);
    expect(roleFetches, 1);

    await container
        .read(createPropertyNotifierProvider.notifier)
        .submit(
          type: 'MULTI',
          status: 'Property.Status.Active',
          name: 'Oak',
          modes: const ['RENTAL'],
          address: 'a',
          city: 'c',
          region: 'r',
          country: 'GH',
          latitude: 0,
          longitude: 0,
        );
    await container.read(myPropertyRolesProvider.future);

    expect(
      container.read(createPropertyNotifierProvider).status,
      ApiStatus.success,
    );
    expect(roleFetches, 2);
  });
}
