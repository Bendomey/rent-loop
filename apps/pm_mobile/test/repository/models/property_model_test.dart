import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/property_model.dart';

void main() {
  test('PropertyModel.fromJson parses all list-card fields', () {
    final json = {
      'id': 'prop-1',
      'name': 'Sunset Apartments',
      'type': 'MULTI',
      'status': 'Property.Status.Active',
      'address': '123 Main St',
      'city': 'Accra',
      'region': 'Greater Accra',
      'images': ['https://example.com/a.jpg'],
    };

    final model = PropertyModel.fromJson(json);

    expect(model.id, 'prop-1');
    expect(model.name, 'Sunset Apartments');
    expect(model.type, 'MULTI');
    expect(model.status, 'Property.Status.Active');
    expect(model.address, '123 Main St');
    expect(model.city, 'Accra');
    expect(model.region, 'Greater Accra');
    expect(model.images, ['https://example.com/a.jpg']);
  });

  test('PropertyModel.fromJson handles missing optional fields', () {
    final json = {
      'id': 'prop-2',
      'name': 'Osu Retail Block',
      'type': 'SINGLE',
      'status': 'Property.Status.Maintenance',
    };

    final model = PropertyModel.fromJson(json);

    expect(model.address, isNull);
    expect(model.city, isNull);
    expect(model.region, isNull);
    expect(model.images, isNull);
  });
}
