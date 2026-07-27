import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/user_model.dart';

part 'user_api.g.dart';

class UserLoginResult {
  UserLoginResult({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  final String token;
  final String refreshToken;
  final UserModel user;
}

class UserApi extends AbstractApi {
  UserApi({required super.tokenManager, super.client});

  Future<UserLoginResult> login({
    required String email,
    required String password,
    Map<String, dynamic>? metadata,
  }) async {
    final response = await execute(
      method: 'POST',
      path: '/api/v1/admin/users/login',
      body: {
        'email': email,
        'password': password,
        if (metadata != null) 'metadata': metadata,
      },
      authRequired: false,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return UserLoginResult(
      token: data['token'] as String,
      refreshToken: data['refresh_token'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  /// Ends this session server-side. Best-effort by contract: it never throws
  /// and never reports failure, because logging out must not be blocked by a
  /// network problem — the caller clears local state regardless.
  ///
  /// The timeout is load-bearing, not decoration. Catching exceptions alone is
  /// not enough: a server that accepts the connection and never answers leaves
  /// the request hanging forever, and a hang is not an exception. Without this
  /// the user is stuck in the session they are trying to leave.
  Future<void> revokeRefreshToken(String refreshToken) async {
    try {
      await execute(
        method: 'POST',
        path: '/api/v1/admin/users/logout',
        body: {'refresh_token': refreshToken},
        authRequired: false,
      ).timeout(const Duration(seconds: 3));
    } catch (_) {
      // intentionally ignored — see doc comment
    }
  }

  Future<UserModel> getMe() async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/users/me',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UserModel.fromJson(json['data'] as Map<String, dynamic>);
  }
}

@riverpod
UserApi userApi(UserApiRef ref) =>
    UserApi(tokenManager: ref.watch(tokenManagerProvider));
