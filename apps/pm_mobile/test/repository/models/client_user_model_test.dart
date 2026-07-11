import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/client_user_model.dart';

void main() {
  test('ClientUserModel.fromJson parses a nested client', () {
    final json = {
      'id': 'cu-1',
      'client_id': 'client-1',
      'role': 'STAFF',
      'status': 'ClientUser.Status.Active',
      'created_at': '2023-01-01T00:00:00Z',
      'updated_at': '2023-01-02T00:00:00Z',
      'client': {'id': 'client-1', 'name': 'Acme Corp'},
    };

    final model = ClientUserModel.fromJson(json);

    expect(model.id, 'cu-1');
    expect(model.clientId, 'client-1');
    expect(model.role, 'STAFF');
    expect(model.status, 'ClientUser.Status.Active');
    expect(model.client?.name, 'Acme Corp');
  });

  test('ClientUserModel.fromJson handles a missing client', () {
    final json = {
      'id': 'cu-1',
      'client_id': 'client-1',
      'role': 'STAFF',
      'status': 'ClientUser.Status.Active',
    };

    final model = ClientUserModel.fromJson(json);

    expect(model.client, isNull);
  });
}
