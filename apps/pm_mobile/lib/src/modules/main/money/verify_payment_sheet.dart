import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/financial/payment_providers.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/verify_payment_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String paymentProviderLabel(String? provider) {
  for (final p in paymentProviders) {
    if (p.value == provider) return p.label;
  }
  return provider == null || provider.isEmpty ? 'Offline' : provider;
}

class VerifyPaymentSheet extends ConsumerStatefulWidget {
  const VerifyPaymentSheet({
    super.key,
    required this.bill,
    required this.payment,
    required this.propertyId,
    required this.onClose,
    this.startDeclined = false,
  });

  final InvoiceModel bill;
  final InvoicePaymentModel payment;
  final String propertyId;
  final VoidCallback onClose;
  final bool startDeclined;

  @override
  ConsumerState<VerifyPaymentSheet> createState() => _VerifyPaymentSheetState();
}

class _VerifyPaymentSheetState extends ConsumerState<VerifyPaymentSheet> {
  final _reason = TextEditingController();
  late bool _declining = widget.startDeclined;
  bool _submitting = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit(bool received) async {
    if (_submitting) return;
    setState(() => _submitting = true);
    await Haptics.vibrate(HapticsType.medium);
    final reason = _reason.text.trim();
    final notifier = ref.read(verifyPaymentNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      invoiceId: widget.bill.id,
      paymentId: widget.payment.id,
      received: received,
      reason: received || reason.isEmpty ? null : reason,
      financialAccountId: widget.bill.financialAccountId,
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ref.read(verifyPaymentNotifierProvider).status.isSuccess()) {
      notifier.reset();
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: received
            ? 'Payment confirmed as received'
            : 'Payment marked as not received',
      );
      widget.onClose();
    }
  }

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            color: RLTokens.muted,
          ),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: RLTokens.ink,
            ),
          ),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(verifyPaymentNotifierProvider);
    final pending = _submitting || state.status == ApiStatus.pending;
    final p = widget.payment;
    final reported = DateTime.tryParse(p.createdAt);
    final reference = p.reference;

    return RLSheet(
      title: 'Did you receive this payment?',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: _declining ? 'Confirm not received' : 'Payment received',
        confirmKind: _declining ? RLBtnKind.danger : RLBtnKind.primary,
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending,
        onConfirm: () => _submit(!_declining),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _row('Amount', formatPesewas(p.amount, code: widget.bill.currency)),
          _row('How they paid', paymentProviderLabel(p.provider)),
          if (reference != null && reference.isNotEmpty)
            _row('Reference', reference),
          if (reported != null) _row('Reported', formatDay(reported)),
          const SizedBox(height: 14),
          if (_declining)
            RLSheetTextArea(
              label: 'Why not? (optional)',
              controller: _reason,
              lines: 3,
            )
          else
            RLBtn(
              label: 'Not received',
              kind: RLBtnKind.light,
              full: true,
              onPressed: pending
                  ? null
                  : () => setState(() => _declining = true),
            ),
          if (state.status.isFailed() && state.errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.danger,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
