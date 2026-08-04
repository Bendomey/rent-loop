import './secure_storage.dart';

class WorkspaceIdManager {
  final SecureStorage _storage;

  static const String _key = 'rentloop_manager.current_client_id';

  WorkspaceIdManager(SecureStorage storage) : _storage = storage;

  Future<void> save(String id) => _storage.write(_key, id);

  Future<String?> get() => _storage.read(_key);

  Future<void> remove() => _storage.delete(_key);
}
