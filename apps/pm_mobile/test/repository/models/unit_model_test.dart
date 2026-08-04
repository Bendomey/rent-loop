import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/unit_model.dart';

void main() {
  test('UnitModel.fromJson parses all fields', () {
    final json = {
      'id': 'unit-1',
      'name': 'Unit 4B',
      'type': 'APARTMENT',
      'status': 'Unit.Status.Occupied',
      'rent_fee': 420000,
      'rent_fee_currency': 'GHS',
      'area': 85.5,
      'images': ['https://example.com/unit.jpg'],
      'created_at': '2026-01-01T00:00:00Z',
    };

    final model = UnitModel.fromJson(json);

    expect(model.id, 'unit-1');
    expect(model.name, 'Unit 4B');
    expect(model.type, 'APARTMENT');
    expect(model.status, 'Unit.Status.Occupied');
    expect(model.rentFee, 420000);
    expect(model.rentFeeCurrency, 'GHS');
    expect(model.area, 85.5);
    expect(model.images, ['https://example.com/unit.jpg']);
    expect(model.createdAt, '2026-01-01T00:00:00Z');
  });

  test('UnitModel.fromJson handles missing optional fields', () {
    final json = {
      'id': 'unit-2',
      'name': 'Unit 1C',
      'type': 'STUDIO',
      'status': 'Unit.Status.Available',
      'rent_fee': 300000,
      'rent_fee_currency': 'GHS',
    };

    final model = UnitModel.fromJson(json);

    expect(model.area, isNull);
    expect(model.images, isNull);
    expect(model.createdAt, isNull);
  });
}
