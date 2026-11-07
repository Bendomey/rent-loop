import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/add_fee_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

const _feeTypes = <({String category, String label, String eg})>[
  (
    category: 'DAMAGE_CHARGE',
    label: 'Repair or damage',
    eg: 'e.g. Broken window pane',
  ),
  (
    category: 'UTILITY',
    label: 'Water or electricity',
    eg: 'e.g. Water · Oct–Nov',
  ),
  (
    category: 'SECURITY_DEPOSIT',
    label: 'Security deposit',
    eg: 'Refunded when they leave',
  ),
  (category: 'AGENCY_FEE', label: 'Agency fee', eg: 'Your commission'),
  (category: 'OTHER', label: 'Something else', eg: 'You name it'),
];

const _labelStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 13.5,
  fontWeight: FontWeight.w600,
  color: RLTokens.ink,
);

class AddFeeSheet extends ConsumerStatefulWidget {
  const AddFeeSheet({
    super.key,
    required this.application,
    required this.propertyId,
    required this.accountId,
    required this.onClose,
  });

  final TenantApplicationModel application;
  final String propertyId;
  final String accountId;
  final VoidCallback onClose;

  @override
  ConsumerState<AddFeeSheet> createState() => _AddFeeSheetState();
}

class _AddFeeSheetState extends ConsumerState<AddFeeSheet> {
  final _name = TextEditingController();
  final _amount = TextEditingController();
  String? _category;
  late DateTime _due;

  @override
  void initState() {
    super.initState();
    _due = widget.application.desiredMoveInDate ?? DateTime.now();
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    super.dispose();
  }

  String get _currency => widget.application.rentFeeCurrency ?? 'GHS';

  int get _minor =>
      cedisToPesewas(double.tryParse(_amount.text.replaceAll(',', '')) ?? 0);

  bool get _ready =>
      _category != null && _minor > 0 && _name.text.trim().isNotEmpty;

  void _pick(({String category, String label, String eg}) type) {
    final previous = _feeTypes
        .where((t) => t.category == _category)
        .map((t) => t.label)
        .firstOrNull;
    setState(() {
      _category = type.category;
      final untouched = _name.text.trim().isEmpty || _name.text == previous;
      if (untouched && type.category != 'OTHER') _name.text = type.label;
    });
  }

  Future<void> _pickDate() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(_due.year, _due.month, _due.day),
      firstDate: DateTime(2000),
      lastDate: DateTime(DateTime.now().year + 15),
    );
    if (picked != null) {
      setState(
        () => _due = DateTime.utc(picked.year, picked.month, picked.day),
      );
    }
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(addFeeNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      applicationId: widget.application.id,
      accountId: widget.accountId,
      name: _name.text.trim(),
      category: _category!,
      amount: _minor,
      currency: _currency,
      dueDate: _due,
    );
    if (!mounted) return;
    if (ref.read(addFeeNotifierProvider).status.isSuccess()) {
      notifier.reset();
      showRLToast(ref, tone: RLToastTone.success, title: 'Fee added.');
      widget.onClose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(addFeeNotifierProvider);
    final pending = state.status == ApiStatus.pending;
    final name = widget.application.firstName ?? 'The tenant';
    final chosen = _feeTypes.where((t) => t.category == _category).firstOrNull;

    return RLSheet(
      title: 'Add a fee',
      desc:
          'A one-off amount on top of $name’s rent. It goes onto the next bill '
          'once the date you set has passed.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: rlSheetFooter(
        confirmLabel: 'Add this fee',
        onCancel: widget.onClose,
        cancelEnabled: !pending,
        enabled: !pending && _ready,
        onConfirm: _submit,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('What’s it for?', style: _labelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final type in _feeTypes)
                ChoiceChip(
                  label: Text(type.label),
                  selected: _category == type.category,
                  onSelected: (_) => _pick(type),
                ),
            ],
          ),
          if (chosen != null) ...[
            const SizedBox(height: 6),
            Text(
              chosen.eg,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12,
                color: RLTokens.muted,
              ),
            ),
          ],
          const SizedBox(height: 16),
          RLSheetField(
            label: 'Call it',
            controller: _name,
            hint: 'e.g. Broken window pane',
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 4),
          Text(
            '$name sees this on the bill.',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 16),
          RLSheetField(
            label: 'How much? (${currencySymbol(_currency)})',
            controller: _amount,
            hint: '0.00',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          const Text('When should they pay it?', style: _labelStyle),
          const SizedBox(height: 7),
          GestureDetector(
            onTap: _pickDate,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: RLTokens.paper,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      formatApplicationDate(_due),
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.calendar_today_rounded,
                    size: 17,
                    color: RLTokens.micro,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const RLSheetNote(
            text:
                'A fee can’t be edited once it’s added — if the amount is '
                'wrong, remove it and add another. Removed fees stay on the '
                'record but stop counting.',
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
