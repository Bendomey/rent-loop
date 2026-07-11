import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/user_model.dart';

void main() {
  test('UserModel.fromJson parses the client_users list', () {
    final json = {
      'id': 'user-1',
      'name': 'John Doe',
      'email': 'john@example.com',
      'phone_number': '+233281234569',
      'created_at': '2023-01-01T00:00:00Z',
      'updated_at': '2023-01-02T00:00:00Z',
      'client_users': [
        {
          'id': 'cu-1',
          'client_id': 'client-1',
          'role': 'STAFF',
          'status': 'ClientUser.Status.Active',
          'client': {'id': 'client-1', 'name': 'Acme Corp'},
        },
      ],
    };

    final model = UserModel.fromJson(json);

    expect(model.id, 'user-1');
    expect(model.clientUsers, hasLength(1));
    expect(model.clientUsers.first.client?.name, 'Acme Corp');
  });

  test('UserModel.fromJson defaults client_users to an empty list when absent', () {
    final json = {
      'id': 'user-1',
      'name': 'John Doe',
      'email': 'john@example.com',
    };

    final model = UserModel.fromJson(json);

    expect(model.clientUsers, isEmpty);
  });
}
