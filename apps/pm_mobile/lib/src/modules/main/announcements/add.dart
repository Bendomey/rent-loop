import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Options ───────────────────────────────────────────────────────────────────

const _kTypes = ['Community', 'Maintenance', 'Policy', 'Event', 'Emergency'];

const _kPriorityTones = {
  'Low': RLTone.neutral,
  'Normal': RLTone.info,
  'High': RLTone.warning,
  'Urgent': RLTone.danger,
};

const _kStartDates = [
  'Jun 6, 2026',
  'Jun 7, 2026',
  'Jun 8, 2026',
  'Jun 10, 2026',
];
const _kStartTimes = ['9:00 AM', '12:00 PM', '6:00 PM', '11:01 PM'];
const _kEndDates = [
  'No expiry',
  'Jun 13, 2026',
  'Jun 30, 2026',
  'Jul 31, 2026',
];
const _kEndTimes = ['9:00 AM', '12:00 PM', '6:00 PM', '11:59 PM'];
const _kAudience = [
  'Block A',
  'Block B',
  'Unit 4B',
  'Unit 5A',
  'Specific tenants',
];

// ── Screen ────────────────────────────────────────────────────────────────────

class AddAnnouncementScreen extends StatefulWidget {
  const AddAnnouncementScreen({super.key});

  @override
  State<AddAnnouncementScreen> createState() => _AddAnnouncementScreenState();
}

class _AddAnnouncementScreenState extends State<AddAnnouncementScreen> {
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  String _type = 'Community';
  String _priority = 'Normal';
  bool _entire = true;
  String _audience = '';
  String _startDate = 'Jun 6, 2026';
  String _startTime = '11:01 PM';
  String _endDate = 'No expiry';
  String _endTime = '';
  String? _activePicker;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _activePicker = key);
  }

  void _closePicker() => setState(() => _activePicker = null);

  void _pick(String key, String value) {
    Haptics.vibrate(HapticsType.selection);
    setState(() {
      switch (key) {
        case 'type':
          _type = value;
        case 'priority':
          _priority = value;
        case 'startDate':
          _startDate = value;
        case 'startTime':
          _startTime = value;
        case 'endDate':
          _endDate = value;
        case 'endTime':
          _endTime = value;
        case 'audience':
          _audience = value;
      }
      _activePicker = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final titleLen = _titleCtrl.text.length;
    final contentLen = _contentCtrl.text.length;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'New announcement',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 140),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Page heading ───────────────────────────────────────
                      const Text(
                        'Create announcement',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 25,
                          color: RLTokens.ink,
                          letterSpacing: -0.4,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 22),

                      // ── Title ──────────────────────────────────────────────
                      _FormLabel(label: 'Title'),
                      const SizedBox(height: 8),
                      _InputField(
                        controller: _titleCtrl,
                        placeholder: 'Announcement title',
                        maxLength: 60,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 7),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Maximum of 60 characters.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 11.5,
                              color: RLTokens.mutedSoft,
                            ),
                          ),
                          Text(
                            '$titleLen/60',
                            style: const TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 11,
                              color: RLTokens.micro,
                            ),
                          ),
                        ],
                      ),

                      // ── Content ────────────────────────────────────────────
                      const SizedBox(height: 18),
                      _FormLabel(label: 'Content'),
                      const SizedBox(height: 8),
                      _TextAreaField(
                        controller: _contentCtrl,
                        placeholder: 'Write your announcement…',
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 7),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Max 2,000 characters.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 11.5,
                              color: RLTokens.mutedSoft,
                            ),
                          ),
                          Text(
                            '$contentLen/2000',
                            style: const TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 11,
                              color: RLTokens.micro,
                            ),
                          ),
                        ],
                      ),

                      // ── Type + Priority ────────────────────────────────────
                      const SizedBox(height: 18),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'Type'),
                                const SizedBox(height: 8),
                                _SelectField(
                                  value: _type,
                                  placeholder: 'Select',
                                  onTap: () => _openPicker('type'),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _FormLabel(label: 'Priority'),
                                const SizedBox(height: 8),
                                _SelectField(
                                  value: _priority,
                                  placeholder: 'Select',
                                  tone: _kPriorityTones[_priority],
                                  onTap: () => _openPicker('priority'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // ── Audience ───────────────────────────────────────────
                      const SizedBox(height: 28),
                      const Divider(height: 1, color: RLTokens.hairlineSoft),
                      const SizedBox(height: 22),
                      const Text(
                        'Audience',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 18,
                          color: RLTokens.ink,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Choose who receives this announcement.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Entire property card
                      GestureDetector(
                        onTap: () {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _entire = !_entire);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          padding: const EdgeInsets.all(15),
                          decoration: BoxDecoration(
                            color: _entire
                                ? RLTokens.crimsonTint
                                : RLTokens.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _entire
                                  ? RLTokens.crimson
                                  : RLTokens.hairline,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Checkbox
                              Container(
                                width: 22,
                                height: 22,
                                margin: const EdgeInsets.only(top: 1),
                                decoration: BoxDecoration(
                                  color: _entire
                                      ? RLTokens.crimson
                                      : RLTokens.surface,
                                  borderRadius: BorderRadius.circular(7),
                                  border: Border.all(
                                    color: _entire
                                        ? RLTokens.crimson
                                        : RLTokens.hairline,
                                    width: 1.5,
                                  ),
                                ),
                                child: _entire
                                    ? const Icon(
                                        Icons.check_rounded,
                                        size: 14,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Entire property',
                                      style: TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 14.5,
                                        fontWeight: RLTokens.semibold,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    RichText(
                                      text: const TextSpan(
                                        style: TextStyle(
                                          fontFamily: RLTokens.fontSans,
                                          fontSize: 12.5,
                                          color: RLTokens.muted,
                                          height: 1.4,
                                        ),
                                        children: [
                                          TextSpan(text: 'All tenants in '),
                                          TextSpan(
                                            text: "Domey's Residence",
                                            style: TextStyle(
                                              fontWeight: RLTokens.bold,
                                              color: RLTokens.inkSoft,
                                            ),
                                          ),
                                          TextSpan(text: ' will be notified.'),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Specific audience selector (shown when !entire)
                      if (!_entire) ...[
                        const SizedBox(height: 10),
                        _SelectField(
                          value: _audience,
                          placeholder: 'Select specific units or tenants',
                          onTap: () => _openPicker('audience'),
                        ),
                      ],

                      // ── Schedule ───────────────────────────────────────────
                      const SizedBox(height: 28),
                      const Divider(height: 1, color: RLTokens.hairlineSoft),
                      const SizedBox(height: 22),
                      const Text(
                        'Post now or schedule',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 18,
                          color: RLTokens.ink,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Tenants are notified when the announcement is published.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                          height: 1.4,
                        ),
                      ),

                      // Start date & time
                      const SizedBox(height: 16),
                      _FormLabel(label: 'Start date & time', asterisk: false),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            flex: 5,
                            child: _SelectField(
                              value: _startDate,
                              placeholder: 'Select date',
                              onTap: () => _openPicker('startDate'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 3,
                            child: _SelectField(
                              value: _startTime,
                              placeholder: 'Time',
                              onTap: () => _openPicker('startTime'),
                            ),
                          ),
                        ],
                      ),

                      // End date & time
                      const SizedBox(height: 16),
                      _FormLabel(label: 'End date & time', optional: true),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            flex: 5,
                            child: _SelectField(
                              value: _endDate,
                              placeholder: 'No expiry',
                              onTap: () => _openPicker('endDate'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 3,
                            child: _SelectField(
                              value: _endTime,
                              placeholder: '--:--',
                              onTap: () => _openPicker('endTime'),
                            ),
                          ),
                        ],
                      ),

                      // ── Discard ────────────────────────────────────────────
                      const SizedBox(height: 24),
                      Center(
                        child: GestureDetector(
                          onTap: () async {
                            await Haptics.vibrate(HapticsType.selection);
                            if (context.mounted) Navigator.of(context).pop();
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(
                                  Icons.delete_outline_rounded,
                                  size: 16,
                                  color: RLTokens.crimson,
                                ),
                                SizedBox(width: 7),
                                Text(
                                  'Discard',
                                  style: TextStyle(
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
              padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottomInset),
              decoration: BoxDecoration(
                color: RLTokens.surface,
                border: const Border(top: BorderSide(color: RLTokens.hairline)),
                boxShadow: RLTokens.elevBar,
              ),
              child: Row(
                children: [
                  RLBtn(
                    label: 'Save as draft',
                    kind: RLBtnKind.ghost,
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.selection);
                    },
                  ),
                  const Spacer(),
                  RLBtn(
                    label: 'Post now',
                    kind: RLBtnKind.primary,
                    icon: Icons.campaign_rounded,
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.medium);
                    },
                  ),
                ],
              ),
            ),
          ),

          // ── Picker sheets ──────────────────────────────────────────────────
          if (_activePicker == 'type')
            _PickerSheet(
              title: 'Type',
              options: _kTypes.map((l) => _PickerOption(label: l)).toList(),
              selected: _type,
              onPick: (v) => _pick('type', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'priority')
            _PickerSheet(
              title: 'Priority',
              options: _kPriorityTones.entries
                  .map((e) => _PickerOption(label: e.key, tone: e.value))
                  .toList(),
              selected: _priority,
              onPick: (v) => _pick('priority', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'startDate')
            _PickerSheet(
              title: 'Start date',
              options: _kStartDates
                  .map((l) => _PickerOption(label: l))
                  .toList(),
              selected: _startDate,
              onPick: (v) => _pick('startDate', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'startTime')
            _PickerSheet(
              title: 'Start time',
              options: _kStartTimes
                  .map((l) => _PickerOption(label: l))
                  .toList(),
              selected: _startTime,
              onPick: (v) => _pick('startTime', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'endDate')
            _PickerSheet(
              title: 'End date',
              options: _kEndDates.map((l) => _PickerOption(label: l)).toList(),
              selected: _endDate,
              onPick: (v) => _pick('endDate', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'endTime')
            _PickerSheet(
              title: 'End time',
              options: _kEndTimes.map((l) => _PickerOption(label: l)).toList(),
              selected: _endTime,
              onPick: (v) => _pick('endTime', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'audience')
            _PickerSheet(
              title: 'Audience',
              options: _kAudience.map((l) => _PickerOption(label: l)).toList(),
              selected: _audience,
              onPick: (v) => _pick('audience', v),
              onClose: _closePicker,
            ),
        ],
      ),
    );
  }
}

// ── Form label ────────────────────────────────────────────────────────────────

class _FormLabel extends StatelessWidget {
  const _FormLabel({
    required this.label,
    this.asterisk = true,
    this.optional = false,
  });
  final String label;
  final bool asterisk; // show required * (ignored when optional is true)
  final bool optional; // show "Optional" suffix

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
    if (!asterisk) {
      return Text(
        label,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13.5,
          fontWeight: RLTokens.semibold,
          color: RLTokens.ink,
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

// ── Select field (with optional tone dot) ─────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.value,
    required this.placeholder,
    required this.onTap,
    this.tone,
  });
  final String value;
  final String placeholder;
  final VoidCallback onTap;
  final RLTone? tone;

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
            if (tone != null && value.isNotEmpty) ...[
              RLDot(tone: tone!, size: 9),
              const SizedBox(width: 10),
            ],
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
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 18,
              color: RLTokens.mutedSoft,
            ),
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
    this.maxLength,
    this.onChanged,
  });
  final TextEditingController controller;
  final String placeholder;
  final int? maxLength;
  final ValueChanged<String>? onChanged;

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
        maxLength: maxLength,
        onChanged: onChanged,
        buildCounter: maxLength != null
            ? (_, {required currentLength, required isFocused, maxLength}) =>
                  const SizedBox.shrink()
            : null,
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
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

// ── Textarea field ────────────────────────────────────────────────────────────

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({
    required this.controller,
    required this.placeholder,
    this.onChanged,
  });
  final TextEditingController controller;
  final String placeholder;
  final ValueChanged<String>? onChanged;

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
        minLines: 5,
        onChanged: onChanged,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: 1.5,
        ),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 13),
        ),
      ),
    );
  }
}

// ── Picker option model ───────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label, this.tone});
  final String label;
  final RLTone? tone;
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
                  top: Radius.circular(RLTokens.rXl),
                ),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
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
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 30),
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
                                vertical: 13,
                                horizontal: 8,
                              ),
                              decoration: BoxDecoration(
                                border: isLast
                                    ? null
                                    : const Border(
                                        bottom: BorderSide(
                                          color: RLTokens.hairlineSoft,
                                        ),
                                      ),
                              ),
                              child: Row(
                                children: [
                                  if (o.tone != null) ...[
                                    RLDot(tone: o.tone!, size: 9),
                                    const SizedBox(width: 12),
                                  ],
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
                                    const Icon(
                                      Icons.check_rounded,
                                      size: 18,
                                      color: RLTokens.crimson,
                                    ),
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
