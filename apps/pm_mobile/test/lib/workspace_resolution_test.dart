import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/workspace_resolution.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';

ClientUserModel _cu(String clientId, String status) => ClientUserModel(
  id: 'cu-$clientId',
  clientId: clientId,
  role: 'STAFF',
  status: status,
);

void main() {
  group('resolveWorkspace', () {
    test('auto-selects the single active membership', () {
      final result = resolveWorkspace([
        _cu('a', 'ClientUser.Status.Active'),
        _cu('b', 'ClientUser.Status.Deactivated'),
      ]);
      expect(result?.clientId, 'a');
    });

    test('returns null when there are zero active memberships', () {
      final result = resolveWorkspace([
        _cu('a', 'ClientUser.Status.Deactivated'),
      ]);
      expect(result, isNull);
    });

    test(
      'does not misclassify "Inactive" as active (no substring collision)',
      () {
        final result = resolveWorkspace([
          _cu('a', 'ClientUser.Status.Inactive'),
        ]);
        expect(result, isNull);
      },
    );

    test('returns null with multiple active memberships and no stored id', () {
      final result = resolveWorkspace([
        _cu('a', 'ClientUser.Status.Active'),
        _cu('b', 'ClientUser.Status.Active'),
      ]);
      expect(result, isNull);
    });

    test(
      'restores the stored client id when it matches an active membership',
      () {
        final result = resolveWorkspace([
          _cu('a', 'ClientUser.Status.Active'),
          _cu('b', 'ClientUser.Status.Active'),
        ], storedClientId: 'b');
        expect(result?.clientId, 'b');
      },
    );

    test('ignores a stored id that no longer matches an active membership', () {
      final result = resolveWorkspace([
        _cu('a', 'ClientUser.Status.Active'),
        _cu('b', 'ClientUser.Status.Active'),
      ], storedClientId: 'c');
      expect(result, isNull);
    });

    test('returns null for an empty list', () {
      expect(resolveWorkspace(const []), isNull);
    });
  });
}
