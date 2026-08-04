import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/client_model.dart';

void main() {
  test('ClientModel.fromJson parses snake_case fields', () {
    final json = {
      'id': 'client-1',
      'name': 'Acme Corp',
      'type': 'INDIVIDUAL',
      'sub_type': 'LANDLORD',
      'address': '123 Main St',
      'city': 'Accra',
      'region': 'Greater Accra',
      'country': 'GH',
      'support_email': 'support@acme.test',
      'support_phone': '+233551235555',
      'website_url': 'https://acme.test',
      'id_type': 'NATIONAL_ID',
      'id_number': 'GHA-123456789-0',
      'created_at': '2023-01-01T00:00:00Z',
      'updated_at': '2023-01-02T00:00:00Z',
    };

    final model = ClientModel.fromJson(json);

    expect(model.id, 'client-1');
    expect(model.name, 'Acme Corp');
    expect(model.subType, 'LANDLORD');
    expect(model.supportEmail, 'support@acme.test');
    expect(model.idType, 'NATIONAL_ID');
    expect(model.idNumber, 'GHA-123456789-0');
    expect(model.toJson()['sub_type'], 'LANDLORD');
    expect(model.toJson()['id_type'], 'NATIONAL_ID');
  });

  test(
    'ClientModel.fromJson defaults id_type/id_number to null when absent',
    () {
      final json = {'id': 'client-1', 'name': 'Acme Corp'};

      final model = ClientModel.fromJson(json);

      expect(model.idType, isNull);
      expect(model.idNumber, isNull);
    },
  );
}
