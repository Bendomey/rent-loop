import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'update_unit_notifier.g.dart';

class UpdateUnitState extends ApiState {
  UpdateUnitState({super.status, super.errorMessage});
}

@riverpod
class UpdateUnitNotifier extends _$UpdateUnitNotifier {
  @override
  UpdateUnitState build() => UpdateUnitState();

  Future<void> submit({
    required String propertyId,
    required String unitId,
    String? name,
    String? description,
    List<String>? images,
    String? type,
    double? area,
    int? rentFee,
    String? rentFeeCurrency,
    String? paymentFrequency,
    int? maxOccupantsAllowed,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = UpdateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = UpdateUnitState(status: ApiStatus.pending);
    try {
      await ref
          .read(unitApiProvider)
          .updateUnit(
            clientId: clientId,
            propertyId: propertyId,
            unitId: unitId,
            name: name,
            description: description,
            images: images,
            type: type,
            area: area,
            rentFee: rentFee,
            rentFeeCurrency: rentFeeCurrency,
            paymentFrequency: paymentFrequency,
            maxOccupantsAllowed: maxOccupantsAllowed,
          );
      state = UpdateUnitState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = UpdateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = UpdateUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure (mirrors LoginNotifier.reset()).
  void reset() => state = UpdateUnitState();
}
