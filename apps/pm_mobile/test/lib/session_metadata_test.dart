import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/session_metadata.dart';

void main() {
  group('marketingNameFor', () {
    test('maps a known Android codename', () {
      expect(marketingNameFor('SM-S931B'), 'Galaxy S25');
    });

    test('maps a known iOS machine identifier', () {
      expect(marketingNameFor('iPhone15,2'), 'iPhone 14 Pro');
    });

    test('returns null for an unknown model so the key is omitted', () {
      expect(marketingNameFor('SM-FUTURE999'), isNull);
    });
  });

  group('collectSessionMetadata', () {
    test('always reports a platform and never throws', () async {
      final metadata = await collectSessionMetadata();
      expect(metadata['platform'], isNotNull);
    });

    test('never includes a user-assigned device name', () async {
      final metadata = await collectSessionMetadata();
      final device = metadata['device'] as Map<String, dynamic>?;
      expect(device?.containsKey('name') ?? false, isFalse);
    });
  });
}
