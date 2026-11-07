import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/financial/payment_providers.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/record_bill_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/payment_accounts_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

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

class RecordBillPaymentSheet extends ConsumerStatefulWidget {
  const RecordBillPaymentSheet({
    super.key,
    required this.bill,
    required this.propertyId,
    required this.onClose,
  });

  final InvoiceModel bill;
  final String propertyId;
  final VoidCallback onClose;

  @override
  ConsumerState<RecordBillPaymentSheet> createState() =>
      _RecordBillPaymentSheetState();
}

class _RecordBillPaymentSheetState
    extends ConsumerState<RecordBillPaymentSheet> {
  final _amount = TextEditingController();
  final _reference = TextEditingController();
  String _provider = paymentProviders.first.value;
  String? _accountId;
  int _minor = 0;
  bool _invalid = false;
  bool _submitting = false;

  late final int _remaining = billRemaining(widget.bill);

  @override
  void dispose() {
    _amount.dispose();
    _reference.dispose();
    super.dispose();
  }

  String _money(int minor) => formatPesewas(minor, code: widget.bill.currency);

  static final _amountPattern = RegExp(r'^\d+(\.\d{1,2})?$');

  void _amountChanged(String value) {
    final text = value.replaceAll(RegExp(r'[,\s]'), '');
    final valid = _amountPattern.hasMatch(text);
    setState(() {
      _invalid = text.isNotEmpty && !valid;
      _minor = valid ? cedisToPesewas(double.parse(text)) : 0;
    });
  }

  Future<void> _payAll() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      _minor = _remaining;
      _invalid = false;
      _amount.text = cedisInputText(_remaining);
    });
  }

  Future<void> _submit(String paymentAccountId) async {
    if (_submitting) return;
    setState(() => _submitting = true);
    await Haptics.vibrate(HapticsType.medium);
    final amount = _minor;
    final reference = _reference.text.trim();
    final notifier = ref.read(recordBillPaymentNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      invoiceId: widget.bill.id,
      amount: amount,
      paymentAccountId: paymentAccountId,
      provider: _provider,
      reference: reference.isEmpty ? null : reference,
      financialAccountId: widget.bill.financialAccountId,
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ref.read(recordBillPaymentNotifierProvider).status.isSuccess()) {
      notifier.reset();
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: '${_money(amount)} recorded.',
      );
      widget.onClose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recordBillPaymentNotifierProvider);
    final accounts = ref.watch(paymentAccountsProvider);
    final list = accounts.valueOrNull;
    final chosen = list == null || list.isEmpty
        ? null
        : (list.where((a) => a.id == _accountId).firstOrNull ?? list.first);
    final pending = _submitting || state.status == ApiStatus.pending;
    final tooMuch = _minor > _remaining;

    return RLSheet(
      title: 'Record a payment',
      desc: '${payerName(widget.bill)} still owes ${_money(_remaining)}.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: 'Save',
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending && _minor > 0 && !tooMuch && chosen != null,
        onConfirm: () => _submit(chosen!.id),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLSheetField(
            label: 'How much did they hand over?',
            controller: _amount,
            hint: '0.00',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: _amountChanged,
          ),
          if (_invalid) ...[
            const SizedBox(height: 6),
            const Text(
              'Enter an amount like 120.50.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: RLTokens.warning,
                height: 1.45,
              ),
            ),
          ],
          if (tooMuch) ...[
            const SizedBox(height: 6),
            const Text(
              'That is more than the bill has left on it.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: RLTokens.warning,
                height: 1.45,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: ActionChip(
              label: Text('They paid it all · ${_money(_remaining)}'),
              onPressed: _payAll,
            ),
          ),
          const SizedBox(height: 18),
          const Text('How did they pay?', style: _labelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final p in paymentProviders)
                ChoiceChip(
                  label: Text(p.label),
                  selected: _provider == p.value,
                  onSelected: (_) => setState(() => _provider = p.value),
                ),
            ],
          ),
          const SizedBox(height: 18),
          const Text('Mode of payment?', style: _labelStyle),
          const SizedBox(height: 8),
          _accountsView(accounts, list, chosen),
          const SizedBox(height: 18),
          RLSheetField(label: 'Receipt no. (optional)', controller: _reference),
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

  Widget _accountsView(
    AsyncValue<List<PaymentAccountModel>> accounts,
    List<PaymentAccountModel>? list,
    PaymentAccountModel? chosen,
  ) {
    if (list == null) {
      return accounts.hasError
          ? RLSectionError(
              title: "Couldn't load your payment accounts",
              onRetry: () => ref.invalidate(paymentAccountsProvider),
            )
          : Container(
              height: 48,
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
            );
    }
    if (list.isEmpty) {
      return const Text(
        'Add a payment account on the web first.',
        style: _mutedStyle,
      );
    }
    return Column(
      children: [
        for (final a in list)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                setState(() => _accountId = a.id);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: a.id == chosen?.id
                      ? RLTokens.crimsonTint
                      : RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                  border: Border.all(
                    color: a.id == chosen?.id
                        ? RLTokens.crimsonTint2
                        : RLTokens.hairline,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        a.identifier == null || a.identifier!.isEmpty
                            ? paymentRailLabel(a.rail)
                            : '${paymentRailLabel(a.rail)} · ${a.identifier}',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                    if (a.id == chosen?.id)
                      const Icon(
                        Icons.check_rounded,
                        size: 18,
                        color: RLTokens.crimson,
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
