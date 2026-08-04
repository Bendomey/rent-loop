import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/auth_event_bus.dart';
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

/// Scripted transport. Records every request and answers from [handler].
class _ScriptedClient extends http.BaseClient {
  _ScriptedClient(this.handler);

  final http.Response Function(http.BaseRequest request) handler;
  final List<String> requests = [];

  int countOf(String fragment) =>
      requests.where((r) => r.contains(fragment)).length;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    requests.add('${request.method} ${request.url.path}');
    final response = handler(request);
    return http.StreamedResponse(
      Stream.value(utf8.encode(response.body)),
      response.statusCode,
      request: request,
    );
  }
}

/// Minimal concrete API so we exercise the real AbstractApi.execute().
class _TestApi extends AbstractApi {
  _TestApi({required super.tokenManager, super.client});

  Future<http.Response> callProtected() =>
      execute(method: 'GET', path: '/api/v1/admin/users/me');
}

String _refreshBody(String token, String refresh) => jsonEncode({
  'data': {'token': token, 'refresh_token': refresh},
});

void main() {
  setUp(AbstractApi.debugResetRefreshState);

  group('401 handling', () {
    test(
      'refreshes once, then replays the request with the new token',
      () async {
        final manager = TokenManager(_FakeStorage());
        await manager.save('stale-access');
        await manager.saveRefresh('good-refresh');

        var protectedCalls = 0;
        final client = _ScriptedClient((request) {
          if (request.url.path.endsWith('/refresh')) {
            return http.Response(
              _refreshBody('fresh-access', 'new-refresh'),
              200,
            );
          }
          protectedCalls++;
          final auth = request.headers['Authorization'];
          if (auth == 'Bearer fresh-access') {
            return http.Response('{"data":{}}', 200);
          }
          return http.Response(
            '{"errors":{"message":"AuthorizationFailed"}}',
            401,
          );
        });

        final response = await _TestApi(
          tokenManager: manager,
          client: client,
        ).callProtected();

        expect(response.statusCode, 200);
        expect(protectedCalls, 2, reason: 'original attempt + one replay');
        expect(client.countOf('/refresh'), 1);
        expect(await manager.get(), 'fresh-access');
        expect(await manager.getRefresh(), 'new-refresh');
      },
    );

    test('retries at most once — a second 401 propagates', () async {
      final manager = TokenManager(_FakeStorage());
      await manager.save('stale');
      await manager.saveRefresh('good-refresh');

      var protectedCalls = 0;
      final client = _ScriptedClient((request) {
        if (request.url.path.endsWith('/refresh')) {
          return http.Response(_refreshBody('fresh', 'new-refresh'), 200);
        }
        protectedCalls++;
        return http.Response('{"errors":{"message":"nope"}}', 401);
      });

      await expectLater(
        _TestApi(tokenManager: manager, client: client).callProtected(),
        throwsA(isA<ApiException>()),
      );
      expect(protectedCalls, 2, reason: 'must not loop');
    });

    test('a failed refresh broadcasts unauthorized exactly once', () async {
      final manager = TokenManager(_FakeStorage());
      await manager.save('stale');
      await manager.saveRefresh('dead-refresh');

      final client = _ScriptedClient((request) {
        if (request.url.path.endsWith('/refresh')) {
          return http.Response(
            '{"errors":{"message":"InvalidRefreshToken"}}',
            401,
          );
        }
        return http.Response(
          '{"errors":{"message":"AuthorizationFailed"}}',
          401,
        );
      });

      var broadcasts = 0;
      final sub = AuthEventBus.instance.onUnauthorized.listen(
        (_) => broadcasts++,
      );

      await expectLater(
        _TestApi(tokenManager: manager, client: client).callProtected(),
        throwsA(isA<ApiException>()),
      );
      await Future<void>.delayed(Duration.zero);
      await sub.cancel();

      expect(broadcasts, 1);
    });

    test('unauthenticated calls never trigger a refresh', () async {
      final manager = TokenManager(_FakeStorage());
      await manager.saveRefresh('good-refresh');

      final client = _ScriptedClient(
        (_) => http.Response('{"errors":{"message":"PasswordIncorrect"}}', 401),
      );

      final api = _TestApi(tokenManager: manager, client: client);
      await expectLater(
        api.execute(
          method: 'POST',
          path: '/api/v1/admin/users/login',
          authRequired: false,
        ),
        throwsA(isA<ApiException>()),
      );
      expect(client.countOf('/refresh'), 0);
    });
  });

  test(
    'concurrent 401s across DIFFERENT api instances share ONE refresh',
    () async {
      final manager = TokenManager(_FakeStorage());
      await manager.save('stale');
      await manager.saveRefresh('good-refresh');

      final client = _ScriptedClient((request) {
        if (request.url.path.endsWith('/refresh')) {
          return http.Response(_refreshBody('fresh', 'new-refresh'), 200);
        }
        final auth = request.headers['Authorization'];
        if (auth == 'Bearer fresh') return http.Response('{"data":{}}', 200);
        return http.Response(
          '{"errors":{"message":"AuthorizationFailed"}}',
          401,
        );
      });

      // Separate instances, mirroring the ~16 real API classes.
      final apis = List.generate(
        5,
        (_) => _TestApi(tokenManager: manager, client: client),
      );
      final responses = await Future.wait(
        apis.map((api) => api.callProtected()),
      );

      expect(responses.every((r) => r.statusCode == 200), isTrue);
      expect(
        client.countOf('/refresh'),
        1,
        reason:
            'single-flight must be static; per-instance state would fire five '
            'refreshes and the backend would revoke the session as theft',
      );
    },
  );
}
