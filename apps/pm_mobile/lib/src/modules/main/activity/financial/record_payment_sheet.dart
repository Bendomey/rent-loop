import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/financial/allocation.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/financial/payment_providers.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/record_payment_notifier.dart';
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

int _open(ChargeModel c) => c.amount - c.invoicedAmount;

int _onBill(ChargeModel c) => c.invoicedAmount - c.settledAmount;

const _warningStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 12.5,
  fontWeight: FontWeight.w600,
  color: RLTokens.warning,
  height: 1.45,
);

class RecordPaymentSheet extends ConsumerStatefulWidget {
  const RecordPaymentSheet({
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
  ConsumerState<RecordPaymentSheet> createState() => _RecordPaymentSheetState();
}

class _RecordPaymentSheetState extends ConsumerState<RecordPaymentSheet> {
  final _typed = TextEditingController();
  final _picked = <String, int>{};
  String _provider = paymentProviders.first.value;
  String? _accountId;

  int _typedMinor = 0;

  late final List<ChargeModel> _payable = payableCharges(widget.detail.charges);
  late final List<ChargeModel> _billed = [
    for (final c in widget.detail.charges)
      if (c.voidedAt == null && c.amount > 0 && _onBill(c) > 0) c,
  ];

  @override
  void dispose() {
    _typed.dispose();
    super.dispose();
  }

  String _money(int minor) =>
      formatPesewas(minor, code: widget.detail.account.currency);

  int get _total => _picked.values.fold(0, (sum, v) => sum + v);

  List<({String chargeId, int amount})> get _claims => [
    for (final c in _payable)
      if (_picked.containsKey(c.id)) (chargeId: c.id, amount: _picked[c.id]!),
  ];

  Future<void> _tick(ChargeModel charge) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      if (_picked.remove(charge.id) == null) _picked[charge.id] = _open(charge);
      _typed.clear();
      _typedMinor = 0;
    });
  }

  void _typedChanged(String value) {
    final minor = cedisToPesewas(
      double.tryParse(value.replaceAll(',', '')) ?? 0,
    );
    setState(() {
      _typedMinor = minor;
      _picked
        ..clear()
        ..addEntries(
          allocateAmount(
            _payable,
            minor,
          ).map((l) => MapEntry(l.chargeId, l.amount)),
        );
    });
  }

  Future<void> _everything() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      _picked
        ..clear()
        ..addEntries(_payable.map((c) => MapEntry(c.id, _open(c))));
      _typedMinor = _total;
      _typed.text = cedisInputText(_total);
    });
  }

  Future<void> _clear() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() {
      _picked.clear();
      _typed.clear();
      _typedMinor = 0;
    });
  }

  Future<void> _submit(String paymentAccountId) async {
    await Haptics.vibrate(HapticsType.medium);
    final total = _total;
    final notifier = ref.read(recordPaymentNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      applicationId: widget.application.id,
      accountId: widget.detail.account.id,
      claims: _claims,
      paymentAccountId: paymentAccountId,
      provider: _provider,
    );
    if (!mounted) return;
    if (ref.read(recordPaymentNotifierProvider).status.isSuccess()) {
      notifier.reset();
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: '${_money(total)} recorded. A receipt is on its way.',
      );
      widget.onClose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recordPaymentNotifierProvider);
    final accounts = ref.watch(paymentAccountsProvider);
    final list = accounts.valueOrNull;
    final chosen = list == null || list.isEmpty
        ? null
        : (list.where((a) => a.id == _accountId).firstOrNull ?? list.first);
    final pending = state.status == ApiStatus.pending;
    final name = widget.application.firstName ?? 'the tenant';

    return RLSheet(
      title: 'What did $name pay for?',
      desc:
          'Tick what the money covers, or type what came in and we’ll work it '
          'out from the oldest first.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: 'Save this payment',
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending && _total > 0 && chosen != null,
        onConfirm: () => _submit(chosen!.id),
      ),
      child: _payable.isEmpty
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text(
                'Everything is already on a bill. Record it from the bill on '
                'the web.',
                textAlign: TextAlign.center,
                style: _mutedStyle,
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RLSheetField(
                  label: 'They paid (${widget.detail.account.currency})',
                  controller: _typed,
                  hint: '0.00',
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: _typedChanged,
                ),
                const SizedBox(height: 4),
                const Text(
                  'Fills the oldest first, including the deposit and fees.',
                  style: _mutedStyle,
                ),
                if (_typedMinor > _total) ...[
                  const SizedBox(height: 6),
                  Text(
                    "That's ${_money(_typedMinor - _total)} more than $name "
                    'owes. Only ${_money(_total)} will be recorded.',
                    style: _warningStyle,
                  ),
                ],
                const SizedBox(height: 12),
                for (final charge in _payable) _chargeRow(charge),
                if (_billed.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Already on a bill — record that one on the web.',
                    style: _mutedStyle,
                  ),
                  for (final charge in _billed) _billedRow(charge),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      label: Text(
                        'They paid everything · '
                        '${_money(_payable.fold(0, (s, c) => s + _open(c)))}',
                      ),
                      onPressed: _everything,
                    ),
                    ActionChip(label: const Text('Clear'), onPressed: _clear),
                  ],
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
                const Text('Mode of payment', style: _labelStyle),
                const SizedBox(height: 8),
                _accountsView(accounts, list, chosen),
                const SizedBox(height: 18),
                Text(
                  'Recording ${_money(_total)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: RLTokens.ink,
                  ),
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

  Widget _billedRow(ChargeModel charge) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                charge.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _labelStyle.copyWith(color: RLTokens.muted),
              ),
              Text(
                'Due ${formatDay(DateTime.parse(charge.dueDate))}',
                style: _mutedStyle,
              ),
            ],
          ),
        ),
        Text(_money(_onBill(charge)), style: _mutedStyle),
      ],
    ),
  );

  Widget _chargeRow(ChargeModel charge) {
    final on = _picked.containsKey(charge.id);
    final part = on && _picked[charge.id]! < _open(charge);
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
                  Text(
                    'Due ${formatDay(DateTime.parse(charge.dueDate))}',
                    style: _mutedStyle,
                  ),
                  if (part)
                    Text(
                      'Part · ${_money(_picked[charge.id]!)}',
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: RLTokens.warning,
                      ),
                    ),
                ],
              ),
            ),
            Text(
              _money(_open(charge)),
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
