import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';

const _baseLeaseJson = <String, dynamic>{
  'id': 'l1',
  'code': 'L-1',
  'status': 'Lease.Status.Active',
  'unit_id': 'u1',
  'tenant_id': 't1',
  'rent_fee': 120000,
  'rent_fee_currency': 'GHS',
};

void main() {
  test('LeaseModel reads financial_account', () {
    final l = LeaseModel.fromJson({
      ..._baseLeaseJson,
      'financial_account': {
        'id': 'fa1',
        'currency': 'GHS',
        'outstanding_amount': 45000,
        'available_credit': 0,
      },
    });
    expect(l.financialAccount?.outstandingAmount, 45000);
    expect(l.financialAccount?.currency, 'GHS');
  });

  test('financial_account amounts default to 0 when absent', () {
    final l = LeaseModel.fromJson({
      ..._baseLeaseJson,
      'financial_account': {'id': 'fa1', 'currency': 'GHS'},
    });
    expect(l.financialAccount?.outstandingAmount, 0);
    expect(l.financialAccount?.availableCredit, 0);
  });

  test('LeaseModel without financial_account is null', () {
    expect(LeaseModel.fromJson(_baseLeaseJson).financialAccount, isNull);
  });
}
