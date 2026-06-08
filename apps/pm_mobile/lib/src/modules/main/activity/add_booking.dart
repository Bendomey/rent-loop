import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Constants ─────────────────────────────────────────────────────────────────

const _kUnits = [
  'Riley Tillman · Emirate Hotel',
  'Suite 2 · Emirate Hotel',
  'Suite 4 · Labadi Beach',
  'Suite 6 · Labadi Beach',
];

const _kGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const _kMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const _kDow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ── Screen ────────────────────────────────────────────────────────────────────

class AddBookingScreen extends StatefulWidget {
  const AddBookingScreen({super.key});

  @override
  State<AddBookingScreen> createState() => _AddBookingScreenState();
}

class _AddBookingScreenState extends State<AddBookingScreen> {
  String _unit = '';
  String? _start;
  String? _end;
  int _viewYear = DateTime.now().year;
  int _viewMonth = DateTime.now().month - 1; // 0-indexed
  final _rateCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _gFirstCtrl = TextEditingController();
  final _gLastCtrl = TextEditingController();
  final _gPhoneCtrl = TextEditingController();
  final _gEmailCtrl = TextEditingController();
  String _gGender = '';
  final _gIdCtrl = TextEditingController();
  bool _guestFound = false;
  String? _activePicker;

  @override
  void dispose() {
    _rateCtrl.dispose();
    _notesCtrl.dispose();
    _gFirstCtrl.dispose();
    _gLastCtrl.dispose();
    _gPhoneCtrl.dispose();
    _gEmailCtrl.dispose();
    _gIdCtrl.dispose();
    super.dispose();
  }

  int get _nights {
    if (_start == null || _end == null) return 0;
    return DateTime.parse(_end!)
        .difference(DateTime.parse(_start!))
        .inDays
        .clamp(1, 999);
  }

  double get _total => _nights * (double.tryParse(_rateCtrl.text) ?? 0);

  bool get _hasGuest =>
      _guestFound ||
      (_gFirstCtrl.text.isNotEmpty && _gLastCtrl.text.isNotEmpty);

  String _fmtDate(String? k) {
    if (k == null) return '—';
    final p = k.split('-');
    return '${_kMonths[int.parse(p[1]) - 1].substring(0, 3)} ${int.parse(p[2])}, ${p[0]}';
  }

  String _weekday(String? k) {
    if (k == null) return '';
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday',
    ];
    return days[DateTime.parse(k).weekday % 7];
  }

  // Thousands-separated integer, e.g. 1540 → "1,540"
  String _formatN(double v) {
    final s = v.round().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  void _pickDate(String k) {
    setState(() {
      if (_start == null || (_start != null && _end != null)) {
        _start = k;
        _end = null;
      } else if (k.compareTo(_start!) <= 0) {
        _start = k;
      } else {
        _end = k;
      }
    });
    Haptics.vibrate(HapticsType.selection);
  }

  void _useGuest(
      String first, String last, String phone, String email, String gender) {
    setState(() {
      _gFirstCtrl.text = first;
      _gLastCtrl.text = last;
      _gPhoneCtrl.text = phone;
      _gEmailCtrl.text = email;
      _gGender = gender;
      _guestFound = true;
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final unitName =
        _unit.contains(' · ') ? _unit.split(' · ')[0] : _unit;
    final location =
        _unit.contains(' · ') ? _unit.split(' · ')[1] : '';
    final nights = _nights;
    final total = _total;
    final hasGuest = _hasGuest;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'New booking',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 160),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Create a booking on behalf of a guest. They'll receive a confirmation email.",
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.muted,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── Live summary card ──────────────────────────────────
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: RLTokens.surface,
                          borderRadius: BorderRadius.circular(RLTokens.rLg),
                          border: Border.all(color: RLTokens.hairline),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'LIVE SUMMARY',
                              style: TextStyle(
                                fontFamily: RLTokens.fontMono,
                                fontSize: 10,
                                letterSpacing: 1,
                                color: RLTokens.crimson,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              unitName.isEmpty ? '—' : unitName,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 20,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            if (location.isNotEmpty) ...[
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on_outlined,
                                    size: 13,
                                    color: RLTokens.mutedSoft,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    location,
                                    style: const TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 12.5,
                                      color: RLTokens.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 14),
                            const Divider(height: 1, color: RLTokens.hairlineSoft),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                    child: _StayStat(
                                        k: 'Check-in', v: _fmtDate(_start))),
                                const SizedBox(width: 14),
                                Expanded(
                                    child: _StayStat(
                                        k: 'Check-out', v: _fmtDate(_end))),
                              ],
                            ),
                            const SizedBox(height: 14),
                            const Divider(height: 1, color: RLTokens.hairlineSoft),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'GHS ${_rateCtrl.text.isEmpty ? '0' : _rateCtrl.text} × $nights night${nights == 1 ? '' : 's'}',
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 13,
                                    color: RLTokens.muted,
                                  ),
                                ),
                                Text(
                                  'GH₵ ${_formatN(total)}.00',
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 13.5,
                                    fontWeight: RLTokens.semibold,
                                    color: RLTokens.ink,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Text(
                                  'Total',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 14,
                                    fontWeight: RLTokens.bold,
                                    color: RLTokens.ink,
                                  ),
                                ),
                                RLMoney(total, size: 22),
                              ],
                            ),
                            const SizedBox(height: 14),
                            const Divider(height: 1, color: RLTokens.hairlineSoft),
                            const SizedBox(height: 12),
                            const Text(
                              'GUEST',
                              style: TextStyle(
                                fontFamily: RLTokens.fontMono,
                                fontSize: 9.5,
                                letterSpacing: 0.6,
                                color: RLTokens.mutedSoft,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              hasGuest
                                  ? '${_gFirstCtrl.text} ${_gLastCtrl.text}'
                                  : 'Not added yet',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 14,
                                fontWeight: hasGuest
                                    ? RLTokens.semibold
                                    : RLTokens.regular,
                                color: hasGuest
                                    ? RLTokens.ink
                                    : RLTokens.mutedSoft,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // ── Stay details ───────────────────────────────────────
                      const SizedBox(height: 26),
                      const Text(
                        'Stay details',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 19,
                          color: RLTokens.ink,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _FormLabel(label: 'Unit'),
                      const SizedBox(height: 8),
                      _SelectField(
                        value: _unit,
                        placeholder: 'Select unit',
                        onTap: () {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _activePicker = 'unit');
                        },
                      ),
                      const SizedBox(height: 7),
                      const Text(
                        '1 date block — greyed-out dates are unavailable.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 11.5,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Calendar card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: RLTokens.surface,
                          borderRadius: BorderRadius.circular(RLTokens.rLg),
                          border: Border.all(color: RLTokens.hairline),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    Haptics.vibrate(HapticsType.selection);
                                    setState(() {
                                      if (_viewMonth == 0) {
                                        _viewYear--;
                                        _viewMonth = 11;
                                      } else {
                                        _viewMonth--;
                                      }
                                    });
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.all(6),
                                    child: Icon(
                                      Icons.chevron_left_rounded,
                                      size: 20,
                                      color: RLTokens.ink,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Center(
                                    child: Text(
                                      '${_kMonths[_viewMonth]} $_viewYear',
                                      style: const TextStyle(
                                        fontFamily: RLTokens.fontSerif,
                                        fontSize: 17,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    Haptics.vibrate(HapticsType.selection);
                                    setState(() {
                                      if (_viewMonth == 11) {
                                        _viewYear++;
                                        _viewMonth = 0;
                                      } else {
                                        _viewMonth++;
                                      }
                                    });
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.all(6),
                                    child: Icon(
                                      Icons.chevron_right_rounded,
                                      size: 20,
                                      color: RLTokens.ink,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            _CalGrid(
                              year: _viewYear,
                              month: _viewMonth,
                              start: _start,
                              end: _end,
                              today: DateTime.now(),
                              onPick: _pickDate,
                            ),
                          ],
                        ),
                      ),

                      // Check-in / check-out / duration strip
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: RLTokens.hairline),
                          borderRadius: BorderRadius.circular(RLTokens.rMd),
                        ),
                        child: IntrinsicHeight(
                          child: Row(
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: _StayStat(
                                    k: 'Check-in',
                                    v: _fmtDate(_start),
                                    sub: _weekday(_start),
                                  ),
                                ),
                              ),
                              const VerticalDivider(
                                  width: 1,
                                  thickness: 1,
                                  color: RLTokens.hairlineSoft),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: _StayStat(
                                    k: 'Check-out',
                                    v: _fmtDate(_end),
                                    sub: _weekday(_end),
                                  ),
                                ),
                              ),
                              const VerticalDivider(
                                  width: 1,
                                  thickness: 1,
                                  color: RLTokens.hairlineSoft),
                              SizedBox(
                                width: 76,
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: _StayStat(k: 'Duration', v: '${nights}d'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Nightly rate
                      const SizedBox(height: 18),
                      _FormLabel(label: 'Nightly rate (GHS)'),
                      const SizedBox(height: 8),
                      _InputField(
                        controller: _rateCtrl,
                        placeholder: '0',
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                      ),

                      // Internal notes
                      const SizedBox(height: 16),
                      _FormLabel(label: 'Internal notes', optional: true),
                      const SizedBox(height: 8),
                      _TextAreaField(
                        controller: _notesCtrl,
                        placeholder:
                            'e.g. Guest arrives late — share gate code by SMS.',
                      ),

                      // ── Guest information ──────────────────────────────────
                      const SizedBox(height: 28),
                      Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'Guest information',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Haptics.vibrate(HapticsType.selection);
                              setState(() => _activePicker = 'guest');
                            },
                            child: Row(
                              children: const [
                                Icon(Icons.search_rounded,
                                    size: 14, color: RLTokens.crimson),
                                SizedBox(width: 5),
                                Text(
                                  'Find existing',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 13,
                                    fontWeight: RLTokens.semibold,
                                    color: RLTokens.crimson,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // First + Last name
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'First name'),
                                const SizedBox(height: 8),
                                _InputField(
                                  controller: _gFirstCtrl,
                                  placeholder: 'First',
                                  onChanged: (_) => setState(() {}),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'Last name'),
                                const SizedBox(height: 8),
                                _InputField(
                                  controller: _gLastCtrl,
                                  placeholder: 'Last',
                                  onChanged: (_) => setState(() {}),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Phone
                      const SizedBox(height: 16),
                      _FormLabel(label: 'Phone'),
                      const SizedBox(height: 8),
                      _PhoneField(
                          controller: _gPhoneCtrl,
                          placeholder: '24 000 0000'),

                      // Email
                      const SizedBox(height: 16),
                      _FormLabel(label: 'Email', optional: true),
                      const SizedBox(height: 8),
                      _InputField(
                        controller: _gEmailCtrl,
                        placeholder: 'name@example.com',
                        keyboardType: TextInputType.emailAddress,
                        leadingIcon: Icons.mail_outline_rounded,
                      ),

                      // Gender + ID number
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'Gender'),
                                const SizedBox(height: 8),
                                _SelectField(
                                  value: _gGender,
                                  placeholder: 'Select',
                                  onTap: () {
                                    Haptics.vibrate(HapticsType.selection);
                                    setState(() => _activePicker = 'gender');
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'ID number', optional: true),
                                const SizedBox(height: 8),
                                _InputField(
                                    controller: _gIdCtrl,
                                    placeholder: 'GHA-XXXXX-X'),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Confirmation email banner
                      const SizedBox(height: 20),
                      const RLInlineBanner(
                        tone: RLBannerTone.danger,
                        icon: Icons.info_outline_rounded,
                        title: 'Confirmation email',
                        body:
                            'The guest will receive a confirmation email with check-in instructions.',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Sticky footer ──────────────────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding:
                  EdgeInsets.fromLTRB(20, 12, 20, 12 + bottomInset),
              decoration: BoxDecoration(
                color: RLTokens.surface,
                border:
                    const Border(top: BorderSide(color: RLTokens.hairline)),
                boxShadow: RLTokens.elevBar,
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'TOTAL',
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 9.5,
                          letterSpacing: 0.6,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                      const SizedBox(height: 3),
                      RLMoney(total, size: 22),
                    ],
                  ),
                  const Spacer(),
                  RLBtn(
                    label: 'Create booking',
                    kind: RLBtnKind.primary,
                    icon: Icons.check_rounded,
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.medium);
                    },
                  ),
                ],
              ),
            ),
          ),

          // ── Picker sheets ──────────────────────────────────────────────────
          if (_activePicker == 'unit')
            _PickerSheet(
              title: 'Select unit',
              options: _kUnits.map((l) => _PickerOption(label: l)).toList(),
              selected: _unit,
              onPick: (v) {
                setState(() {
                  _unit = v;
                  _activePicker = null;
                });
                Haptics.vibrate(HapticsType.selection);
              },
              onClose: () => setState(() => _activePicker = null),
            ),
          if (_activePicker == 'gender')
            _PickerSheet(
              title: 'Gender',
              options: _kGenders.map((l) => _PickerOption(label: l)).toList(),
              selected: _gGender,
              onPick: (v) {
                setState(() {
                  _gGender = v;
                  _activePicker = null;
                });
                Haptics.vibrate(HapticsType.selection);
              },
              onClose: () => setState(() => _activePicker = null),
            ),
          if (_activePicker == 'guest')
            _FindGuestSheet(
              onUse: _useGuest,
              onClose: () => setState(() => _activePicker = null),
            ),
        ],
      ),
    );
  }
}

// ── Stay stat ─────────────────────────────────────────────────────────────────

class _StayStat extends StatelessWidget {
  const _StayStat({required this.k, required this.v, this.sub});
  final String k;
  final String v;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          k.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 9.5,
            letterSpacing: 0.6,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          v,
          style: const TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 17,
            color: RLTokens.ink,
            letterSpacing: -0.2,
          ),
        ),
        if (sub != null && sub!.isNotEmpty) ...[
          const SizedBox(height: 1),
          Text(
            sub!,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ],
    );
  }
}

// ── Inline calendar grid ──────────────────────────────────────────────────────

class _CalGrid extends StatelessWidget {
  const _CalGrid({
    required this.year,
    required this.month,
    required this.start,
    required this.end,
    required this.today,
    required this.onPick,
  });
  final int year;
  final int month; // 0-indexed
  final String? start;
  final String? end;
  final DateTime today;
  final ValueChanged<String> onPick;

  String _iso(int d) =>
      '$year-${(month + 1).toString().padLeft(2, '0')}-${d.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final firstWeekday =
        DateTime(year, month + 1, 1).weekday % 7; // 0=Sun
    final daysInMonth = DateTime(year, month + 2, 0).day;
    final todayDay = (today.year == year && today.month == month + 1)
        ? today.day
        : -1;

    final cells = <int?>[
      for (var i = 0; i < firstWeekday; i++) null,
      for (var d = 1; d <= daysInMonth; d++) d,
    ];
    while (cells.length % 7 != 0) { cells.add(null); }
    final rowCount = cells.length ~/ 7;

    return Column(
      children: [
        // Day-of-week header
        Row(
          children: _kDow
              .map((d) => Expanded(
                    child: Center(
                      child: Text(
                        d,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 10.5,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 6),
        // Day rows
        for (var row = 0; row < rowCount; row++) ...[
          if (row > 0) const SizedBox(height: 4),
          Row(
            children: List.generate(7, (col) {
              final d = cells[row * 7 + col];
              if (d == null) {
                return const Expanded(child: SizedBox(height: 42));
              }
              final k = _iso(d);
              final isPast = todayDay > 0 && d < todayDay;
              final isStart = start == k;
              final isEnd = end == k;
              final between = start != null &&
                  end != null &&
                  k.compareTo(start!) > 0 &&
                  k.compareTo(end!) < 0;
              final isToday = todayDay == d;
              final isSel = isStart || isEnd;

              return Expanded(
                child: GestureDetector(
                  onTap: isPast ? null : () => onPick(k),
                  child: SizedBox(
                    height: 42,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        if (between)
                          Positioned.fill(
                            child: Container(color: RLTokens.crimsonTint),
                          ),
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSel
                                ? RLTokens.crimson
                                : isToday
                                    ? RLTokens.fill
                                    : Colors.transparent,
                          ),
                          child: Center(
                            child: Text(
                              '$d',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 14,
                                fontWeight: isSel
                                    ? RLTokens.bold
                                    : isToday
                                        ? RLTokens.bold
                                        : RLTokens.medium,
                                color: isSel
                                    ? Colors.white
                                    : isPast
                                        ? RLTokens.micro
                                        : RLTokens.ink,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}

// ── Form label ────────────────────────────────────────────────────────────────

class _FormLabel extends StatelessWidget {
  const _FormLabel({required this.label, this.optional = false});
  final String label;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    if (optional) {
      return RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
            const TextSpan(
              text: '  Optional',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: FontWeight.w400,
                color: RLTokens.mutedSoft,
              ),
            ),
          ],
        ),
      );
    }
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const Text(
          ' *',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            fontWeight: RLTokens.bold,
            color: RLTokens.crimson,
          ),
        ),
      ],
    );
  }
}

// ── Select field ──────────────────────────────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField(
      {required this.value, required this.placeholder, required this.onTap});
  final String value;
  final String placeholder;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: RLTokens.hairline, width: 1.5),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value.isEmpty ? placeholder : value,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: value.isEmpty ? RLTokens.mutedSoft : RLTokens.ink,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.keyboard_arrow_down_rounded,
                size: 18, color: RLTokens.mutedSoft),
          ],
        ),
      ),
    );
  }
}

// ── Text input field ──────────────────────────────────────────────────────────

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.placeholder,
    this.keyboardType,
    this.leadingIcon,
    this.onChanged,
  });
  final TextEditingController controller;
  final String placeholder;
  final TextInputType? keyboardType;
  final IconData? leadingIcon;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: EdgeInsets.only(left: leadingIcon != null ? 10 : 14, right: 14),
      child: Row(
        children: [
          if (leadingIcon != null) ...[
            Icon(leadingIcon, size: 16, color: RLTokens.mutedSoft),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              onChanged: onChanged,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 14.5,
                color: RLTokens.ink,
              ),
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  color: RLTokens.mutedSoft,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Textarea field ────────────────────────────────────────────────────────────

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: controller,
        maxLines: null,
        minLines: 3,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: 1.5,
        ),
        decoration: const InputDecoration(
          hintText:
              'e.g. Guest arrives late — share gate code by SMS.',
          hintStyle: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          isDense: true,
          contentPadding: EdgeInsets.symmetric(vertical: 13),
        ),
      ),
    );
  }
}

// ── GH phone field ────────────────────────────────────────────────────────────

class _PhoneField extends StatelessWidget {
  const _PhoneField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 11),
            child: Row(
              children: const [
                Text('🇬🇭', style: TextStyle(fontSize: 17)),
                SizedBox(width: 6),
                Icon(Icons.keyboard_arrow_down_rounded,
                    size: 13, color: RLTokens.mutedSoft),
              ],
            ),
          ),
          Container(
              width: 1,
              height: 26,
              color: RLTokens.hairline,
              margin: const EdgeInsets.only(right: 11)),
          const Text(
            '+233',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 15,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              style: const TextStyle(
                fontFamily: RLTokens.fontMono,
                fontSize: 15,
                color: RLTokens.ink,
                letterSpacing: 0.5,
              ),
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 15,
                  color: RLTokens.mutedSoft,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Find existing guest sheet ─────────────────────────────────────────────────

class _FindGuestSheet extends StatefulWidget {
  const _FindGuestSheet({required this.onUse, required this.onClose});
  final void Function(
      String first, String last, String phone, String email, String gender)
      onUse;
  final VoidCallback onClose;

  @override
  State<_FindGuestSheet> createState() => _FindGuestSheetState();
}

class _FindGuestSheetState extends State<_FindGuestSheet> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showResult = _searchCtrl.text.trim().isNotEmpty;

    return GestureDetector(
      onTap: widget.onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              decoration: const BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.vertical(
                    top: Radius.circular(RLTokens.rXl)),
                boxShadow: RLTokens.elevSheet,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    Center(
                      child: Container(
                        width: 38,
                        height: 5,
                        decoration: BoxDecoration(
                          color: RLTokens.hairline,
                          borderRadius: BorderRadius.circular(5),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'Find existing guest',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 20,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          RLIconBtn(
                            icon: Icons.close,
                            bg: RLTokens.fill,
                            iconColor: RLTokens.inkSoft,
                            onTap: widget.onClose,
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 30),
                      child: Column(
                        children: [
                          // Phone search field
                          Container(
                            decoration: BoxDecoration(
                              color: RLTokens.surface,
                              borderRadius:
                                  BorderRadius.circular(RLTokens.rMd),
                              border: Border.all(
                                  color: RLTokens.hairline, width: 1.5),
                            ),
                            padding:
                                const EdgeInsets.symmetric(horizontal: 14),
                            child: Row(
                              children: [
                                Padding(
                                  padding:
                                      const EdgeInsets.only(right: 11),
                                  child: Row(
                                    children: const [
                                      Text('🇬🇭',
                                          style: TextStyle(fontSize: 17)),
                                      SizedBox(width: 6),
                                      Icon(
                                          Icons.keyboard_arrow_down_rounded,
                                          size: 13,
                                          color: RLTokens.mutedSoft),
                                    ],
                                  ),
                                ),
                                Container(
                                    width: 1,
                                    height: 26,
                                    color: RLTokens.hairline,
                                    margin:
                                        const EdgeInsets.only(right: 11)),
                                const Text(
                                  '+233',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 15,
                                    color: RLTokens.muted,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    controller: _searchCtrl,
                                    keyboardType: TextInputType.phone,
                                    onChanged: (_) => setState(() {}),
                                    style: const TextStyle(
                                      fontFamily: RLTokens.fontMono,
                                      fontSize: 15,
                                      color: RLTokens.ink,
                                      letterSpacing: 0.5,
                                    ),
                                    decoration: const InputDecoration(
                                      hintText: '24 000 0000',
                                      hintStyle: TextStyle(
                                        fontFamily: RLTokens.fontMono,
                                        fontSize: 15,
                                        color: RLTokens.mutedSoft,
                                      ),
                                      border: InputBorder.none,
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(
                                          vertical: 14),
                                    ),
                                  ),
                                ),
                                const Icon(Icons.search_rounded,
                                    size: 18, color: RLTokens.mutedSoft),
                              ],
                            ),
                          ),

                          // Result card
                          if (showResult) ...[
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                border:
                                    Border.all(color: RLTokens.hairline),
                              ),
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Benjamin Domey',
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 16,
                                      fontWeight: RLTokens.bold,
                                      color: RLTokens.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'domeybenjamin1@gmail.com',
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 13,
                                      color: RLTokens.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    '+233 20 108 0802',
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontMono,
                                      fontSize: 12.5,
                                      color: RLTokens.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  RLBtn(
                                    label: 'Use this guest',
                                    kind: RLBtnKind.primary,
                                    full: true,
                                    icon: Icons.check_rounded,
                                    onPressed: () {
                                      Haptics.vibrate(
                                          HapticsType.selection);
                                      widget.onUse(
                                        'Benjamin',
                                        'Domey',
                                        '20 108 0802',
                                        'domeybenjamin1@gmail.com',
                                        'Male',
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Picker option model ───────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label});
  final String label;
}

// ── Picker sheet ──────────────────────────────────────────────────────────────

class _PickerSheet extends StatelessWidget {
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.selected,
    required this.onPick,
    required this.onClose,
  });
  final String title;
  final List<_PickerOption> options;
  final String selected;
  final ValueChanged<String> onPick;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              decoration: const BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.vertical(
                    top: Radius.circular(RLTokens.rXl)),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 38,
                    height: 5,
                    decoration: BoxDecoration(
                      color: RLTokens.hairline,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 20,
                              color: RLTokens.ink,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        RLIconBtn(
                          icon: Icons.close,
                          bg: RLTokens.fill,
                          iconColor: RLTokens.inkSoft,
                          onTap: onClose,
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding:
                          const EdgeInsets.fromLTRB(14, 4, 14, 30),
                      child: Column(
                        children: options.asMap().entries.map((e) {
                          final i = e.key;
                          final o = e.value;
                          final isLast = i == options.length - 1;
                          final isSelected = selected == o.label;
                          return GestureDetector(
                            onTap: () => onPick(o.label),
                            behavior: HitTestBehavior.opaque,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  vertical: 13, horizontal: 8),
                              decoration: BoxDecoration(
                                border: isLast
                                    ? null
                                    : const Border(
                                        bottom: BorderSide(
                                            color:
                                                RLTokens.hairlineSoft)),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      o.label,
                                      style: TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 15,
                                        fontWeight: isSelected
                                            ? RLTokens.bold
                                            : RLTokens.medium,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_rounded,
                                        size: 18,
                                        color: RLTokens.crimson),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
