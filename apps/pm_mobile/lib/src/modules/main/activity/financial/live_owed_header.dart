import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/lib/financial/account_view.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class LiveOwedHeader extends StatelessWidget {
  const LiveOwedHeader({
    super.key,
    required this.application,
    required this.detail,
    required this.canEdit,
    this.onRecordPayment,
    this.onAddFee,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final bool canEdit;
  final VoidCallback? onRecordPayment;
  final VoidCallback? onAddFee;

  @override
  Widget build(BuildContext context) {
    final name = application.firstName ?? 'The tenant';
    final currency = detail.account.currency;
    String money(int minor) => formatPesewas(minor, code: currency);
    final late = lateAmount(detail.charges, DateTime.now());
    final next = nextBill(detail, DateTime.now());
    final owed = detail.outstandingAmount;
    final headline = owed < 0
        ? 'You owe $name'
        : owed == 0
        ? '$name is all paid up'
        : '$name still owes you';

    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            headline,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: RLMoney(
              pesewasToCedis(owed.abs()),
              size: 34,
              currency: currencySymbol(currency),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                late > 0 ? Icons.warning_rounded : Icons.check_circle_rounded,
                size: 16,
                color: late > 0 ? RLTokens.warning : RLTokens.success,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  late > 0 ? 'Late ${money(late)}' : 'Nothing is late',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: late > 0 ? RLTokens.warning : RLTokens.success,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          _Line('Paid ${money(detail.totalSettled)}'),
          if (next != null)
            _Line(
              'Next bill ${money(next.amount)} · sent '
              '${next.tonight ? 'tonight' : formatDay(next.sendDate)}',
            ),
          if (canEdit) ...[
            const SizedBox(height: 16),
            RLBtn(
              label: '$name paid me',
              icon: Icons.check_rounded,
              full: true,
              onPressed: onRecordPayment,
            ),
            const SizedBox(height: 8),
            RLBtn(
              label: 'Add a fee',
              kind: RLBtnKind.light,
              icon: Icons.add_rounded,
              full: true,
              onPressed: onAddFee,
            ),
          ],
        ],
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 2),
    child: Text(
      text,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 13.5,
        color: RLTokens.muted,
      ),
    ),
  );
}
