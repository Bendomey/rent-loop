import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/property_roles.dart';

void main() {
  test('only a MANAGER role on that property can manage it', () {
    expect(canManageProperty({'p1': 'MANAGER'}, 'p1'), isTrue);
    expect(canManageProperty({'p1': 'STAFF'}, 'p1'), isFalse);
    expect(canManageProperty({'p1': 'MANAGER'}, 'p2'), isFalse);
  });

  test('is false while roles are loading or the property is unknown', () {
    expect(canManageProperty(null, 'p1'), isFalse);
    expect(canManageProperty({'p1': 'MANAGER'}, null), isFalse);
  });
}
