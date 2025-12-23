import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import './storage.dart';

class SecureStorage extends Storage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final AndroidOptions _androidOptions;

  SecureStorage() : _androidOptions = _createAndroidOptions();

  @override
  Future<String?> read(String key) =>
      _storage.read(key: key, aOptions: _androidOptions);

  @override
  Future<void> delete(String key) =>
      _storage.delete(key: key, aOptions: _androidOptions);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value, aOptions: _androidOptions);

  static AndroidOptions _createAndroidOptions() => AndroidOptions();
}
