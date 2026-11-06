import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/financial/allocation.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/refund_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

const _labelStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 13.5,
  fontWeight: FontWeight.w600,
  color: RLTokens.ink,
);

const _mutedStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 12.5,
  color: RLTokens.muted,
  height: 1.45,
);

class RefundSheet extends ConsumerStatefulWidget {
  const RefundSheet({
    super.key,
    required this.application,
    required this.detail,
    required this.propertyId,
    required this.onClose,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final String propertyId;
  final VoidCallback onClose;

  @override
  ConsumerState<RefundSheet> createState() => _RefundSheetState();
}

class _RefundSheetState extends ConsumerState<RefundSheet> {
  var _picked = <String>{};
  final _done = <String>{};

  late final List<ChargeModel> _refundable = refundableCharges(
    widget.detail.charges,
  );

  List<ChargeModel> get _listed => [
    for (final c in _refundable)
      if (!_done.contains(c.id)) c,
  ];

  int _owed(ChargeModel c) => refundableAmount(c, widget.detail.charges);

  String _money(int minor) =>
      formatPesewas(minor, code: widget.detail.account.currency);

  List<({ChargeModel charge, int amount})> get _chosen => [
    for (final c in _listed)
      if (_picked.contains(c.id)) (charge: c, amount: _owed(c)),
  ];

  Future<void> _tick(ChargeModel charge) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      if (!_picked.remove(charge.id)) _picked.add(charge.id);
    });
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.medium);
    final total = _chosen.fold(0, (sum, r) => sum + r.amount);
    final notifier = ref.read(refundNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      applicationId: widget.application.id,
      accountId: widget.detail.account.id,
      refunds: _chosen,
    );
    if (!mounted) return;
    final state = ref.read(refundNotifierProvider);
    if (state.status.isSuccess() && state.failedNames.isEmpty) {
      notifier.reset();
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: '${_money(total)} refund recorded.',
      );
      widget.onClose();
    } else if (state.status.isSuccess()) {
      setState(() {
        _done.addAll(_picked.difference(state.failedIds.toSet()));
        _picked = state.failedIds.toSet();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(refundNotifierProvider);
    final pending = state.status == ApiStatus.pending;
    final name = widget.application.firstName ?? 'the tenant';
    final total = _chosen.fold(0, (sum, r) => sum + r.amount);

    return RLSheet(
      title: 'What are you giving back to $name?',
      desc: 'Tick what to refund. Each one is refunded in full.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: 'Record refund',
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending && _picked.isNotEmpty,
        onConfirm: _submit,
      ),
      child: _listed.isEmpty
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text(
                'Nothing has been paid that can be refunded.',
                textAlign: TextAlign.center,
                style: _mutedStyle,
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final charge in _listed) _row(charge),
                const SizedBox(height: 12),
                const Text(
                  'This only records the refund. Give the money back to the '
                  'tenant yourself.',
                  style: _mutedStyle,
                ),
                const SizedBox(height: 14),
                Text(
                  'Refunding ${_money(total)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: RLTokens.ink,
                  ),
                ),
                if (state.failedNames.isNotEmpty && !pending) ...[
                  const SizedBox(height: 12),
                  Text(
                    'These refunds could not be recorded: '
                    '${state.failedNames.join(', ')}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.danger,
                    ),
                  ),
                ] else if (state.status.isFailed() &&
                    state.errorMessage != null) ...[
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

  Widget _row(ChargeModel charge) {
    final on = _picked.contains(charge.id);
    return InkWell(
      onTap: () => _tick(charge),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(
              on ? Icons.check_box_rounded : Icons.check_box_outline_blank,
              color: on ? RLTokens.crimson : RLTokens.micro,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    charge.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: _labelStyle,
                  ),
                  Text('Paid ${_money(_owed(charge))}', style: _mutedStyle),
                ],
              ),
            ),
            Text(
              _money(_owed(charge)),
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: on ? RLTokens.ink : RLTokens.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
