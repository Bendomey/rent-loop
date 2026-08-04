import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';

void main() {
  test(
    'PaymentAccountModel.fromJson parses id and ignores unmodeled fields',
    () {
      final json = {'id': 'pa-1', 'provider': 'MTN_MOMO'};

      final model = PaymentAccountModel.fromJson(json);

      expect(model.id, 'pa-1');
    },
  );
}
