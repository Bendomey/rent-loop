import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/lease_id_manager.dart';

part 'lease_id_manager.g.dart';

@riverpod
LeaseIdManager leaseIdManager(LeaseIdManagerRef ref) {
  final storage = ref.watch(secureStorageProvider);
  return LeaseIdManager(storage);
}
