import './secure_storage.dart';

class TokenManager {
  final SecureStorage _storage;

  TokenManager(SecureStorage storage) : _storage = storage;

  Future<void> save(String token) async => _storage.write(_tokenKey, token);

  Future<String?> get() => _storage.read(_tokenKey);

  Future<void> remove() async => _storage.delete(_tokenKey);

  static const String _tokenKey = 'mylespudo.token';
}
