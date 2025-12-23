import 'package:rentloop_go/src/architecture/architecture.dart';

class MoneyLib {
  static String formatMoney(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_GH',
      symbol: 'GH₵ ',
      decimalDigits: 2,
    );

    return formatter.format(amount);
  }
}
