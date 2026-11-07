import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/void_charge_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

const removeReasons = [
  'Charged in error',
  'Waived for the tenant',
  'Duplicate',
];

class RemoveFeeSheet extends ConsumerStatefulWidget {
  const RemoveFeeSheet({
    super.key,
    required this.charge,
    required this.propertyId,
    required this.applicationId,
    required this.accountId,
    required this.onClose,
  });

  final ChargeModel charge;
  final String propertyId;
  final String applicationId;
  final String accountId;
  final VoidCallback onClose;

  @override
  ConsumerState<RemoveFeeSheet> createState() => _RemoveFeeSheetState();
}

class _RemoveFeeSheetState extends ConsumerState<RemoveFeeSheet> {
  final _reason = TextEditingController(text: removeReasons.first);

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(voidChargeNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      applicationId: widget.applicationId,
      accountId: widget.accountId,
      chargeId: widget.charge.id,
      reason: _reason.text.trim(),
    );
    if (!mounted) return;
    if (ref.read(voidChargeNotifierProvider).status.isSuccess()) {
      notifier.reset();
      widget.onClose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(voidChargeNotifierProvider);
    final charge = widget.charge;
    final pending = state.status == ApiStatus.pending;
    return RLSheet(
      title: 'Remove this fee?',
      desc:
          '${charge.name} · ${formatPesewas(charge.amount, code: charge.currency)}. '
          'It stops counting toward what they owe but stays in the record.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: 'Remove fee',
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending && _reason.text.trim().isNotEmpty,
        onConfirm: _submit,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLSheetField(
            label: 'Reason',
            controller: _reason,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final preset in removeReasons)
                ChoiceChip(
                  label: Text(preset),
                  selected: _reason.text == preset,
                  onSelected: (_) => setState(() => _reason.text = preset),
                ),
            ],
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
