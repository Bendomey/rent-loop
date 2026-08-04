import './storage.dart';

class TokenManager {
  final Storage _storage;

  TokenManager(Storage storage) : _storage = storage;

  // Access token — short-lived (1h), sent as the Bearer on every call.
  Future<void> save(String token) async => _storage.write(_tokenKey, token);

  Future<String?> get() => _storage.read(_tokenKey);

  Future<void> remove() async => _storage.delete(_tokenKey);

  // Refresh token — long-lived and sliding. Kept under its own key so the
  // access token can be replaced on every rotation without disturbing it.
  Future<void> saveRefresh(String token) async =>
      _storage.write(_refreshTokenKey, token);

  Future<String?> getRefresh() => _storage.read(_refreshTokenKey);

  Future<void> removeRefresh() async => _storage.delete(_refreshTokenKey);

  static const String _tokenKey = 'rentloop_manager.token';
  static const String _refreshTokenKey = 'rentloop_manager.refresh_token';
}
