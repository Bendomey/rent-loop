import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kTypes   = ['Residential', 'Commercial', 'Short-stay', 'Mixed use'];
const _kRegions = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Central', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Oti', 'Savannah',
  'Bono', 'Bono East', 'Ahafo', 'North East', 'Western North',
];

class PropertyGeneralSettingsScreen extends StatefulWidget {
  const PropertyGeneralSettingsScreen({super.key, required this.id});
  final String id;

  @override
  State<PropertyGeneralSettingsScreen> createState() => _State();
}

class _State extends State<PropertyGeneralSettingsScreen> {
  final _nameCtrl    = TextEditingController(text: 'Cantonments Court');
  final _addressCtrl = TextEditingController(text: '14 Independence Avenue');
  final _cityCtrl    = TextEditingController(text: 'Cantonments, Accra');
  String _type       = 'Residential';
  String _region     = 'Greater Accra';
  bool   _active     = true;
  bool   _saving     = false;
  final  _formKey    = GlobalKey<FormState>();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await Haptics.vibrate(HapticsType.medium);
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => _saving = false);
    await Haptics.vibrate(HapticsType.success);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Settings saved', style: TextStyle(fontFamily: RLTokens.fontSans)),
          backgroundColor: RLTokens.ink,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(RLTokens.rMd)),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'General settings'),
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 24),
                children: [
                  _Section('Property name'),
                  _Field(
                    controller: _nameCtrl,
                    hint: 'Property name',
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 20),
                  _Section('Property type'),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: RLTokens.fill,
                      borderRadius: BorderRadius.circular(RLTokens.rMd),
                      border: Border.all(color: RLTokens.hairline),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _type,
                        isExpanded: true,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: RLTokens.muted),
                        style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
                        items: _kTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                        onChanged: (v) async {
                          await Haptics.vibrate(HapticsType.selection);
                          if (v != null) setState(() => _type = v);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _Section('Street address'),
                  _Field(
                    controller: _addressCtrl,
                    hint: 'e.g. 14 Independence Avenue',
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 20),
                  _Section('City / area'),
                  _Field(
                    controller: _cityCtrl,
                    hint: 'e.g. Cantonments, Accra',
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 20),
                  _Section('Region'),
                  const SizedBox(height: 4),
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
                  const SizedBox(height: 24),
                  // Status toggle
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      setState(() => _active = !_active);
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: RLTokens.surface,
                        borderRadius: BorderRadius.circular(RLTokens.rLg),
                        border: Border.all(color: RLTokens.hairline),
                      ),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Property active', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                                SizedBox(height: 3),
                                Text('Active properties appear in listings and accept bookings.', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted, height: 1.4)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Switch(
                            value: _active,
                            activeThumbColor: RLTokens.crimson,
                            onChanged: (_) async {
                              await Haptics.vibrate(HapticsType.selection);
                              setState(() => _active = !_active);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          _SaveBar(saving: _saving, onSave: _save),
        ],
      ),
    );
  }
}

// ── Save bar ──────────────────────────────────────────────────────────────────

class _SaveBar extends StatelessWidget {
  const _SaveBar({required this.saving, required this.onSave});
  final bool saving;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 12 + bottom),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
      ),
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
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Save changes', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15.5, fontWeight: RLTokens.semibold, color: Colors.white)),
          ),
        ),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  const _Section(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.hint,
    this.textCapitalization = TextCapitalization.none,
    this.validator,
  });

  final TextEditingController controller;
  final String hint;
  final TextCapitalization textCapitalization;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      textCapitalization: textCapitalization,
      validator: validator,
      style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.mutedSoft),
        filled: true,
        fillColor: RLTokens.fill,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border:             OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.hairline)),
        enabledBorder:      OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.hairline)),
        focusedBorder:      OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.crimson, width: 1.5)),
        errorBorder:        OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.danger)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(RLTokens.rMd), borderSide: const BorderSide(color: RLTokens.danger, width: 1.5)),
      ),
    );
  }
}
