import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/constants.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/api_state.dart';

part 'create_offline_payment_notifier.g.dart';

class CreateOfflinePaymentState extends ApiState {
  CreateOfflinePaymentState({super.status, super.errorMessage});
}

@riverpod
class CreateOfflinePaymentNotifier extends _$CreateOfflinePaymentNotifier {
  @override
  CreateOfflinePaymentState build() => CreateOfflinePaymentState();

  /// Submits an offline payment record. Returns true on success.
  Future<bool> submit({
    required String invoiceId,
    required String paymentAccountId,
    required String provider,
    required int amount,
    String? reference,
  }) async {
    state = CreateOfflinePaymentState(status: ApiStatus.pending);
    try {
      final token = await ref.read(tokenManagerProvider).get();
      if (token == null) throw Exception('Unauthenticated');

      final uri = Uri.parse('$API_BASE_URL/api/v1/payments/offline:initiate');
      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'invoice_id': invoiceId,
          'payment_account_id': paymentAccountId,
          'provider': provider,
          'amount': amount,
          if (reference != null && reference.isNotEmpty) 'reference': reference,
        }),
      );

      if (response.statusCode >= 400) {
        throw ApiException(response.statusCode, response.body);
      }

      state = CreateOfflinePaymentState(status: ApiStatus.success);
      return true;
    } on ApiException catch (e) {
      state = CreateOfflinePaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return false;
    } catch (_) {
      state = CreateOfflinePaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }
  }
}
