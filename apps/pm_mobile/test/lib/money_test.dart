import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/money.dart';

void main() {
  group('pesewasToCedis', () {
    test('converts a whole-cedi amount', () {
      expect(pesewasToCedis(8600000), 86000);
    });

    test('converts an amount with a fractional cedi remainder', () {
      expect(pesewasToCedis(150), 1.5);
    });

    test('converts zero', () {
      expect(pesewasToCedis(0), 0);
    });
  });
}
