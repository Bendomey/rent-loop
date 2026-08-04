import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

/// In-memory stand-in so these tests need no platform channels.
class _FakeStorage extends Storage {
  final Map<String, String> values = {};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async => values[key] = value;

  @override
  Future<void> delete(String key) async => values.remove(key);
}

void main() {
  group('TokenManager', () {
    test('stores access and refresh tokens under separate keys', () async {
      final storage = _FakeStorage();
      final manager = TokenManager(storage);

      await manager.save('access-1');
      await manager.saveRefresh('refresh-1');

      expect(await manager.get(), 'access-1');
      expect(await manager.getRefresh(), 'refresh-1');
      expect(storage.values.length, 2);
    });

    test('removing the access token leaves the refresh token intact', () async {
      final manager = TokenManager(_FakeStorage());
      await manager.save('access-1');
      await manager.saveRefresh('refresh-1');

      await manager.remove();

      expect(await manager.get(), isNull);
      expect(await manager.getRefresh(), 'refresh-1');
    });

    test('removeRefresh clears only the refresh token', () async {
      final manager = TokenManager(_FakeStorage());
      await manager.save('access-1');
      await manager.saveRefresh('refresh-1');

      await manager.removeRefresh();

      expect(await manager.get(), 'access-1');
      expect(await manager.getRefresh(), isNull);
    });
  });
}
