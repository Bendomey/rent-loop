import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';

void main() {
  test('maps status api values to display labels', () {
    expect(
      applicationStatusLabel('TenantApplication.Status.InProgress'),
      'In Progress',
    );
    expect(
      applicationStatusLabel('TenantApplication.Status.Completed'),
      'Completed',
    );
    expect(
      applicationStatusLabel('TenantApplication.Status.Cancelled'),
      'Cancelled',
    );
    expect(applicationStatusLabel(null), 'Unknown');
    expect(applicationStatusLabel('something.else'), 'Unknown');
  });

  test('round-trips every offered status label', () {
    for (final label in kApplicationStatusLabels) {
      expect(applicationStatusLabel(applicationStatusApiValue(label)), label);
    }
  });

  test('exposes the web filter option sets', () {
    expect(kApplicationGenderLabels, ['Male', 'Female']);
    expect(kApplicationMaritalStatusLabels, [
      'Single',
      'Married',
      'Divorced',
      'Widowed',
    ]);
    expect(applicationGenderApiValue('Female'), 'FEMALE');
    expect(applicationMaritalStatusApiValue('Widowed'), 'WIDOWED');
  });

  test('isApplicationPending is true only for in-progress applications', () {
    expect(isApplicationPending('TenantApplication.Status.InProgress'), isTrue);
    expect(isApplicationPending('TenantApplication.Status.Completed'), isFalse);
    expect(isApplicationPending('TenantApplication.Status.Cancelled'), isFalse);
    expect(isApplicationPending(null), isFalse);
  });
}
