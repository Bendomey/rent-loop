import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

/// A desired_unit payload with every field UnitModel requires as non-nullable.
const _unit = {
  'id': 'unit-1',
  'name': 'Unit 1C',
  'type': 'APARTMENT',
  'status': 'Unit.Status.Available',
  'rent_fee': 300000,
  'rent_fee_currency': 'GHS',
};

void main() {
  group('TenantApplicationModel.fromJson', () {
    test('parses a full listing row', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'app-1',
        'code': 'TA-0001',
        'status': 'TenantApplication.Status.InProgress',
        'first_name': 'Adjoa',
        'last_name': 'Frimpong',
        'email': 'adjoa@example.com',
        'phone': '+233261185540',
        'gender': 'FEMALE',
        'marital_status': 'SINGLE',
        'date_of_birth': '1995-03-02T00:00:00Z',
        'nationality': 'Ghanaian',
        'id_type': 'GHANA_CARD',
        'id_number': 'GHA-123',
        'current_address': 'Cantonments',
        'emergency_contact_name': 'Yaa',
        'emergency_contact_phone': '+233200000000',
        'relationship_to_emergency_contact': 'Sister',
        'employer_type': 'EMPLOYED',
        'occupation': 'Engineer',
        'employer': 'Acme',
        'occupation_address': 'Airport City',
        'desired_unit_id': 'unit-1',
        'desired_unit': _unit,
        'desired_move_in_date': '2026-08-01T00:00:00Z',
        'stay_duration': 12,
        'stay_duration_frequency': 'MONTHLY',
        'rent_fee': 300000,
        'payment_frequency': 'MONTHLY',
        'application_payment_invoice': {
          'id': 'inv-1',
          'code': 'INV-1',
          'status': 'PAID',
        },
        'lease_agreement_document_mode': 'ONLINE',
        'lease_agreement_document_id': 'doc-1',
        'lease_agreement_document': {'id': 'doc-1', 'content': '{}'},
        'lease_agreement_document_signatures': [
          {'id': 'sig-1', 'document_id': 'doc-1', 'role': 'TENANT'},
        ],
        'created_at': '2026-07-01T10:00:00Z',
      });

      expect(model.id, 'app-1');
      expect(model.status, 'TenantApplication.Status.InProgress');
      expect(model.firstName, 'Adjoa');
      expect(model.desiredUnit?.name, 'Unit 1C');
      expect(model.applicationPaymentInvoice?.isPaid, isTrue);
      expect(model.leaseAgreementDocument?.content, '{}');
      expect(model.leaseAgreementDocumentSignatures?.single.role, 'TENANT');
      expect(model.stayDuration, 12);
      expect(model.dateOfBirth?.year, 1995);
    });

    test('parses a minimal row with every optional field absent', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'app-2',
        'code': 'TA-0002',
      });

      expect(model.id, 'app-2');
      expect(model.firstName, isNull);
      expect(model.desiredUnit, isNull);
      expect(model.applicationPaymentInvoice, isNull);
      expect(model.leaseAgreementDocumentSignatures, isNull);
      expect(model.fullName, '');
    });

    test('exposes a trimmed full name including other names', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'a',
        'code': 'c',
        'first_name': 'Adjoa',
        'other_names': 'Serwaa',
        'last_name': 'Frimpong',
      });
      expect(model.fullName, 'Adjoa Serwaa Frimpong');
    });

    test('an invoice without PAID status is not paid', () {
      final model = TenantApplicationModel.fromJson({
        'id': 'a',
        'code': 'c',
        'application_payment_invoice': {
          'id': 'i',
          'code': 'INV',
          'status': 'ISSUED',
        },
      });
      expect(model.applicationPaymentInvoice?.isPaid, isFalse);
    });
  });
}
