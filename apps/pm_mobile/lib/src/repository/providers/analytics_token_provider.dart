import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart' show Ref;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

part 'analytics_token_provider.g.dart';

const _refreshMargin = Duration(seconds: 60);
const _undecodableLifetime = Duration(minutes: 5);

DateTime _expiryOf(String token, DateTime fetchedAt) {
  try {
    final payload = token.split('.')[1];
    final json =
        jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(payload))))
            as Map<String, dynamic>;
    return DateTime.fromMillisecondsSinceEpoch(
      (json['exp'] as num).toInt() * 1000,
    );
  } catch (_) {
    return fetchedAt.add(_undecodableLifetime);
  }
}

@Riverpod(keepAlive: true)
class AnalyticsTokenNotifier extends _$AnalyticsTokenNotifier {
  late DateTime _expiresAt;
  bool _expired = false;
  Future<String>? _refetch;
  int _generation = 0;

  @override
  Future<String> build() {
    _generation++;
    _refetch = null;
    final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) throw StateError('No active workspace');
    final generation = _generation;
    return _fetch(clientId).then((token) {
      if (generation == _generation) _commit(token);
      return token;
    });
  }

  Future<String> _fetch(String clientId) =>
      ref.read(analyticsApiProvider).getToken(clientId: clientId);

  void _commit(String token) {
    _expiresAt = _expiryOf(token, DateTime.now());
    _expired = false;
  }

  Future<String> fresh() async {
    String current;
    try {
      current = await future;
    } catch (_) {
      // A failed first fetch would otherwise stay cached for the app's life.
      _expired = true;
      current = '';
    }
    final stale =
        _expired || !DateTime.now().add(_refreshMargin).isBefore(_expiresAt);
    if (!stale) return current;
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) throw StateError('No active workspace');
    final generation = _generation;
    final pending = _fetch(clientId)
        .then<String>((token) {
          if (generation != _generation) return future;
          _commit(token);
          state = AsyncData(token);
          return token;
        })
        .whenComplete(() {
          if (generation == _generation) _refetch = null;
        });
    return _refetch ??= pending;
  }

  void expire() => _expired = true;
}

Future<T> withCubeToken<T>(
  Ref ref,
  Future<T> Function(String token) run,
) async {
  final notifier = ref.read(analyticsTokenNotifierProvider.notifier);
  try {
    return await run(await notifier.fresh());
  } on CubeException catch (e) {
    if (e.statusCode != 401 && e.statusCode != 403) rethrow;
    notifier.expire();
    return run(await notifier.fresh());
  }
}
