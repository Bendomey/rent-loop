import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/lib/financial/account_view.dart';
import 'package:rentloop_manager/src/lib/financial/allocation.dart';
import 'package:rentloop_manager/src/lib/financial/financial_mode.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/live_charges_card.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/live_owed_header.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/live_plan_cards.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class FinancialLiveView extends StatelessWidget {
  const FinancialLiveView({
    super.key,
    required this.application,
    required this.detail,
    required this.propertyId,
    required this.mode,
    required this.canEdit,
    this.onRecordPayment,
    this.onAddFee,
    this.onRefund,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final String propertyId;
  final FinancialMode mode;
  final bool canEdit;
  final VoidCallback? onRecordPayment;
  final VoidCallback? onAddFee;
  final VoidCallback? onRefund;

  @override
  Widget build(BuildContext context) {
    final editable = canEdit && mode != FinancialMode.readonly;
    final canRefund = editable && refundableCharges(detail.charges).isNotEmpty;
    final askPaid = editable && firstBillDueSoon(detail, DateTime.now());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (askPaid) ...[
          _PaidAlreadyCard(
            name: application.firstName ?? 'The tenant',
            onRecordPayment: onRecordPayment,
          ),
          const SizedBox(height: 14),
        ],
        LiveOwedHeader(
          application: application,
          detail: detail,
          canEdit: editable,
          onRecordPayment: onRecordPayment,
          onAddFee: onAddFee,
        ),
        const SizedBox(height: 14),
        LiveChargesCard(
          application: application,
          detail: detail,
          propertyId: propertyId,
          canEdit: editable,
        ),
        if (canRefund) ...[
          const SizedBox(height: 14),
          RLCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Paid something by mistake?',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 10),
                RLBtn(
                  label: 'Refund a payment',
                  kind: RLBtnKind.light,
                  icon: Icons.undo_rounded,
                  full: true,
                  onPressed: onRefund,
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        LivePlanCard(
          application: application,
          detail: detail,
          propertyId: propertyId,
          canEdit: editable,
        ),
        const SizedBox(height: 14),
        LiveRentCard(
          application: application,
          detail: detail,
          propertyId: propertyId,
          locked:
              mode == FinancialMode.locked || mode == FinancialMode.readonly,
          canEdit: editable,
        ),
      ],
    );
  }
}

class _PaidAlreadyCard extends StatelessWidget {
  const _PaidAlreadyCard({required this.name, this.onRecordPayment});

  final String name;
  final VoidCallback? onRecordPayment;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const ValueKey('paid-already'),
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.crimsonTint2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Already been paid? Record it now — the first bill goes out tonight.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              color: RLTokens.ink,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 12),
          RLBtn(
            label: '$name paid me',
            kind: RLBtnKind.primary,
            icon: Icons.check_rounded,
            full: true,
            onPressed: onRecordPayment,
          ),
        ],
      ),
    );
  }
}
