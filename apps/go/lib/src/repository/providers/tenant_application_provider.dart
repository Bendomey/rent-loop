import 'package:rentloop_go/src/api/tenant_application.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/tenant_application_model.dart';

part 'tenant_application_provider.g.dart';

@riverpod
Future<TenantApplicationModel> tenantApplication(
  TenantApplicationRef ref,
  String applicationId,
) async {
  return ref
      .read(tenantApplicationApiProvider)
      .getTenantApplication(applicationId);
}
