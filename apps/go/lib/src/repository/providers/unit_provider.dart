import 'package:rentloop_go/src/api/unit.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/unit_model.dart';

part 'unit_provider.g.dart';

@riverpod
Future<UnitModel> unit(UnitRef ref, String unitId) async {
  return ref.read(unitApiProvider).getUnit(unitId);
}
