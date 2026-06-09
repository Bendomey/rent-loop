import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Options ───────────────────────────────────────────────────────────────────

const _kUnits = [
  'Unit 4B · Cantonments Court',
  'Unit 5A · Cantonments Court',
  'Unit 1C · Cantonments Court',
  'Unit 3B · Cantonments Court',
  'Unit 7 · Spintex Heights',
];

const _kPriorities = ['High', 'Medium', 'Low'];

const _kCategories = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'General', 'Security'];

const _kVisibility = ['Visible for Tenant', 'Hidden from Tenant'];

const _kVisibilitySubs = {
  'Visible for Tenant': 'Tenant sees this in their portal.',
  'Hidden from Tenant': 'Internal only — staff and managers.',
};

// ── Screen ────────────────────────────────────────────────────────────────────

class AddMaintenanceScreen extends StatefulWidget {
  const AddMaintenanceScreen({super.key});

  @override
  State<AddMaintenanceScreen> createState() => _AddMaintenanceScreenState();
}

class _AddMaintenanceScreenState extends State<AddMaintenanceScreen> {
  String _unit = '';
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priority = '';
  String _category = '';
  String _visibility = 'Visible for Tenant';
  int _photoCount = 1;
  String? _activePicker;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _activePicker = key);
  }

  void _closePicker() => setState(() => _activePicker = null);

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'unit':     _unit = value;
        case 'priority': _priority = value;
        case 'category': _category = value;
        case 'vis':      _visibility = value;
      }
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'New request',
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
                      // ── Page heading ──────────────────────────────────────
                      const Text(
                        'New maintenance request',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 25,
                          color: RLTokens.ink,
                          letterSpacing: -0.4,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 7),
                      const Text(
                        'Report a new maintenance issue for a unit.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Form fields ───────────────────────────────────────
                      _FormField(
                        label: 'Unit',
                        child: _SelectField(
                          value: _unit,
                          placeholder: 'Select unit',
                          onTap: () => _openPicker('unit'),
                        ),
                      ),
                      const SizedBox(height: 18),
                      _FormField(
                        label: 'Title',
                        child: _InputField(
                          controller: _titleCtrl,
                          placeholder: 'e.g. Fix leaky faucet',
                        ),
                      ),
                      const SizedBox(height: 18),
                      _FormField(
                        label: 'Description',
                        child: _TextAreaField(
                          controller: _descCtrl,
                          placeholder: 'Describe the issue in detail…',
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _FormField(
                              label: 'Priority',
                              child: _SelectField(
                                value: _priority,
                                placeholder: 'Select',
                                onTap: () => _openPicker('priority'),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _FormField(
                              label: 'Category',
                              child: _SelectField(
                                value: _category,
                                placeholder: 'Select',
                                onTap: () => _openPicker('category'),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // ── Attachments ───────────────────────────────────────
                      const SizedBox(height: 28),
                      const Text(
                        'Add attachments',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 19,
                          color: RLTokens.ink,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: const TextSpan(
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                          children: [
                            TextSpan(text: 'Add photos related to the issue. '),
                            TextSpan(
                              text: 'Optional',
                              style: TextStyle(color: RLTokens.mutedSoft),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _PhotosRow(
                        count: _photoCount,
                        onRemove: (i) {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _photoCount = (_photoCount - 1).clamp(0, 99));
                        },
                        onAdd: () {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _photoCount++);
                        },
                      ),

                      // ── Visibility ────────────────────────────────────────
                      const SizedBox(height: 28),
                      RichText(
                        text: TextSpan(
                          children: [
                            const TextSpan(
                              text: 'Visibility',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const TextSpan(
                              text: '  ·  Optional',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13,
                                color: RLTokens.mutedSoft,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Should the tenant see this request in their portal?',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _SelectField(
                        value: _visibility,
                        placeholder: 'Select visibility',
                        onTap: () => _openPicker('vis'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Bottom action bar ─────────────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                20,
                12,
                20,
                12 + MediaQuery.of(context).padding.bottom,
              ),
              decoration: BoxDecoration(
                color: RLTokens.surface,
                border: const Border(top: BorderSide(color: RLTokens.hairline)),
                boxShadow: RLTokens.elevBar,
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: RLTokens.textAction,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  RLBtn(
                    label: 'Create request',
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

          // ── Picker sheets ─────────────────────────────────────────────────
          if (_activePicker == 'unit')
            _PickerSheet(
              title: 'Select unit',
              options: _kUnits.map((l) => _PickerOption(label: l)).toList(),
              selected: _unit,
              onPick: (v) => _pick('unit', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'priority')
            _PickerSheet(
              title: 'Priority',
              options: _kPriorities.map((l) => _PickerOption(
                label: l,
                tone: statusTone(l),
              )).toList(),
              selected: _priority,
              onPick: (v) => _pick('priority', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'category')
            _PickerSheet(
              title: 'Category',
              options: _kCategories.map((l) => _PickerOption(label: l)).toList(),
              selected: _category,
              onPick: (v) => _pick('category', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'vis')
            _PickerSheet(
              title: 'Tenant visibility',
              options: _kVisibility.map((l) => _PickerOption(
                label: l,
                sub: _kVisibilitySubs[l],
              )).toList(),
              selected: _visibility,
              onPick: (v) => _pick('vis', v),
              onClose: _closePicker,
            ),
        ],
      ),
    );
  }
}

// ── Form field label wrapper ──────────────────────────────────────────────────

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
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
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

// ── Select field ──────────────────────────────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField({required this.value, required this.placeholder, required this.onTap});
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
            const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: RLTokens.mutedSoft),
          ],
        ),
      ),
    );
  }
}

// ── Text input field ──────────────────────────────────────────────────────────

class _InputField extends StatelessWidget {
  const _InputField({required this.controller, required this.placeholder});
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
        minLines: 5,
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

// ── Photos row ────────────────────────────────────────────────────────────────

class _PhotosRow extends StatelessWidget {
  const _PhotosRow({required this.count, required this.onRemove, required this.onAdd});
  final int count;
  final ValueChanged<int> onRemove;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < count; i++)
          _PhotoThumb(onRemove: () => onRemove(i)),
        GestureDetector(
          onTap: onAdd,
          child: Container(
            width: 86,
            height: 86,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(RLTokens.rMd),
              border: Border.all(
                color: RLTokens.hairline,
                width: 1.5,
                style: BorderStyle.solid,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.camera_alt_outlined, size: 22, color: RLTokens.mutedSoft),
                SizedBox(height: 4),
                Text(
                  'Add',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PhotoThumb extends StatelessWidget {
  const _PhotoThumb({required this.onRemove});
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 86,
      height: 86,
      child: Stack(
        children: [
          Container(
            width: 86,
            height: 86,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(RLTokens.rMd),
            ),
            child: const Center(
              child: Icon(Icons.image_outlined, size: 28, color: RLTokens.mutedSoft),
            ),
          ),
          Positioned(
            top: 5,
            right: 5,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  color: Color.fromRGBO(17, 17, 16, 0.6),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.close, size: 13, color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Picker option model ───────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label, this.tone, this.sub});
  final String label;
  final RLTone? tone;
  final String? sub;
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
            onTap: () {}, // prevent tap-through
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
                  // Drag handle
                  const SizedBox(height: 10),
                  Container(
                    width: 38,
                    height: 5,
                    decoration: BoxDecoration(
                      color: RLTokens.hairline,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  // Sheet header
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
                  // Options list
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
                              padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 8),
                              decoration: BoxDecoration(
                                border: isLast
                                    ? null
                                    : const Border(
                                        bottom: BorderSide(color: RLTokens.hairlineSoft),
                                      ),
                              ),
                              child: Row(
                                children: [
                                  if (o.tone != null) ...[
                                    RLDot(tone: o.tone!, size: 9),
                                    const SizedBox(width: 12),
                                  ],
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          o.label,
                                          style: TextStyle(
                                            fontFamily: RLTokens.fontSans,
                                            fontSize: 15,
                                            fontWeight: isSelected ? RLTokens.bold : RLTokens.medium,
                                            color: RLTokens.ink,
                                          ),
                                        ),
                                        if (o.sub != null) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            o.sub!,
                                            style: const TextStyle(
                                              fontFamily: RLTokens.fontSans,
                                              fontSize: 12,
                                              color: RLTokens.muted,
                                            ),
                                          ),
                                        ],
                                      ],
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
