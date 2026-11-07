import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/financial/schedule.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/start_billing_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class _Fee {
  const _Fee({
    required this.key,
    required this.category,
    required this.name,
    required this.why,
    required this.amount,
  });

  final String key;
  final String category;
  final String name;
  final String why;
  final int amount;

  _Fee copyWith({String? name, int? amount}) => _Fee(
    key: key,
    category: category,
    name: name ?? this.name,
    why: why,
    amount: amount ?? this.amount,
  );
}

class _Suggestion {
  const _Suggestion(this.category, this.name, this.why, this.amount);
  final String category;
  final String name;
  final String why;
  final int Function(int rent) amount;
}

final _suggestions = <_Suggestion>[
  _Suggestion(
    'SECURITY_DEPOSIT',
    'Security deposit',
    'Refunded when they move out',
    (rent) => rent,
  ),
  _Suggestion(
    'AGENCY_FEE',
    'Agency fee',
    'Your commission for finding them',
    (_) => 50000,
  ),
  _Suggestion('VAT', 'VAT', 'If you charge it', (_) => 7500),
];

const _fallbackBase = 100000;

int _minorFromText(String text) =>
    cedisToPesewas(double.tryParse(text.replaceAll(',', '').trim()) ?? 0);

class FinancialSetupFlow extends ConsumerStatefulWidget {
  const FinancialSetupFlow({
    super.key,
    required this.application,
    required this.propertyId,
    this.leadDays = 5,
  });

  final TenantApplicationModel application;
  final String propertyId;
  final int leadDays;

  @override
  ConsumerState<FinancialSetupFlow> createState() => _FinancialSetupFlowState();
}

class _FinancialSetupFlowState extends ConsumerState<FinancialSetupFlow> {
  late final TextEditingController _rent;
  final List<_Fee> _fees = [];
  BillingChoice _choice = BillingChoice.monthly;
  bool _showDates = false;
  int _otherCount = 0;

  TenantApplicationModel get _app => widget.application;
  String get _name => _app.firstName ?? 'the tenant';
  String get _currency => _app.rentFeeCurrency ?? defaultCurrencyCode;
  PaymentFrequency get _frequency => frequencyForApplication(_app);
  int get _rentMinor => _minorFromText(_rent.text);
  int get _feeTotal => _fees.fold(0, (sum, f) => sum + f.amount);
  bool get _feesIncomplete =>
      _fees.any((f) => f.name.trim().isEmpty || f.amount <= 0);

  bool get _moveInPassed {
    final now = DateTime.now();
    return _app.desiredMoveInDate!.toUtc().isBefore(
      DateTime.utc(now.year, now.month, now.day),
    );
  }

  List<SchedulePeriod> get _periods => buildSchedule(
    rent: _rentMinor,
    moveIn: _app.desiredMoveInDate!,
    stayDuration: _app.stayDuration ?? 12,
    stayFrequency: _frequency,
    paymentFrequency: _frequency,
  );

  DateTime get _leaseEnd => termEndDate(
    _app.desiredMoveInDate!.toUtc(),
    _app.stayDuration ?? 12,
    _frequency,
  );

  String _money(int minor) => formatPesewas(minor, code: _currency);

  @override
  void initState() {
    super.initState();
    final saved = _app.rentFee;
    _rent = TextEditingController(
      text: saved == null || saved == 0 ? '' : cedisInputText(saved),
    );
  }

  @override
  void dispose() {
    _rent.dispose();
    super.dispose();
  }

  void _toggle(_Suggestion s) {
    final on = _fees.any((f) => f.key == s.category);
    setState(() {
      if (on) {
        _fees.removeWhere((f) => f.key == s.category);
      } else {
        _fees.add(
          _Fee(
            key: s.category,
            category: s.category,
            name: s.name,
            why: s.why,
            amount: s.amount(_rentMinor == 0 ? _fallbackBase : _rentMinor),
          ),
        );
      }
    });
  }

  void _addCustom() => setState(() {
    _fees.add(
      _Fee(
        key: 'other-${_otherCount++}',
        category: 'OTHER',
        name: '',
        why: 'You name it',
        amount: 0,
      ),
    );
  });

  void _updateFee(String key, {String? name, int? amount}) => setState(() {
    final i = _fees.indexWhere((f) => f.key == key);
    if (i != -1) _fees[i] = _fees[i].copyWith(name: name, amount: amount);
  });

  Future<void> _start() async {
    await Haptics.vibrate(HapticsType.medium);
    if (!mounted) return;
    await ref
        .read(startBillingNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          applicationId: _app.id,
          existingAccountId: _app.financialAccount?.id,
          rentMinor: _rentMinor,
          currency: _currency,
          fees: [
            for (final f in _fees)
              (name: f.name, category: f.category, amount: f.amount),
          ],
          choice: _choice,
          leadDays: widget.leadDays,
          moveIn: _app.desiredMoveInDate!,
        );
  }

  @override
  Widget build(BuildContext context) {
    final periods = _periods;
    final noun = periodNoun(_frequency);
    final busy = ref.watch(startBillingNotifierProvider).status.isLoading();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _askRent(noun),
              const _Divider(),
              _askFees(),
              const _Divider(),
              _askBilling(noun, periods.length),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _Summary(
          rentMinor: _rentMinor,
          feeTotal: _feeTotal,
          periods: periods,
          graceDays: graceDays(_frequency),
          leaseEnd: _leaseEnd,
          choice: _choice,
          name: _name,
          noun: noun,
          leadDays: widget.leadDays,
          money: _money,
          showDates: _showDates,
          onToggleDates: () => setState(() => _showDates = !_showDates),
          busy: busy,
          feesIncomplete: _feesIncomplete,
          onStart: _start,
        ),
      ],
    );
  }

  Widget _askRent(String noun) {
    final unit = _app.desiredUnit;
    final advertised = unit?.rentFee ?? 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Heading('How much is the rent?'),
        _Body(
          'This is what $_name agreed to pay you each $noun. It doesn’t have '
          'to match what the unit is advertised at.',
        ),
        const SizedBox(height: 14),
        TextField(
          key: const ValueKey('rent-input'),
          controller: _rent,
          onChanged: (_) => setState(() {}),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
          ],
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 20,
            fontWeight: RLTokens.bold,
            color: RLTokens.ink,
          ),
          decoration: _inputDecoration(
            hint: '0.00',
            prefix: _currency,
            suffix: 'a $noun',
          ),
        ),
        if (advertised > 0 && _rentMinor != advertised) ...[
          const SizedBox(height: 10),
          _Chip(
            label:
                '${unit?.name ?? 'The unit'} is advertised at ${_money(advertised)}',
            icon: Icons.repeat_rounded,
            onTap: () =>
                setState(() => _rent.text = cedisInputText(advertised)),
          ),
        ],
      ],
    );
  }

  Widget _askFees() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Heading('Does $_name pay anything else when they move in?'),
        const _Body(
          'One-time amounts, paid once at the start. Tap to add one, tap '
          'again to take it off.',
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in _suggestions)
              _Chip(
                label: s.name,
                icon: _fees.any((f) => f.key == s.category)
                    ? Icons.check_rounded
                    : Icons.add_rounded,
                selected: _fees.any((f) => f.key == s.category),
                onTap: () => _toggle(s),
              ),
            _Chip(
              label: 'Something else',
              icon: Icons.add_rounded,
              onTap: _addCustom,
            ),
          ],
        ),
        if (_fees.isNotEmpty) ...[
          const SizedBox(height: 12),
          for (final fee in _fees)
            _FeeRow(
              key: ValueKey(fee.key),
              fee: fee,
              currency: _currency,
              onName: (v) => _updateFee(fee.key, name: v),
              onAmount: (v) => _updateFee(fee.key, amount: v),
              onRemove: () => setState(() => _fees.remove(fee)),
            ),
        ],
        const SizedBox(height: 10),
        _Body(
          _fees.isNotEmpty
              ? '$_name pays ${_money(_feeTotal)} extra at move-in, on top of '
                    'the first period’s rent.'
              : 'Leave these off if they only pay rent.',
        ),
      ],
    );
  }

  Widget _askBilling(String noun, int count) {
    final rent = _rentMinor;
    String sub(BillingChoice c) => switch (c) {
      BillingChoice.monthly =>
        rent > 0 ? '$count bills of ${_money(rent)}' : '$count bills',
      BillingChoice.quarterly =>
        rent > 0
            ? '${(count / 3).ceil()} bills of ${_money(rent * 3)}'
            : 'Fewer, larger bills',
      BillingChoice.wholeTerm =>
        rent > 0 ? '1 bill of ${_money(rent * count + _feeTotal)}' : '1 bill',
      BillingChoice.manual => 'Nothing goes out automatically',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Heading('How often should we send $_name a bill?'),
        const _Body(
          'We email the bill and remind them when it’s due. You can change '
          'this later.',
        ),
        const SizedBox(height: 12),
        for (final c in BillingChoice.values)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _ChoiceTile(
              label: billingChoiceLabel(c, noun),
              sub: sub(c),
              badge: c == BillingChoice.monthly
                  ? 'Most landlords pick this'
                  : null,
              selected: _choice == c,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (mounted) setState(() => _choice = c);
              },
            ),
          ),
        if (_moveInPassed) ...[
          const Text(
            'Move-in has passed. If they’ve already paid, pick “I\'ll bill '
            'manually” and record what they paid first.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              fontWeight: RLTokens.semibold,
              color: RLTokens.warning,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 2),
        _Body(
          'Whatever you pick, the rent is still due on the same day each '
          '$noun. This only sets how often the bill goes out.',
        ),
      ],
    );
  }
}

InputDecoration _inputDecoration({
  String? hint,
  String? prefix,
  String? suffix,
}) {
  OutlineInputBorder border([Color c = RLTokens.hairline]) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: c, width: 1.5),
      );
  const affix = TextStyle(
    fontFamily: RLTokens.fontSans,
    fontSize: 14,
    fontWeight: RLTokens.semibold,
    color: RLTokens.muted,
  );
  return InputDecoration(
    hintText: hint,
    prefixIcon: prefix == null
        ? null
        : Padding(
            padding: const EdgeInsets.only(left: 14, right: 8),
            child: Text(currencySymbol(prefix), style: affix),
          ),
    prefixIconConstraints: const BoxConstraints(),
    suffixText: suffix,
    suffixStyle: affix,
    filled: true,
    fillColor: RLTokens.surface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    border: border(),
    enabledBorder: border(),
    focusedBorder: border(RLTokens.crimson),
  );
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 18),
    child: Divider(color: RLTokens.hairlineSoft, height: 1),
  );
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      fontFamily: RLTokens.fontSerif,
      fontWeight: RLTokens.headingWeight,
      fontSize: 19,
      color: RLTokens.ink,
      letterSpacing: -0.2,
    ),
  );
}

class _Body extends StatelessWidget {
  const _Body(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: Text(
      text,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 13,
        color: RLTokens.muted,
        height: 1.5,
      ),
    ),
  );
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.icon,
    required this.onTap,
    this.selected = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimson : RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rPill),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: selected ? Colors.white : RLTokens.ink),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: selected ? Colors.white : RLTokens.ink,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeeRow extends StatefulWidget {
  const _FeeRow({
    super.key,
    required this.fee,
    required this.currency,
    required this.onName,
    required this.onAmount,
    required this.onRemove,
  });

  final _Fee fee;
  final String currency;
  final ValueChanged<String> onName;
  final ValueChanged<int> onAmount;
  final VoidCallback onRemove;

  @override
  State<_FeeRow> createState() => _FeeRowState();
}

class _FeeRowState extends State<_FeeRow> {
  late final _name = TextEditingController(text: widget.fee.name);
  late final _amount = TextEditingController(
    text: widget.fee.amount == 0 ? '' : cedisInputText(widget.fee.amount),
  );

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final named = widget.fee.category != 'OTHER';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: named
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.fee.name,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 14.5,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.ink,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.fee.why,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12,
                              color: RLTokens.muted,
                            ),
                          ),
                        ],
                      )
                    : TextField(
                        controller: _name,
                        onChanged: widget.onName,
                        decoration: _inputDecoration(hint: 'What is it for?'),
                      ),
              ),
              IconButton(
                tooltip:
                    'Remove ${widget.fee.name.isEmpty ? 'fee' : widget.fee.name}',
                onPressed: widget.onRemove,
                icon: const Icon(Icons.close_rounded, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _amount,
            onChanged: (v) => widget.onAmount(_minorFromText(v)),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
            ],
            decoration: _inputDecoration(hint: '0.00', prefix: widget.currency),
          ),
        ],
      ),
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final String label;
  final String sub;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint2 : RLTokens.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 15,
                fontWeight: RLTokens.bold,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              sub,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(height: 6),
              RLPill(badge!, tone: RLTone.success),
            ],
          ],
        ),
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({
    required this.rentMinor,
    required this.feeTotal,
    required this.periods,
    required this.graceDays,
    required this.leaseEnd,
    required this.choice,
    required this.name,
    required this.noun,
    required this.leadDays,
    required this.money,
    required this.showDates,
    required this.onToggleDates,
    required this.busy,
    required this.feesIncomplete,
    required this.onStart,
  });

  final int rentMinor;
  final int feeTotal;
  final List<SchedulePeriod> periods;
  final int graceDays;
  final DateTime leaseEnd;
  final BillingChoice choice;
  final String name;
  final String noun;
  final int leadDays;
  final String Function(int) money;
  final bool showDates;
  final VoidCallback onToggleDates;
  final bool busy;
  final bool feesIncomplete;
  final VoidCallback onStart;

  static const _bold = TextStyle(fontWeight: RLTokens.bold);

  String get _planLine => switch (choice) {
    BillingChoice.monthly => 'You send them a bill every $noun.',
    BillingChoice.quarterly => 'You send them a bill every three months.',
    BillingChoice.wholeTerm => 'You send them one bill for the whole term.',
    BillingChoice.manual => 'You send bills yourself, whenever you want.',
  };

  @override
  Widget build(BuildContext context) {
    final ready = rentMinor > 0 && periods.isNotEmpty;
    final first = periods.isEmpty ? null : periods.first;
    final total = rentMinor * periods.length + feeTotal;

    const base = TextStyle(
      fontFamily: RLTokens.fontSans,
      fontSize: 13.5,
      color: RLTokens.ink,
      height: 1.5,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RLCard(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: const BoxDecoration(
                  color: RLTokens.crimsonTint2,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(RLTokens.rLg),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'In plain words',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (ready && first != null)
                      Text.rich(
                        TextSpan(
                          style: base,
                          children: [
                            TextSpan(text: name, style: _bold),
                            const TextSpan(text: ' pays '),
                            TextSpan(text: money(rentMinor), style: _bold),
                            TextSpan(text: ' rent each $noun, due on the '),
                            TextSpan(
                              text: ordinal(first.dueDate.toUtc().day),
                              style: _bold,
                            ),
                            if (graceDays > 0)
                              TextSpan(
                                text:
                                    ', $graceDays ${graceDays == 1 ? 'day' : 'days'} '
                                    'after each $noun of the stay starts',
                              ),
                            const TextSpan(text: '. The lease runs to '),
                            TextSpan(text: formatDay(leaseEnd), style: _bold),
                            const TextSpan(text: '.'),
                            if (feeTotal > 0) ...[
                              const TextSpan(text: ' On top of that they pay '),
                              TextSpan(text: money(feeTotal), style: _bold),
                              const TextSpan(
                                text: ' in one-time fees when they move in.',
                              ),
                            ],
                            TextSpan(text: ' $_planLine'),
                          ],
                        ),
                      )
                    else
                      Text(
                        'Fill in the rent and this will explain what you have '
                        'set up, in ordinary words, before anything is saved.',
                        style: base,
                      ),
                  ],
                ),
              ),
              if (ready && first != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 8, 18, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SummaryLine(
                        label: '$name’s first bill',
                        sub:
                            'Sent ${formatDay(first.dueDate.subtract(Duration(days: leadDays)))}',
                        amount: money(rentMinor + feeTotal),
                        first: true,
                      ),
                      _SummaryLine(
                        label: 'Every $noun after',
                        sub: '${periods.length} in total',
                        amount: money(rentMinor),
                      ),
                      _SummaryLine(
                        label: 'Over the whole term',
                        sub: feeTotal > 0
                            ? '${periods.length} payments, plus fees'
                            : '${periods.length} payments',
                        amount: money(total),
                        large: true,
                      ),
                      GestureDetector(
                        onTap: onToggleDates,
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            children: [
                              Icon(
                                showDates
                                    ? Icons.keyboard_arrow_down_rounded
                                    : Icons.chevron_right_rounded,
                                size: 18,
                                color: RLTokens.crimson,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                showDates
                                    ? 'Hide the dates'
                                    : 'See all ${periods.length} rent dates',
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 13.5,
                                  fontWeight: RLTokens.semibold,
                                  color: RLTokens.crimson,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (showDates)
                        for (final p in periods)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 5),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(p.name, style: base),
                                Text(
                                  'due ${formatDay(p.dueDate)}',
                                  style: base.copyWith(color: RLTokens.muted),
                                ),
                              ],
                            ),
                          ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        RLBtn(
          label: 'Save this and start billing',
          kind: RLBtnKind.primary,
          full: true,
          onPressed: ready && !busy && !feesIncomplete ? onStart : null,
        ),
        if (feesIncomplete)
          const Padding(
            padding: EdgeInsets.only(top: 10),
            child: Text(
              'Give every fee a name and an amount.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                fontWeight: RLTokens.semibold,
                color: RLTokens.warning,
                height: 1.5,
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            ready
                ? 'Nothing is sent to $name today. You can still change the '
                      'rent until their first payment arrives.'
                : 'Answer the questions and this will turn on.',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.sub,
    required this.amount,
    this.first = false,
    this.large = false,
  });

  final String label;
  final String sub;
  final String amount;
  final bool first;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: first
            ? null
            : const Border(top: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            amount,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: large ? 17 : 14,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}
