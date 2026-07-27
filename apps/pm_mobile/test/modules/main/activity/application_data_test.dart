import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';

/// The checklist mirrors the web's `use-calculate-checklist`: five sections,
/// progress is the fraction of sections that are *fully* complete, and an
/// empty section (no document attached) passes the approval gate vacuously
/// while still counting as incomplete for display.
void main() {
  group('checklist derivation', () {
    final a1 = ApplicationDetailData.forId('a1');

    test('tenant details counts the 17 fields the web tracks', () {
      final tenant = a1.tenantSection;
      expect(tenant.items.length, 17);
      expect(tenant.doneCount, 11);
      expect(tenant.complete, isFalse);
    });

    test('docs section is document + one row per signer', () {
      final docs = a1.docsSection;
      expect(docs.items.length, 5);
      // Only "Document uploaded" is done — nobody has signed yet.
      expect(docs.doneCount, 1);
    });

    test('unit section is complete when a unit is selected', () {
      expect(a1.unitSection.complete, isTrue);
    });

    test('progress is the fraction of fully complete sections', () {
      // Only the unit section is complete → 1 of 5.
      expect(a1.progress, 20);
      expect(a1.canApprove, isFalse);
    });

    test('editing a section moves progress', () {
      final filled = a1.copyWith(
        moveIn: a1.moveIn.copyWith(
          desiredMoveInDate: () => DateTime(2026, 8, 1),
        ),
      );
      expect(filled.moveInSection.complete, isTrue);
      expect(filled.progress, 40);
    });

    test('an unattached document yields an empty, vacuous docs section', () {
      final a4 = ApplicationDetailData.forId('a4');
      expect(a4.doc.attached, isFalse);
      expect(a4.docsSection.items, isEmpty);
      // Empty sections never count as complete for the progress readout.
      expect(a4.docsSection.complete, isFalse);
    });

    test('unknown ids fall back to the first application', () {
      expect(ApplicationDetailData.forId('nope').id, 'a1');
    });
  });

  group('financial totals', () {
    test('full-stay payment covers every period of the stay', () {
      const f = ApplicationFinancial(
        rentFee: 50000,
        paymentFrequency: 'MONTHLY',
      );
      expect(f.periodsFor(12), 12);
      expect(f.initialTotalFor(12), 600000);
    });

    test('custom mode uses the chosen number of periods', () {
      const f = ApplicationFinancial(
        rentFee: 50000,
        paymentMode: 'CUSTOM',
        customPeriods: 2,
      );
      expect(f.initialTotalFor(12), 100000);
    });

    test('an enabled security deposit is added on top', () {
      const f = ApplicationFinancial(
        rentFee: 50000,
        paymentMode: 'CUSTOM',
        customPeriods: 1,
        securityDepositEnabled: true,
        securityDepositFee: 25000,
      );
      expect(f.initialTotalFor(12), 75000);
    });

    test('a disabled deposit is ignored even when an amount lingers', () {
      const f = ApplicationFinancial(
        rentFee: 50000,
        paymentMode: 'CUSTOM',
        customPeriods: 1,
        securityDepositFee: 25000,
      );
      expect(f.initialTotalFor(12), 50000);
    });
  });

  group('unit selection', () {
    final a1 = ApplicationDetailData.forId('a1');

    test('picking a unit cascades its terms into rent and stay frequency', () {
      final target = kApplicationSeedUnits.firstWhere((u) => u.id == 'u4');
      final next = a1.withUnit(target);

      expect(next.desiredUnit?.id, 'u4');
      // The web PATCHes rent_fee/payment_frequency/stay_duration_frequency
      // off the unit alongside desired_unit_id.
      expect(next.financial.rentFee, target.rentFee);
      expect(next.financial.paymentFrequency, target.paymentFrequency);
      expect(next.moveIn.stayDurationFrequency, target.paymentFrequency);
    });

    test('the unit section completes once a unit is assigned', () {
      final none = ApplicationDetailData.forId('a4');
      expect(none.desiredUnit, isNull);
      expect(none.unitSection.complete, isFalse);

      final assigned = none.withUnit(kApplicationSeedUnits.first);
      expect(assigned.unitSection.complete, isTrue);
      expect(assigned.progress, greaterThan(none.progress));
    });

    test('changes lock once the initial payment is paid', () {
      final paid = a1.copyWith(
        financial: a1.financial.copyWith(invoicePaid: true),
      );
      expect(paid.isUnitChangeLocked, isTrue);
      expect(paid.unitChangeLockReason, contains('initial payment'));
    });

    test('changes lock once anyone has signed the lease document', () {
      final signed = a1.copyWith(
        doc: ApplicationDoc(
          name: a1.doc.name,
          source: a1.doc.source,
          status: a1.doc.status,
          mode: a1.doc.mode,
          signers: [
            a1.doc.signers.first.copyWith(signed: true),
            ...a1.doc.signers.skip(1),
          ],
        ),
      );
      expect(signed.isUnitChangeLocked, isTrue);
      expect(signed.unitChangeLockReason, contains('signed'));
    });

    test('an approved application can no longer change unit', () {
      expect(a1.canChangeUnit, isTrue);
      expect(a1.copyWith(approved: true).canChangeUnit, isFalse);
      expect(a1.isUnitChangeLocked, isFalse);
    });

    test('only available units are selectable', () {
      final occupied = kApplicationSeedUnits.firstWhere((u) => u.id == 'u3');
      final maintenance = kApplicationSeedUnits.firstWhere((u) => u.id == 'u5');
      expect(occupied.isAvailable, isFalse);
      expect(maintenance.isAvailable, isFalse);
      expect(kApplicationSeedUnits.where((u) => u.isAvailable).length, 3);
    });
  });

  group('formatting', () {
    test('pesewas render as grouped cedis', () {
      expect(formatPesewas(600000), 'GH₵ 6,000.00');
      expect(formatPesewas(50000), 'GH₵ 500.00');
      expect(formatPesewas(null), '—');
    });

    test('period labels pluralise off the stay frequency', () {
      expect(periodLabel('MONTHLY', 1), 'month');
      expect(periodLabel('MONTHLY', 12), 'months');
      expect(periodLabel(null, 2), 'periods');
    });
  });
}
