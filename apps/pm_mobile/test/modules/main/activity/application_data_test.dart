import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';

ApplicationDetailData _inProgress() => ApplicationDetailData(
  id: 'a1',
  code: '2607QUOWF0',
  status: 'In Progress',
  submittedOn: 'Fri, 10 Jul 2026 · 11:34',
  submittedBy: 'Benjamin Domey',
  applicant: ApplicationApplicant(
    firstName: 'Ebenezer',
    lastName: 'Adu',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    email: 'e@example.com',
    phone: '+233277099220',
    dateOfBirth: DateTime(1998, 3, 4),
  ),
  identity: const ApplicationIdentity(
    nationality: 'Ghanaian',
    idType: 'NATIONAL_ID',
    idNumber: 'GHA-14564-464',
  ),
  background: const ApplicationBackground(
    employerType: 'WORKER',
    occupation: 'Accountant',
  ),
  moveIn: const ApplicationMoveIn(
    stayDurationFrequency: 'MONTHLY',
    stayDuration: 12,
  ),
  financial: const ApplicationFinancial(
    rentFee: 50000,
    paymentFrequency: 'MONTHLY',
  ),
  doc: const ApplicationDoc(
    name: 'Lease Agreement',
    mode: 'ONLINE',
    signers: [
      ApplicationSigner(
        role: 'PROPERTY_MANAGER',
        label: 'Property Manager',
        signed: false,
        isSelf: true,
      ),
      ApplicationSigner(
        role: 'TENANT',
        label: 'Tenant',
        signed: false,
        isSelf: false,
      ),
      ApplicationSigner(
        role: 'PM_WITNESS',
        label: 'Property Manager Witness',
        signed: false,
        isSelf: false,
      ),
      ApplicationSigner(
        role: 'TENANT_WITNESS',
        label: 'Tenant Witness',
        signed: false,
        isSelf: false,
      ),
    ],
  ),
  desiredUnit: kApplicationSeedUnits[0],
);

ApplicationDetailData _bare() => ApplicationDetailData(
  id: 'a4',
  code: '2607SLRKD4',
  status: 'In Progress',
  submittedOn: '—',
  submittedBy: '—',
  applicant: ApplicationApplicant(
    firstName: 'Selorm',
    lastName: 'Kudjo',
    email: 's@example.com',
  ),
  identity: const ApplicationIdentity(),
  background: const ApplicationBackground(),
  moveIn: const ApplicationMoveIn(),
  financial: const ApplicationFinancial(),
  doc: const ApplicationDoc(),
);

/// The checklist mirrors the web's `use-calculate-checklist`: five steps,
/// progress is the share of steps that are done or locked, and a step with no
/// items (no document attached) passes the approval gate vacuously while not
/// counting as done.
void main() {
  group('checklist derivation', () {
    final a1 = _inProgress();

    test('tenant details reports the four groups the web tracks', () {
      final tenant = a1.stepFor(ChecklistSection.tenant);
      expect(tenant.totalItems, 4);
      expect(tenant.allItemsDone, isFalse);
    });

    test('docs section is document + one row per signer', () {
      final docs = a1.stepFor(ChecklistSection.docs);
      expect(docs.totalItems, 5);
      // Only "Document uploaded" is done — nobody has signed yet.
      expect(docs.doneItems, 1);
    });

    test('unit section is complete when a unit is selected', () {
      expect(a1.stepFor(ChecklistSection.unit).isSatisfied, isTrue);
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
      expect(filled.stepFor(ChecklistSection.moveIn).isSatisfied, isTrue);
      expect(filled.progress, 40);
    });

    test('an unattached document yields an empty, vacuous docs section', () {
      final a4 = _bare();
      expect(a4.doc.attached, isFalse);
      final docs = a4.stepFor(ChecklistSection.docs);
      expect(docs.totalItems, 0);
      expect(docs.isSatisfied, isFalse);
    });
  });

  group('unit selection', () {
    final a1 = _inProgress();

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
      final none = _bare();
      expect(none.desiredUnit, isNull);
      expect(none.stepFor(ChecklistSection.unit).isSatisfied, isFalse);

      final assigned = none.withUnit(kApplicationSeedUnits.first);
      expect(assigned.stepFor(ChecklistSection.unit).isSatisfied, isTrue);
      expect(assigned.progress, greaterThan(none.progress));
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
    // formatPesewas moved to lib/money.dart — see test/lib/money_test.dart

    test('period labels pluralise off the stay frequency', () {
      expect(periodLabel('MONTHLY', 1), 'month');
      expect(periodLabel('MONTHLY', 12), 'months');
      expect(periodLabel(null, 2), 'periods');
    });
  });

  group('real API row round-trip', () {
    test('fromApplicationModel preserves the checklist of the source row', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'app-9',
        'code': 'TA-9',
        'status': 'TenantApplication.Status.InProgress',
        'first_name': 'Adjoa',
        'last_name': 'Frimpong',
        'email': 'a@b.c',
        'desired_unit': {
          'id': 'u1',
          'name': 'Unit 1C',
          'type': 'APARTMENT',
          'status': 'Unit.Status.Available',
          'rent_fee': 300000,
          'rent_fee_currency': 'GHS',
        },
        'rent_fee': 300000,
        'payment_frequency': 'MONTHLY',
      });

      final data = ApplicationDetailData.fromApplicationModel(model);

      expect(data.id, 'app-9');
      expect(data.applicant.fullName, 'Adjoa Frimpong');
      expect(data.desiredUnit?.name, 'Unit 1C');
      // The important one: the trip through ApplicationDetailData loses
      // nothing the checklist reads.
      expect(data.progress, computeApplicationChecklist(model).progress * 100);
    });

    test('a completed application reads as approved', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'a',
        'code': 'c',
        'status': 'TenantApplication.Status.Completed',
      });
      expect(
        ApplicationDetailData.fromApplicationModel(model).approved,
        isTrue,
      );
    });

    test('no document mode yields no signers and an empty docs section', () {
      final model = TenantApplicationModel.fromJson({'id': 'a', 'code': 'c'});
      final data = ApplicationDetailData.fromApplicationModel(model);
      expect(data.doc.signers, isEmpty);
      expect(data.stepFor(ChecklistSection.docs).totalItems, 0);
    });

    for (final entry in {
      'financial account without an invoice': {
        'financial_account': {'id': 'fa'},
      },
      'invoice without a financial account': {
        'application_payment_invoice': {
          'id': 'i',
          'code': 'c',
          'status': 'ISSUED',
        },
      },
    }.entries) {
      test('detail checklist matches the list for a ${entry.key}', () {
        final model = TenantApplicationModel.fromJson({
          'id': 'a',
          'code': 'c',
          'status': 'TenantApplication.Status.InProgress',
          'rent_fee': 1000,
          ...entry.value,
        });
        final expected = computeApplicationChecklist(model);
        final data = ApplicationDetailData.fromApplicationModel(model);
        expect(data.progress, expected.progress * 100);
        expect(data.canApprove, expected.canApprove);
        expect(
          data.stepFor(ChecklistSection.financial).state,
          expected.step(ChecklistSection.financial).state,
        );
      });
    }
  });
}
