import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'create_property_notifier.g.dart';

class CreatePropertyState extends ApiState {
  CreatePropertyState({
    super.status,
    super.errorMessage,
    this.createdPropertyId,
  });
  final String? createdPropertyId;
}

/// Orchestrates the same 3-step sequence as the web wizard's server action:
/// create the property, always create a default "Main" block, and — only
/// for `type == 'SINGLE'` — a default draft unit. If a later step fails,
/// the property (and block) already exist server-side; no rollback is
/// attempted, matching web's own behavior. The property is left in a
/// valid, if unit-less, state recoverable via the existing Add Unit screen.
@riverpod
class CreatePropertyNotifier extends _$CreatePropertyNotifier {
  @override
  CreatePropertyState build() => CreatePropertyState();

  Future<void> submit({
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
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreatePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreatePropertyState(status: ApiStatus.pending);
    try {
      final property = await ref
          .read(propertyApiProvider)
          .createProperty(
            clientId: clientId,
            type: type,
            status: status,
            name: name,
            description: description,
            tags: tags,
            images: images,
            modes: modes,
            address: address,
            city: city,
            region: region,
            country: country,
            latitude: latitude,
            longitude: longitude,
            gpsAddress: gpsAddress,
          );

      final block = await ref
          .read(propertyBlockApiProvider)
          .createBlock(
            clientId: clientId,
            propertyId: property.id,
            name: 'Main',
            description: 'This is the main block for the property',
            images: images,
            status: _blockStatusFor(status),
          );

      if (type == 'SINGLE') {
        await ref
            .read(unitApiProvider)
            .createUnit(
              clientId: clientId,
              propertyId: property.id,
              blockId: block.id,
              name: name,
              description: description,
              images: images,
              type: 'HOUSE',
              status: 'Unit.Status.Draft',
              rentFee: 1000,
              rentFeeCurrency: 'GHS',
              paymentFrequency: 'MONTHLY',
              maxOccupantsAllowed: 1,
            );
      }

      state = CreatePropertyState(
        status: ApiStatus.success,
        createdPropertyId: property.id,
      );
    } on ApiException catch (e) {
      state = CreatePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreatePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CreatePropertyState();
}

String _blockStatusFor(String propertyStatus) => switch (propertyStatus) {
  'Property.Status.Active' => 'PropertyBlock.Status.Active',
  'Property.Status.Maintenance' => 'PropertyBlock.Status.Maintenance',
  'Property.Status.Inactive' => 'PropertyBlock.Status.Inactive',
  _ => 'PropertyBlock.Status.Active',
};
