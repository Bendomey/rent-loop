import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/root.dart';

void main() {
  group('ApiException', () {
    test('parses message from a well-formed error body', () {
      final e = ApiException(400, '{"errors":{"message":"Invalid credentials"}}');
      expect(e.message, 'Invalid credentials');
    });

    test('returns null message for malformed JSON', () {
      final e = ApiException(500, 'not json');
      expect(e.message, isNull);
    });

    test('returns null message when the errors key is absent', () {
      final e = ApiException(404, '{"foo":"bar"}');
      expect(e.message, isNull);
    });

    test('toString falls back to the raw body when message is null', () {
      final e = ApiException(500, 'boom');
      expect(e.toString(), 'ApiException(500): boom');
    });
  });
}
