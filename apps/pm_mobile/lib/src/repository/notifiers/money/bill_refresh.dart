import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';

void refreshBill(
  Ref ref, {
  required String propertyId,
  required String invoiceId,
  required bool changed,
  String? financialAccountId,
}) {
  ref.invalidate(billDetailProvider(propertyId, invoiceId));
  if (!changed) return;
  ref.invalidate(billsNotifierProvider);
  ref.invalidate(propertyStatsProvider(propertyId));
  if (financialAccountId != null) {
    ref.invalidate(financialAccountProvider(propertyId, financialAccountId));
  }
}
