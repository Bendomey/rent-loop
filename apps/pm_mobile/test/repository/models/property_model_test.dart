import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/property_model.dart';

void main() {
  test('PropertyModel.fromJson parses id and ignores unmodeled fields', () {
    final json = {
      'id': 'prop-1',
      'name': 'Sunset Apartments',
    };

    final model = PropertyModel.fromJson(json);

    expect(model.id, 'prop-1');
  });
}
