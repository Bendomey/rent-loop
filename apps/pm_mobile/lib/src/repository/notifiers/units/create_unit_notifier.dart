import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'create_unit_notifier.g.dart';

class CreateUnitState extends ApiState {
  CreateUnitState({super.status, super.errorMessage});
}

@riverpod
class CreateUnitNotifier extends _$CreateUnitNotifier {
  @override
  CreateUnitState build() => CreateUnitState();

  Future<void> submit({
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
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateUnitState(status: ApiStatus.pending);
    try {
      await ref
          .read(unitApiProvider)
          .createUnit(
            clientId: clientId,
            propertyId: propertyId,
            blockId: blockId,
            name: name,
            description: description,
            images: images,
            type: type,
            status: status,
            rentFee: rentFee,
            rentFeeCurrency: rentFeeCurrency,
            paymentFrequency: paymentFrequency,
            maxOccupantsAllowed: maxOccupantsAllowed,
          );
      state = CreateUnitState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CreateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure — called when the user dismisses
  /// the error banner (mirrors LoginNotifier.reset()).
  void reset() => state = CreateUnitState();
}
