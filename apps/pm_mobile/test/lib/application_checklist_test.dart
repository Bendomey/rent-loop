import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

const _unit = {
  'id': 'u1',
  'name': 'Unit 1C',
  'type': 'APARTMENT',
  'status': 'Unit.Status.Available',
  'rent_fee': 300000,
  'rent_fee_currency': 'GHS',
};

TenantApplicationModel _app(Map<String, dynamic> overrides) =>
    TenantApplicationModel.fromJson({'id': 'a', 'code': 'TA-1', ...overrides});

/// Every tenant-detail field filled, so that section reads complete.
const _completeTenant = {
  'first_name': 'A',
  'last_name': 'B',
  'phone': 'p',
  'gender': 'FEMALE',
  'date_of_birth': '1990-01-01T00:00:00Z',
  'nationality': 'GH',
  'marital_status': 'SINGLE',
  'id_type': 'GHANA_CARD',
  'id_number': '1',
  'current_address': 'addr',
  'emergency_contact_name': 'e',
  'emergency_contact_phone': 'ep',
  'relationship_to_emergency_contact': 'r',
  'employer_type': 'EMPLOYED',
  'occupation': 'o',
  'employer': 'emp',
  'occupation_address': 'oa',
};

String _witnessContent(List<Map<String, dynamic>> sigs) => jsonEncode({
  'root': {'type': 'root', 'children': sigs},
});

void main() {
  group('unit section', () {
    test('is done only when a desired unit is present', () {
      expect(buildApplicationChecklist(_app({})).first.complete, isFalse);
      expect(
        buildApplicationChecklist(_app({'desired_unit': _unit})).first.complete,
        isTrue,
      );
    });
  });

  group('tenant details section', () {
    test('has 17 items', () {
      final section = buildApplicationChecklist(_app({}))[1];
      expect(section.items, hasLength(17));
      expect(section.doneCount, 0);
    });

    test('is complete when every field is filled', () {
      expect(
        buildApplicationChecklist(_app(_completeTenant))[1].complete,
        isTrue,
      );
    });

    test('an empty string does not count as filled', () {
      final section = buildApplicationChecklist(_app({'first_name': ''}))[1];
      expect(section.items.first.done, isFalse);
    });
  });

  group('move-in section', () {
    test('needs date, frequency and duration', () {
      final section = buildApplicationChecklist(
        _app({
          'desired_move_in_date': '2026-08-01T00:00:00Z',
          'stay_duration_frequency': 'MONTHLY',
          'stay_duration': 12,
        }),
      )[2];
      expect(section.items, hasLength(3));
      expect(section.complete, isTrue);
    });
  });

  group('financial section', () {
    test('derives invoice generated/paid from the invoice', () {
      final unpaid = buildApplicationChecklist(
        _app({
          'rent_fee': 1000,
          'payment_frequency': 'MONTHLY',
          'application_payment_invoice': {
            'id': 'i',
            'code': 'c',
            'status': 'ISSUED',
          },
        }),
      )[3];
      expect(unpaid.items[2].done, isTrue);
      expect(unpaid.items[3].done, isFalse);
      expect(unpaid.complete, isFalse);

      final paid = buildApplicationChecklist(
        _app({
          'rent_fee': 1000,
          'payment_frequency': 'MONTHLY',
          'application_payment_invoice': {
            'id': 'i',
            'code': 'c',
            'status': 'PAID',
          },
        }),
      )[3];
      expect(paid.complete, isTrue);
    });
  });

  group('docs section', () {
    test('is empty when no document mode is set', () {
      expect(buildApplicationChecklist(_app({}))[4].items, isEmpty);
    });

    test('ONLINE resolves upload against the document id', () {
      expect(
        buildApplicationChecklist(
          _app({
            'lease_agreement_document_mode': 'ONLINE',
            'lease_agreement_document_id': 'doc-1',
          }),
        )[4].items.first.done,
        isTrue,
      );
      expect(
        buildApplicationChecklist(
          _app({'lease_agreement_document_mode': 'ONLINE'}),
        )[4].items.first.done,
        isFalse,
      );
    });

    test('MANUAL resolves upload against the url and auto-signs', () {
      final section = buildApplicationChecklist(
        _app({
          'lease_agreement_document_mode': 'MANUAL',
          'lease_agreement_document_url': 'https://x/y.pdf',
        }),
      )[4];
      expect(section.items.map((i) => i.label), [
        'Document uploaded',
        'Manager signed',
        'Tenant signed',
      ]);
      expect(section.complete, isTrue);
    });

    test('ONLINE marks manager/tenant from matching signature rows', () {
      final section = buildApplicationChecklist(
        _app({
          'lease_agreement_document_mode': 'ONLINE',
          'lease_agreement_document_id': 'doc-1',
          'lease_agreement_document_signatures': [
            {'id': 's1', 'document_id': 'doc-1', 'role': 'PROPERTY_MANAGER'},
            {'id': 's2', 'document_id': 'other-doc', 'role': 'TENANT'},
          ],
        }),
      )[4];
      expect(section.items[1].done, isTrue);
      expect(section.items[2].done, isFalse);
    });

    test('appends one row per witness node, tagged when a role repeats', () {
      final section = buildApplicationChecklist(
        _app({
          'lease_agreement_document_mode': 'ONLINE',
          'lease_agreement_document_id': 'doc-1',
          'lease_agreement_document': {
            'id': 'doc-1',
            'content': _witnessContent([
              {'type': 'signature', 'role': 'pm_witness', 'label': 'PM W'},
              {'type': 'signature', 'role': 'pm_witness', 'label': 'PM W'},
              {'type': 'signature', 'role': 'tenant_witness', 'label': 'T W'},
            ]),
          },
          'lease_agreement_document_signatures': [
            {'id': 's1', 'document_id': 'doc-1', 'role': 'PM_WITNESS'},
          ],
        }),
      )[4];

      expect(section.items.map((i) => i.label), [
        'Document uploaded',
        'Manager signed',
        'Tenant signed',
        'PM W #1 signed',
        'PM W #2 signed',
        'T W signed',
      ]);
      expect(section.items[3].done, isTrue);
      expect(section.items[4].done, isFalse);
    });

    test('a single witness of a role carries no #n tag', () {
      final section = buildApplicationChecklist(
        _app({
          'lease_agreement_document_mode': 'ONLINE',
          'lease_agreement_document_id': 'doc-1',
          'lease_agreement_document': {
            'id': 'doc-1',
            'content': _witnessContent([
              {'type': 'signature', 'role': 'pm_witness', 'label': 'Sole'},
            ]),
          },
        }),
      )[4];
      expect(section.items.last.label, 'Sole signed');
    });
  });

  group('aggregates', () {
    test('progress counts complete sections out of five', () {
      expect(applicationProgress(_app({})), 0);
      expect(applicationProgress(_app({'desired_unit': _unit})), 20);
    });

    test('empty docs section passes the approval gate vacuously', () {
      final app = _app({
        ..._completeTenant,
        'desired_unit': _unit,
        'desired_move_in_date': '2026-08-01T00:00:00Z',
        'stay_duration_frequency': 'MONTHLY',
        'stay_duration': 12,
        'rent_fee': 1000,
        'payment_frequency': 'MONTHLY',
        'application_payment_invoice': {
          'id': 'i',
          'code': 'c',
          'status': 'PAID',
        },
      });
      expect(canApproveApplication(app), isTrue);
      // ...but it still reads as 4/5 complete for display.
      expect(applicationProgress(app), 80);
    });

    test('an incomplete section blocks approval', () {
      expect(canApproveApplication(_app({})), isFalse);
    });
  });
}
