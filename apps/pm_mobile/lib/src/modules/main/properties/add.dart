import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Constants ─────────────────────────────────────────────────────────────────

const _kSteps = ['Basics', 'Location', 'Units', 'Review'];

const _kPropertyTypes = [
  _PropType(label: 'Residential',  sub: 'Apartments & houses',     icon: Icons.apartment_rounded),
  _PropType(label: 'Commercial',   sub: 'Offices & retail spaces',  icon: Icons.business_rounded),
  _PropType(label: 'Short-stay',   sub: 'Serviced / Airbnb-style',  icon: Icons.hotel_rounded),
  _PropType(label: 'Mixed use',    sub: 'Residential + commercial', icon: Icons.layers_rounded),
];

const _kRegions = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Central', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Oti', 'Savannah',
  'Bono', 'Bono East', 'Ahafo', 'North East', 'Western North',
];

class _PropType {
  const _PropType({required this.label, required this.sub, required this.icon});
  final String   label;
  final String   sub;
  final IconData icon;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  int _step = 0;

  // Step 0 — Basics
  final _nameCtrl = TextEditingController();
  int _typeIndex  = -1;

  // Step 1 — Location
  final _addressCtrl = TextEditingController();
  final _cityCtrl    = TextEditingController();
  String? _region;

  // Step 2 — Units
  final _unitCountCtrl = TextEditingController(text: '1');
  bool _hasBlocks = false;
  final _blockCtrl = TextEditingController();

  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();

  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _unitCountCtrl.dispose();
    _blockCtrl.dispose();
    super.dispose();
  }

  Future<void> _onBack() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    if (_step == 0) {
      context.pop();
    } else {
      setState(() => _step--);
    }
  }

  Future<void> _onContinue() async {
    if (_step == 0) {
      if (_nameCtrl.text.trim().isEmpty) {
        _showError('Please enter a property name.');
        return;
      }
      if (_typeIndex < 0) {
        _showError('Please select a property type.');
        return;
      }
    } else if (_step == 1) {
      if (!_formKey1.currentState!.validate()) return;
      if (_region == null) {
        _showError('Please select a region.');
        return;
      }
    } else if (_step == 2) {
      if (!_formKey2.currentState!.validate()) return;
    }

    await Haptics.vibrate(HapticsType.selection);

    if (_step < 3) {
      setState(() => _step++);
    } else {
      await _submit();
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Haptics.vibrate(HapticsType.medium);
    // TODO: wire to CreatePropertyNotifier
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    setState(() => _submitting = false);
    await Haptics.vibrate(HapticsType.success);
    if (mounted) context.pop();
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontFamily: RLTokens.fontSans)),
        backgroundColor: RLTokens.ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(RLTokens.rMd)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(title: 'Add property', onBack: _onBack),
          Padding(
            padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 6, RLTokens.gutter, 0),
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
              decoration: BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.circular(RLTokens.rLg),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: RLStepper(steps: _kSteps, current: _step),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 24),
              child: _buildStep(),
            ),
          ),
          _ActionBar(
            step: _step,
            submitting: _submitting,
            onBack: _step > 0 ? _onBack : null,
            onContinue: _onContinue,
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _StepBasics(
          nameCtrl: _nameCtrl,
          typeIndex: _typeIndex,
          onTypeSelected: (i) => setState(() => _typeIndex = i),
        );
      case 1:
        return _StepLocation(
          formKey: _formKey1,
          addressCtrl: _addressCtrl,
          cityCtrl: _cityCtrl,
          region: _region,
          onRegion: (v) => setState(() => _region = v),
        );
      case 2:
        return _StepUnits(
          formKey: _formKey2,
          unitCountCtrl: _unitCountCtrl,
          hasBlocks: _hasBlocks,
          blockCtrl: _blockCtrl,
          onHasBlocks: (v) => setState(() => _hasBlocks = v),
        );
      case 3:
        return _StepReview(
          name: _nameCtrl.text.trim(),
          type: _typeIndex >= 0 ? _kPropertyTypes[_typeIndex].label : '',
          address: _addressCtrl.text.trim(),
          city: _cityCtrl.text.trim(),
          region: _region ?? '',
          unitCount: _unitCountCtrl.text.trim(),
          hasBlocks: _hasBlocks,
          blockLabel: _blockCtrl.text.trim(),
          onEdit: (s) => setState(() => _step = s),
        );
      default:
        return const SizedBox();
    }
  }
}

// ── Step 0 — Basics ───────────────────────────────────────────────────────────

class _StepBasics extends StatelessWidget {
  const _StepBasics({
    required this.nameCtrl,
    required this.typeIndex,
    required this.onTypeSelected,
  });

  final TextEditingController nameCtrl;
  final int typeIndex;
  final void Function(int) onTypeSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle('Property name'),
        _RLField(
          controller: nameCtrl,
          hint: 'e.g. Cantonments Court',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 22),
        const _SectionTitle('Property type'),
        const SizedBox(height: 4),
        ...List.generate(_kPropertyTypes.length, (i) {
          final t      = _kPropertyTypes[i];
          final active = i == typeIndex;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                onTypeSelected(i);
              },
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
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
                          Text(
                            t.sub,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (active)
                      const Icon(Icons.check_circle_rounded, size: 20, color: RLTokens.crimson)
                    else
                      Container(
                        width: 20,
                        height: 20,
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
      ],
    );
  }
}

// ── Step 1 — Location ─────────────────────────────────────────────────────────

class _StepLocation extends StatelessWidget {
  const _StepLocation({
    required this.formKey,
    required this.addressCtrl,
    required this.cityCtrl,
    required this.region,
    required this.onRegion,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController addressCtrl;
  final TextEditingController cityCtrl;
  final String? region;
  final void Function(String?) onRegion;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionTitle('Street address'),
          _RLField(
            controller: addressCtrl,
            hint: 'e.g. 14 Independence Avenue',
            textCapitalization: TextCapitalization.words,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          const SizedBox(height: 16),
          const _SectionTitle('City / area'),
          _RLField(
            controller: cityCtrl,
            hint: 'e.g. Cantonments, Accra',
            textCapitalization: TextCapitalization.words,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          const SizedBox(height: 16),
          const _SectionTitle('Region'),
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
                value: region,
                hint: Text(
                  'Select region',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    color: RLTokens.mutedSoft,
                  ),
                ),
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded, color: RLTokens.muted),
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: RLTokens.ink,
                ),
                items: _kRegions
                    .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                    .toList(),
                onChanged: (v) async {
                  await Haptics.vibrate(HapticsType.selection);
                  onRegion(v);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 2 — Units ────────────────────────────────────────────────────────────

class _StepUnits extends StatelessWidget {
  const _StepUnits({
    required this.formKey,
    required this.unitCountCtrl,
    required this.hasBlocks,
    required this.blockCtrl,
    required this.onHasBlocks,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController unitCountCtrl;
  final bool hasBlocks;
  final TextEditingController blockCtrl;
  final void Function(bool) onHasBlocks;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionTitle('Number of units'),
          _RLField(
            controller: unitCountCtrl,
            hint: '1',
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Required';
              final n = int.tryParse(v.trim());
              if (n == null || n < 1) return 'Must be at least 1';
              if (n > 999) return 'Max 999 units';
              return null;
            },
          ),
          const SizedBox(height: 8),
          const Text(
            'You can always add more units later.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 22),
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              onHasBlocks(!hasBlocks);
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
                        Text(
                          'Organise units into blocks',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 15,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'e.g. Block A, Block B, Floor 1…',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: hasBlocks,
                    onChanged: (_) async {
                      await Haptics.vibrate(HapticsType.selection);
                      onHasBlocks(!hasBlocks);
                    },
                    activeThumbColor: RLTokens.crimson,
                  ),
                ],
              ),
            ),
          ),
          if (hasBlocks) ...[
            const SizedBox(height: 16),
            const _SectionTitle('Block / floor label'),
            _RLField(
              controller: blockCtrl,
              hint: 'e.g. Block A',
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 8),
            const Text(
              'More blocks can be added after creating the property.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Step 3 — Review ───────────────────────────────────────────────────────────

class _StepReview extends StatelessWidget {
  const _StepReview({
    required this.name,
    required this.type,
    required this.address,
    required this.city,
    required this.region,
    required this.unitCount,
    required this.hasBlocks,
    required this.blockLabel,
    required this.onEdit,
  });

  final String name;
  final String type;
  final String address;
  final String city;
  final String region;
  final String unitCount;
  final bool   hasBlocks;
  final String blockLabel;
  final void Function(int step) onEdit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: RLTokens.ink,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
          ),
          child: Row(
            children: [
              const Icon(Icons.apartment_rounded, size: 22, color: Colors.white),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? 'Untitled property' : name,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 20,
                        color: Colors.white,
                        height: 1.1,
                      ),
                    ),
                    if (type.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        type,
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: Colors.white.withAlpha(160),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _ReviewCard(
          title: 'BASICS',
          step: 0,
          onEdit: onEdit,
          rows: [
            _ReviewRow('Name', name),
            _ReviewRow('Type', type),
          ],
        ),
        const SizedBox(height: 10),
        _ReviewCard(
          title: 'LOCATION',
          step: 1,
          onEdit: onEdit,
          rows: [
            _ReviewRow('Address', address),
            _ReviewRow('City', city),
            _ReviewRow('Region', region),
          ],
        ),
        const SizedBox(height: 10),
        _ReviewCard(
          title: 'UNITS',
          step: 2,
          onEdit: onEdit,
          rows: [
            _ReviewRow('Unit count', unitCount),
            if (hasBlocks) _ReviewRow('Block label', blockLabel.isEmpty ? '—' : blockLabel),
          ],
        ),
        const SizedBox(height: 18),
        const Text(
          'Review the details above before creating the property. You can always make changes later.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.title,
    required this.step,
    required this.rows,
    required this.onEdit,
  });

  final String title;
  final int step;
  final List<_ReviewRow> rows;
  final void Function(int) onEdit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.muted,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  onEdit(step);
                },
                child: const Text(
                  'Edit',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.crimson,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(rows.length, (i) {
            final r      = rows[i];
            final isLast = i == rows.length - 1;
            return Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 100,
                      child: Text(
                        r.label,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        r.value.isEmpty ? '—' : r.value,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                  ],
                ),
                if (!isLast)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Container(height: 1, color: RLTokens.hairlineSoft),
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _ReviewRow {
  const _ReviewRow(this.label, this.value);
  final String label;
  final String value;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13.5,
          fontWeight: RLTokens.semibold,
          color: RLTokens.ink,
        ),
      ),
    );
  }
}

class _RLField extends StatelessWidget {
  const _RLField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.inputFormatters,
    this.validator,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      textCapitalization: textCapitalization,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 15,
        color: RLTokens.ink,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          color: RLTokens.mutedSoft,
        ),
        filled: true,
        fillColor: RLTokens.fill,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          borderSide: const BorderSide(color: RLTokens.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          borderSide: const BorderSide(color: RLTokens.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          borderSide: const BorderSide(color: RLTokens.crimson, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          borderSide: const BorderSide(color: RLTokens.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          borderSide: const BorderSide(color: RLTokens.danger, width: 1.5),
        ),
      ),
    );
  }
}

// ── Action bar ────────────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.step,
    required this.submitting,
    required this.onContinue,
    this.onBack,
  });

  final int step;
  final bool submitting;
  final VoidCallback? onBack;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final isReview    = step == 3;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 12 + bottomInset),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
      ),
      child: Row(
        children: [
          if (onBack != null) ...[
            GestureDetector(
              onTap: onBack,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                child: const Text(
                  'Back',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: GestureDetector(
              onTap: submitting ? null : onContinue,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: RLTokens.crimson,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                child: Center(
                  child: submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          isReview ? 'Create property' : 'Continue',
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
          ),
        ],
      ),
    );
  }
}
