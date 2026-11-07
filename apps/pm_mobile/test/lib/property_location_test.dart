import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/property_location.dart';

void main() {
  test('appends the city when the address does not mention it', () {
    expect(propertyLocation('12 Ring Road', 'Accra'), '12 Ring Road, Accra');
  });

  test('does not repeat a city already inside the address', () {
    expect(
      propertyLocation('Ring Road West Road, Accra, Ghana', 'Accra'),
      'Ring Road West Road, Accra, Ghana',
    );
    expect(propertyLocation('1 Main St, ACCRA', 'accra'), '1 Main St, ACCRA');
  });

  test('keeps the city when it only appears inside another word', () {
    expect(
      propertyLocation('Accra Road, Tema', 'Accra'),
      'Accra Road, Tema, Accra',
    );
  });

  test('copes with missing parts', () {
    expect(propertyLocation(null, 'Accra'), 'Accra');
    expect(propertyLocation('12 Ring Road', null), '12 Ring Road');
    expect(propertyLocation('', ''), '');
  });
}
