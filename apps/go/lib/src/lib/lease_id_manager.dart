import './secure_storage.dart';

class LeaseIdManager {
  final SecureStorage _storage;

  static const String _key = 'rentloop.current_lease_id';

  LeaseIdManager(SecureStorage storage) : _storage = storage;

  Future<void> save(String id) => _storage.write(_key, id);

  Future<String?> get() => _storage.read(_key);

  Future<void> remove() => _storage.delete(_key);
}
