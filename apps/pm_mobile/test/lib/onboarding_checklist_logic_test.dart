import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/onboarding_checklist_logic.dart';
import 'package:rentloop_manager/src/repository/models/agreement_model.dart';

AgreementModel _agreement({required bool accepted}) => AgreementModel(
  id: 'agreement-${accepted ? 'a' : 'b'}',
  name: 'Agreement',
  userHasAccepted: accepted,
);

void main() {
  group('computeHasAcceptedAllAgreements', () {
    test('owner with all agreements accepted returns true', () {
      final result = computeHasAcceptedAllAgreements(
        isOwner: true,
        agreements: [_agreement(accepted: true), _agreement(accepted: true)],
      );
      expect(result, isTrue);
    });

    test('owner with one unaccepted agreement returns false', () {
      final result = computeHasAcceptedAllAgreements(
        isOwner: true,
        agreements: [_agreement(accepted: true), _agreement(accepted: false)],
      );
      expect(result, isFalse);
    });

    test('non-owner always returns true regardless of agreements', () {
      final result = computeHasAcceptedAllAgreements(
        isOwner: false,
        agreements: [_agreement(accepted: false)],
      );
      expect(result, isTrue);
    });
  });

  group('computeIsIdentityComplete', () {
    test('company is always complete', () {
      final result = computeIsIdentityComplete(
        isIndividual: false,
        idType: null,
        idNumber: null,
      );
      expect(result, isTrue);
    });

    test('individual with both id fields present is complete', () {
      final result = computeIsIdentityComplete(
        isIndividual: true,
        idType: 'NATIONAL_ID',
        idNumber: 'GHA-123456789-0',
      );
      expect(result, isTrue);
    });

    test('individual missing id_number is incomplete', () {
      final result = computeIsIdentityComplete(
        isIndividual: true,
        idType: 'NATIONAL_ID',
        idNumber: null,
      );
      expect(result, isFalse);
    });

    test('individual missing both id fields is incomplete', () {
      final result = computeIsIdentityComplete(
        isIndividual: true,
        idType: null,
        idNumber: null,
      );
      expect(result, isFalse);
    });
  });
}
