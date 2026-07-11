import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/user_model.dart';

part 'user_api.g.dart';

class UserLoginResult {
  UserLoginResult({required this.token, required this.user});

  final String token;
  final UserModel user;
}

class UserApi extends AbstractApi {
  UserApi({required super.tokenManager});

  Future<UserLoginResult> login({
    required String email,
    required String password,
  }) async {
    final response = await execute(
      method: 'POST',
      path: '/api/v1/admin/users/login',
      body: {'email': email, 'password': password},
      authRequired: false,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return UserLoginResult(
      token: data['token'] as String,
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<UserModel> getMe() async {
    final response = await execute(method: 'GET', path: '/api/v1/admin/users/me');
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UserModel.fromJson(json['data'] as Map<String, dynamic>);
  }
}

@riverpod
UserApi userApi(UserApiRef ref) =>
    UserApi(tokenManager: ref.watch(tokenManagerProvider));
