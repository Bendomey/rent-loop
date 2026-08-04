import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/user_api.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _FakeStorage extends Storage {
  final Map<String, String> values = {};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async => values[key] = value;

  @override
  Future<void> delete(String key) async => values.remove(key);
}

/// Accepts the request and then never answers — a hang, not an error.
class _NeverRespondingClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) =>
      Completer<http.StreamedResponse>().future;
}

void main() {
  group('ApiException', () {
    test('parses message from a well-formed error body', () {
      final e = ApiException(
        400,
        '{"errors":{"message":"Invalid credentials"}}',
      );
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

  group('revokeRefreshToken', () {
    test('gives up on a server that never responds', () async {
      // A hang produces no exception, so try/catch cannot save us here —
      // only the timeout can. This is the exact defect that shipped in the
      // web portal and was caught only in end-to-end testing.
      final api = UserApi(
        tokenManager: TokenManager(_FakeStorage()),
        client: _NeverRespondingClient(),
      );

      final stopwatch = Stopwatch()..start();
      await api.revokeRefreshToken('some-refresh-token');
      stopwatch.stop();

      expect(stopwatch.elapsed, lessThan(const Duration(seconds: 10)));
    });
  });
}
