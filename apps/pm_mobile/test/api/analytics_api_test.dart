import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';

void main() {
  group('CubeException', () {
    test('parses message from a well-formed Cube error body', () {
      final e = CubeException(400, '{"error":"Continue wait"}');
      expect(e.message, 'Continue wait');
    });

    test('returns null message for malformed JSON', () {
      final e = CubeException(500, 'not json');
      expect(e.message, isNull);
    });

    test('returns null message when the error key is absent', () {
      final e = CubeException(404, '{"foo":"bar"}');
      expect(e.message, isNull);
    });

    test('toString falls back to the raw body when message is null', () {
      final e = CubeException(500, 'boom');
      expect(e.toString(), 'CubeException(500): boom');
    });
  });
}
