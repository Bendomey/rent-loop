import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';

void main() {
  const expected = {
    'ChargesAlreadyBilled':
        'Rent has already been billed, so this can no longer be changed.',
    'UnitNotAvailable': 'That unit is no longer available. Pick another unit.',
    'PhoneOrEmailRequired': "Enter the tenant's phone number or email.",
    'TenantApplicationAlreadyCompleted': 'This tenant has already moved in.',
    'TenantApplicationAlreadyCancelled':
        'This tenant setup was already cancelled.',
  };

  expected.forEach((code, message) {
    test('translates $code', () {
      expect(translateApiErrorMessage(errorMessage: code), message);
    });
  });
}
