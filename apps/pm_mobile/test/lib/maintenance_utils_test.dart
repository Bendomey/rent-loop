import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/maintenance_utils.dart';

void main() {
  group('status mapping', () {
    test('every label round-trips through its API value', () {
      for (final label in kMaintenanceStatusOrder) {
        final apiValue = mrStatusApiValue(label);
        expect(mrStatusLabel(apiValue), label);
      }
    });

    test('Cancelled maps to the single-L CANCELED API value', () {
      expect(mrStatusApiValue('Cancelled'), 'CANCELED');
      expect(mrStatusLabel('CANCELED'), 'Cancelled');
    });
  });

  group('visibility mapping', () {
    test('both visibilities round-trip through their API values', () {
      for (final label in ['Tenant can see this', 'Only staff can see this']) {
        expect(mrVisibilityLabelFromApi(mrVisibilityApiValue(label)), label);
      }
    });

    test('an unknown value passes through untranslated', () {
      expect(mrVisibilityLabelFromApi('SOMETHING_NEW'), 'SOMETHING_NEW');
    });
  });

  group('priority mapping', () {
    test('every priority round-trips through its API value', () {
      for (final label in ['Low', 'Medium', 'High', 'Urgent']) {
        final apiValue = mrPriorityApiValue(label);
        expect(mrPriorityLabelFromApi(apiValue), label);
      }
    });
  });

  group('category mapping', () {
    test('all 16 categories round-trip through their API values', () {
      expect(kMaintenanceCategoryLabels.length, 16);
      for (final label in kMaintenanceCategoryLabels) {
        final apiValue = mrCategoryApiValue(label);
        expect(mrCategoryLabelFromApi(apiValue), label);
      }
    });

    test('Safety & fire maps to SAFETY_FIRE', () {
      expect(mrCategoryApiValue('Safety & fire'), 'SAFETY_FIRE');
      expect(mrCategoryLabelFromApi('SAFETY_FIRE'), 'Safety & fire');
    });
  });
}
