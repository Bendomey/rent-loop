import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/agreement_model.dart';

void main() {
  test('AgreementModel.fromJson parses snake_case fields', () {
    final json = {
      'id': 'agreement-1',
      'name': 'Landlord Agreement',
      'user_has_accepted': false,
    };

    final model = AgreementModel.fromJson(json);

    expect(model.id, 'agreement-1');
    expect(model.name, 'Landlord Agreement');
    expect(model.userHasAccepted, isFalse);
    expect(model.toJson()['user_has_accepted'], isFalse);
  });
}
