import 'package:rentloop_go/src/api/maintenance.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';

part 'maintenance_request_provider.g.dart';

@riverpod
Future<MaintenanceRequestModel> maintenanceRequest(
  MaintenanceRequestRef ref,
  String leaseId,
  String id,
) async {
  return ref.read(maintenanceApiProvider).getMaintenanceRequest(leaseId, id);
}
