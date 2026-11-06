import 'package:flutter/material.dart';

import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class BillRow extends StatelessWidget {
  const BillRow({
    super.key,
    required this.bill,
    required this.paidView,
    required this.now,
    required this.onTap,
  });

  final InvoiceModel bill;
  final bool paidView;
  final DateTime now;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final where = [
      bill.payerLease?.unit?.name,
      bill.property?.name,
    ].whereType<String>().where((v) => v.isNotEmpty).join(' · ');
    final amount = paidView ? bill.totalAmount : billRemaining(bill);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payerName(bill),
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  if (where.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      where,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  RLPill(
                    billDueLabel(bill, now),
                    tone: isOverdue(bill, now)
                        ? RLTone.danger
                        : paidView
                        ? RLTone.success
                        : RLTone.neutral,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                RLMoney(
                  pesewasToCedis(amount),
                  size: 20,
                  currency: currencySymbol(bill.currency),
                ),
                const SizedBox(height: 4),
                Text(
                  bill.code,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 11,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
