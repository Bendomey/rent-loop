import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

// ── Public API ────────────────────────────────────────────────────────────────

Future<void> showBasicDetailsSheet(
  BuildContext context, {
  required String name,
  String description = '',
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _BasicDetailsSheet(name: name, description: description),
  );
}

Future<void> showRentalModeSheet(
  BuildContext context, {
  required String current,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _RentalModeSheet(current: current),
  );
}

Future<void> showLocationSheet(
  BuildContext context, {
  required String address,
  required String city,
  required String region,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _LocationSheet(address: address, city: city, region: region),
  );
}

Future<void> showSwitchTypeSheet(
  BuildContext context, {
  required String current,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _SwitchTypeSheet(current: current),
  );
}

// ── Shared sheet chrome ───────────────────────────────────────────────────────

class _SheetChrome extends StatelessWidget {
  const _SheetChrome({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom + MediaQuery.of(context).padding.bottom;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
          boxShadow: RLTokens.elevSheet,
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              // Drag handle
              Container(
                width: 38,
                height: 5,
                decoration: BoxDecoration(
                  color: RLTokens.hairline,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                child: Row(
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 21,
                        letterSpacing: -0.3,
                        color: RLTokens.ink,
                        height: 1.1,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) Navigator.of(context).pop();
                      },
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: RLTokens.fill,
                          borderRadius: BorderRadius.circular(RLTokens.rSm),
                        ),
                        child: const Icon(Icons.close, size: 17, color: RLTokens.inkSoft),
                      ),
                    ),
                  ],
                ),
              ),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

// ── Save CTA ──────────────────────────────────────────────────────────────────

class _SaveBtn extends StatelessWidget {
  const _SaveBtn({required this.saving, required this.label, required this.onSave});
  final bool saving;
  final String label;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: GestureDetector(
        onTap: saving ? null : onSave,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: RLTokens.crimson,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
          ),
          child: Center(
            child: saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15.5,
                      fontWeight: RLTokens.semibold,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

// ── Input field ───────────────────────────────────────────────────────────────

class _SheetField extends StatelessWidget {
  const _SheetField({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          validator: validator,
          style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.mutedSoft),
            filled: true,
            fillColor: RLTokens.fill,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            border:             OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.hairline)),
            enabledBorder:      OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.hairline)),
            focusedBorder:      OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.crimson, width: 1.5)),
            errorBorder:        OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.danger)),
            focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.danger, width: 1.5)),
          ),
        ),
      ],
    );
  }
}

// ── Sheet 1: Basic details ────────────────────────────────────────────────────

class _BasicDetailsSheet extends StatefulWidget {
  const _BasicDetailsSheet({required this.name, required this.description});
  final String name;
  final String description;

  @override
  State<_BasicDetailsSheet> createState() => _BasicDetailsSheetState();
}

class _BasicDetailsSheetState extends State<_BasicDetailsSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  bool _saving = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.name);
    _descCtrl = TextEditingController(text: widget.description);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await Haptics.vibrate(HapticsType.medium);
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _saving = false);
    await Haptics.vibrate(HapticsType.success);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return _SheetChrome(
      title: 'Basic details',
      child: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SheetField(
                controller: _nameCtrl,
                label: 'Property name',
                hint: 'e.g. Cantonments Court',
                textCapitalization: TextCapitalization.words,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              _SheetField(
                controller: _descCtrl,
                label: 'Description (optional)',
                hint: 'A short description of the property…',
                maxLines: 3,
                keyboardType: TextInputType.multiline,
              ),
              _SaveBtn(saving: _saving, label: 'Save details', onSave: _save),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sheet 2: Rental mode ──────────────────────────────────────────────────────

class _RentalMode {
  const _RentalMode({required this.id, required this.label, required this.sub, required this.icon});
  final String   id, label, sub;
  final IconData icon;
}

const _kModes = [
  _RentalMode(id: 'lease',   label: 'Long stay',  sub: 'Monthly tenants with lease agreements',         icon: Icons.key_outlined),
  _RentalMode(id: 'booking', label: 'Short stay', sub: 'Nightly / weekly guests — serviced model',      icon: Icons.hotel_outlined),
  _RentalMode(id: 'both',    label: 'Both',       sub: 'Accept long-stay tenants and short-stay guests', icon: Icons.swap_horiz_rounded),
];

class _RentalModeSheet extends StatefulWidget {
  const _RentalModeSheet({required this.current});
  final String current;

  @override
  State<_RentalModeSheet> createState() => _RentalModeSheetState();
}

class _RentalModeSheetState extends State<_RentalModeSheet> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.current;
  }

  Future<void> _pick(String id) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _selected = id);
    await Future.delayed(const Duration(milliseconds: 200));
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return _SheetChrome(
      title: 'Rental mode',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
        child: Column(
          children: _kModes.map((m) {
            final active = m.id == _selected;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GestureDetector(
                onTap: () => _pick(m.id),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: active ? RLTokens.crimsonTint : RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(
                      color: active ? RLTokens.crimson : RLTokens.hairline,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: active ? RLTokens.crimsonTint2 : RLTokens.fill,
                          borderRadius: BorderRadius.circular(RLTokens.rSm),
                        ),
                        child: Icon(m.icon, size: 20, color: active ? RLTokens.crimson : RLTokens.inkSoft),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              m.label,
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 15,
                                fontWeight: RLTokens.semibold,
                                color: active ? RLTokens.crimson : RLTokens.ink,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              m.sub,
                              style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      active
                          ? Container(
                              width: 22,
                              height: 22,
                              decoration: const BoxDecoration(color: RLTokens.crimson, shape: BoxShape.circle),
                              child: const Icon(Icons.check, size: 14, color: Colors.white),
                            )
                          : Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: RLTokens.hairline, width: 1.5),
                              ),
                            ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ── Sheet 3: Location ─────────────────────────────────────────────────────────

const _kRegions = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Central', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Oti', 'Savannah',
  'Bono', 'Bono East', 'Ahafo', 'North East', 'Western North',
];

class _LocationSheet extends StatefulWidget {
  const _LocationSheet({required this.address, required this.city, required this.region});
  final String address, city, region;

  @override
  State<_LocationSheet> createState() => _LocationSheetState();
}

class _LocationSheetState extends State<_LocationSheet> {
  late final TextEditingController _addressCtrl;
  late final TextEditingController _cityCtrl;
  late String _region;
  bool _saving = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _addressCtrl = TextEditingController(text: widget.address);
    _cityCtrl    = TextEditingController(text: widget.city);
    _region      = widget.region.isNotEmpty ? widget.region : _kRegions.first;
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await Haptics.vibrate(HapticsType.medium);
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _saving = false);
    await Haptics.vibrate(HapticsType.success);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return _SheetChrome(
      title: 'Location',
      child: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SheetField(
                controller: _addressCtrl,
                label: 'Street address',
                hint: 'e.g. 14 Independence Avenue',
                textCapitalization: TextCapitalization.words,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              _SheetField(
                controller: _cityCtrl,
                label: 'City / area',
                hint: 'e.g. Cantonments, Accra',
                textCapitalization: TextCapitalization.words,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              const Text(
                'Region',
                style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, fontWeight: RLTokens.semibold, color: RLTokens.ink),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                  border: Border.all(color: RLTokens.hairline),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _region,
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: RLTokens.muted),
                    style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
                    items: _kRegions.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (v) async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (v != null) setState(() => _region = v);
                    },
                  ),
                ),
              ),
              _SaveBtn(saving: _saving, label: 'Save location', onSave: _save),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sheet 4: Switch property type ─────────────────────────────────────────────

class _PropTypeOpt {
  const _PropTypeOpt({required this.id, required this.label, required this.sub, required this.icon});
  final String   id, label, sub;
  final IconData icon;
}

const _kTypes = [
  _PropTypeOpt(id: 'residential', label: 'Residential',  sub: 'Apartments & houses',      icon: Icons.apartment_rounded),
  _PropTypeOpt(id: 'commercial',  label: 'Commercial',   sub: 'Offices & retail spaces',   icon: Icons.business_rounded),
  _PropTypeOpt(id: 'short_stay',  label: 'Short-stay',   sub: 'Serviced / Airbnb-style',   icon: Icons.hotel_rounded),
  _PropTypeOpt(id: 'mixed',       label: 'Mixed use',    sub: 'Residential + commercial',  icon: Icons.layers_rounded),
];

class _SwitchTypeSheet extends StatefulWidget {
  const _SwitchTypeSheet({required this.current});
  final String current;

  @override
  State<_SwitchTypeSheet> createState() => _SwitchTypeSheetState();
}

class _SwitchTypeSheetState extends State<_SwitchTypeSheet> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.current;
  }

  Future<void> _pick(String id) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _selected = id);
  }

  Future<void> _save() async {
    await Haptics.vibrate(HapticsType.medium);
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return _SheetChrome(
      title: 'Property type',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        child: Column(
          children: [
            ..._kTypes.map((t) {
              final active = t.id == _selected;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GestureDetector(
                  onTap: () => _pick(t.id),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: active ? RLTokens.crimsonTint : RLTokens.surface,
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                      border: Border.all(
                        color: active ? RLTokens.crimson : RLTokens.hairline,
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: active ? RLTokens.crimsonTint2 : RLTokens.fill,
                            borderRadius: BorderRadius.circular(RLTokens.rSm),
                          ),
                          child: Icon(t.icon, size: 20, color: active ? RLTokens.crimson : RLTokens.inkSoft),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t.label,
                                style: TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 15,
                                  fontWeight: RLTokens.semibold,
                                  color: active ? RLTokens.crimson : RLTokens.ink,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(t.sub, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        active
                            ? Container(
                                width: 22,
                                height: 22,
                                decoration: const BoxDecoration(color: RLTokens.crimson, shape: BoxShape.circle),
                                child: const Icon(Icons.check, size: 14, color: Colors.white),
                              )
                            : Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: RLTokens.hairline, width: 1.5),
                                ),
                              ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            // Confirm button (type change is significant — require explicit save)
            _ConfirmTypeBtn(onSave: _save),
          ],
        ),
      ),
    );
  }
}

class _ConfirmTypeBtn extends StatefulWidget {
  const _ConfirmTypeBtn({required this.onSave});
  final VoidCallback onSave;

  @override
  State<_ConfirmTypeBtn> createState() => _ConfirmTypeBtnState();
}

class _ConfirmTypeBtnState extends State<_ConfirmTypeBtn> {
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    return _SaveBtn(
      saving: _saving,
      label: 'Apply type',
      onSave: () {
        setState(() => _saving = true);
        widget.onSave();
      },
    );
  }
}
