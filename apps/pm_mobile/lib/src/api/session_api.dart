import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/session_model.dart';

part 'session_api.g.dart';

/// Every one of these routes is self-scoped — a session belongs to the person,
/// not to a workspace membership, so none of them carry a client_id.
class SessionApi extends AbstractApi {
  SessionApi({required super.tokenManager});

  Future<List<SessionModel>> getSessions() async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/users/me/sessions',
    );
    final data =
        (jsonDecode(response.body) as Map<String, dynamic>)['data'] as List?;
    return (data ?? [])
        .map((e) => SessionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Ends one session and every refresh token under it. Idempotent — the
  /// backend answers 204 even for an already-revoked session.
  Future<void> revokeSession(String sessionId) async {
    await execute(
      method: 'DELETE',
      path: '/api/v1/admin/users/me/sessions/$sessionId',
    );
  }

  /// Ends every session except this one. Returns how many were actually ended,
  /// which can differ from what the list showed if one expired in between.
  Future<int> revokeOtherSessions() async {
    final response = await execute(
      method: 'POST',
      path: '/api/v1/admin/users/me/sessions:revoke-others',
    );
    final data =
        (jsonDecode(response.body) as Map<String, dynamic>)['data']
            as Map<String, dynamic>?;
    return (data?['revoked_count'] as num?)?.toInt() ?? 0;
  }
}

@riverpod
SessionApi sessionApi(SessionApiRef ref) =>
    SessionApi(tokenManager: ref.watch(tokenManagerProvider));
