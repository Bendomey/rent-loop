import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/email.dart';

void main() {
  group('normalizeEmail', () {
    test('lowercases the whole address', () {
      expect(normalizeEmail('Ama@Example.COM'), 'ama@example.com');
    });

    test('strips surrounding whitespace', () {
      expect(normalizeEmail('  ama@example.com  '), 'ama@example.com');
      expect(normalizeEmail('\tAMA@EXAMPLE.COM\n'), 'ama@example.com');
    });

    test('leaves an already-normalised address untouched', () {
      expect(normalizeEmail('ama@example.com'), 'ama@example.com');
    });

    test('does not touch internal characters beyond case', () {
      expect(
        normalizeEmail('Ama.Boateng+RentLoop@Example.com'),
        'ama.boateng+rentloop@example.com',
      );
    });

    test('handles an empty string', () {
      expect(normalizeEmail(''), '');
      expect(normalizeEmail('   '), '');
    });
  });
}
