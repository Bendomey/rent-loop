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

  group('priority mapping', () {
    test('every priority round-trips through its API value', () {
      for (final label in ['Low', 'Medium', 'High', 'Emergency']) {
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

    test('Safety & Fire maps to SAFETY_FIRE', () {
      expect(mrCategoryApiValue('Safety & Fire'), 'SAFETY_FIRE');
      expect(mrCategoryLabelFromApi('SAFETY_FIRE'), 'Safety & Fire');
    });
  });
}
