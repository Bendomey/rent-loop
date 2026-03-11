import 'package:rentloop_go/src/api/lease.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

part 'leases_provider.g.dart';

@riverpod
Future<List<LeaseModel>> leases(LeasesRef ref) async {
  final list = await ref.read(leaseApiProvider).getLeases();
  await ref.read(currentLeaseNotifierProvider.notifier).loadFromLeases(list);
  return list;
}
