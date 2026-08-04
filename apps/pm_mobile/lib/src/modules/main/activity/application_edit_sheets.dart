// Bottom sheets for the Application Info screen.
//
// Each "Edit" affordance on a section card opens the matching sheet here. The
// field sets mirror the web forms one-for-one (see
// apps/property-manager/.../applications/application/{tenant,move-in,financial}),
// so the validation rules and enum options line up when this is wired to the
// API. Sheets pop with an updated sub-model, or null when cancelled.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Public API ───────────────────────────────────────────────────────────────

Future<ApplicationApplicant?> showBasicInfoSheet(
  BuildContext context,
  ApplicationApplicant applicant,
) => _open<ApplicationApplicant>(
  context,
  (close) => _BasicInfoSheet(applicant: applicant, onClose: close),
);

Future<ApplicationIdentity?> showIdentitySheet(
  BuildContext context,
  ApplicationIdentity identity,
) => _open<ApplicationIdentity>(
  context,
  (close) => _IdentitySheet(identity: identity, onClose: close),
);

Future<ApplicationBackground?> showBackgroundSheet(
  BuildContext context,
  ApplicationBackground background,
) => _open<ApplicationBackground>(
  context,
  (close) => _BackgroundSheet(background: background, onClose: close),
);

Future<ApplicationMoveIn?> showMoveInSheet(
  BuildContext context,
  ApplicationMoveIn moveIn,
) => _open<ApplicationMoveIn>(
  context,
  (close) => _MoveInSheet(moveIn: moveIn, onClose: close),
);

Future<ApplicationFinancial?> showFinancialSheet(
  BuildContext context,
  ApplicationFinancial financial, {
  required int? stayDuration,
  required String? stayDurationFrequency,
}) => _open<ApplicationFinancial>(
  context,
  (close) => _FinancialSheet(
    financial: financial,
    stayDuration: stayDuration,
    stayDurationFrequency: stayDurationFrequency,
    onClose: close,
  ),
);

/// Unit picker. Pops the chosen unit, or null when cancelled.
Future<ApplicationUnit?> showChangeUnitSheet(
  BuildContext context, {
  required List<ApplicationUnit> units,
  required String? currentUnitId,
}) => _open<ApplicationUnit>(
  context,
  (close) => _ChangeUnitSheet(
    units: units,
    currentUnitId: currentUnitId,
    onClose: close,
  ),
);

Future<void> showAddDocumentSheet(BuildContext context) =>
    _open<void>(context, (close) => _AddDocumentSheet(onClose: close));

Future<void> showWhatsNextSheet(BuildContext context, String tenantName) =>
    _open<void>(
      context,
      (close) => _WhatsNextSheet(tenantName: tenantName, onClose: close),
    );

// ── Launcher ─────────────────────────────────────────────────────────────────

Future<T?> _open<T>(
  BuildContext context,
  Widget Function(void Function([T? result])) builder,
) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => builder(([T? result]) => Navigator.of(ctx).pop(result)),
  );
}

// ── Sheet chrome ─────────────────────────────────────────────────────────────

class _Sheet extends StatelessWidget {
  const _Sheet({
    required this.title,
    this.desc,
    required this.onDismiss,
    required this.child,
    required this.footer,
  });

  final String title;
  final String? desc;
  final VoidCallback onDismiss;
  final Widget child;
  final Widget footer;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(RLTokens.rXl),
          ),
          boxShadow: RLTokens.elevSheet,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _DragHandle(),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 12, 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSerif,
                            fontSize: 21,
                            color: RLTokens.ink,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (desc != null) ...[
                          const SizedBox(height: 5),
                          Text(
                            desc!,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 13,
                              color: RLTokens.muted,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  _CloseBtn(onTap: onDismiss),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                child: child,
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 14, 20, 30 + bottom),
              child: footer,
            ),
          ],
        ),
      ),
    );
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Center(
        child: Container(
          width: 38,
          height: 5,
          decoration: BoxDecoration(
            color: RLTokens.hairline,
            borderRadius: BorderRadius.circular(5),
          ),
        ),
      ),
    );
  }
}

class _CloseBtn extends StatelessWidget {
  const _CloseBtn({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: RLTokens.fill,
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Icon(
          Icons.close_rounded,
          size: 18,
          color: RLTokens.inkSoft,
        ),
      ),
    );
  }
}

/// Cancel + Save footer. [onSave] is null while the form is invalid.
Widget _saveCancel({
  required VoidCallback onCancel,
  required VoidCallback? onSave,
  String saveLabel = 'Save',
}) {
  return Row(
    children: [
      Expanded(
        child: RLBtn(
          label: 'Cancel',
          kind: RLBtnKind.light,
          full: true,
          onPressed: () async {
            await Haptics.vibrate(HapticsType.selection);
            onCancel();
          },
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Opacity(
          opacity: onSave == null ? 0.45 : 1,
          child: RLBtn(
            label: saveLabel,
            kind: RLBtnKind.primary,
            icon: Icons.check_rounded,
            full: true,
            onPressed: onSave == null
                ? null
                : () async {
                    await Haptics.vibrate(HapticsType.medium);
                    onSave();
                  },
          ),
        ),
      ),
    ],
  );
}

// ── Field primitives ─────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {this.optional = false});
  final String text;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          // Flexible, not a bare Text: several labels are long enough to
          // outrun the sheet width once the "Optional" badge is beside them.
          Flexible(
            child: Text(
              text,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
          if (optional) ...[
            const SizedBox(width: 6),
            const Text(
              'Optional',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11.5,
                color: RLTokens.mutedSoft,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

InputBorder _border([Color color = RLTokens.hairline]) => OutlineInputBorder(
  borderRadius: BorderRadius.circular(12),
  borderSide: BorderSide(color: color, width: 1.5),
);

class _TextInput extends StatelessWidget {
  const _TextInput({
    required this.controller,
    required this.placeholder,
    this.keyboardType,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
    this.maxLines = 1,
    this.prefixText,
    this.onChanged,
  });

  final TextEditingController controller;
  final String placeholder;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final int maxLines;
  final String? prefixText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      textCapitalization: textCapitalization,
      maxLines: maxLines,
      onChanged: onChanged,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 15,
        color: RLTokens.ink,
      ),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          color: RLTokens.mutedSoft,
        ),
        prefixText: prefixText,
        prefixStyle: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          fontWeight: RLTokens.semibold,
          color: RLTokens.muted,
        ),
        filled: true,
        fillColor: RLTokens.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: _border(),
        enabledBorder: _border(),
        focusedBorder: _border(RLTokens.crimson),
      ),
    );
  }
}

class _SelectInput extends StatelessWidget {
  const _SelectInput({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final String? value;
  final Map<String, String> options;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      child: DropdownButton<String>(
        value: options.containsKey(value) ? value : null,
        isExpanded: true,
        underline: const SizedBox.shrink(),
        borderRadius: BorderRadius.circular(12),
        icon: const Icon(
          Icons.keyboard_arrow_down_rounded,
          size: 20,
          color: RLTokens.micro,
        ),
        hint: const Text(
          'Please select',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 15,
            color: RLTokens.mutedSoft,
          ),
        ),
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          color: RLTokens.ink,
        ),
        items: [
          for (final e in options.entries)
            DropdownMenuItem(value: e.key, child: Text(e.value)),
        ],
        onChanged: (v) {
          Haptics.vibrate(HapticsType.selection);
          onChanged(v);
        },
      ),
    );
  }
}

class _DateInput extends StatelessWidget {
  const _DateInput({
    required this.value,
    required this.onChanged,
    required this.placeholder,
    this.lastDate,
  });

  final DateTime? value;
  final ValueChanged<DateTime> onChanged;
  final String placeholder;
  final DateTime? lastDate;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (!context.mounted) return;
        final first = DateTime(1900);
        final last = lastDate ?? DateTime(DateTime.now().year + 10);
        // showDatePicker asserts initialDate sits within the range, and
        // `last` may be a hair behind "now" for past-only fields like DOB.
        var initial = value ?? DateTime.now();
        if (initial.isAfter(last)) initial = last;
        if (initial.isBefore(first)) initial = first;
        final picked = await showDatePicker(
          context: context,
          initialDate: initial,
          firstDate: first,
          lastDate: last,
        );
        if (picked != null) onChanged(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: RLTokens.hairline, width: 1.5),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value == null ? placeholder : formatApplicationDate(value!),
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: value == null ? RLTokens.mutedSoft : RLTokens.ink,
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
    );
  }
}

/// Vertical label + field pair.
class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.child,
    this.optional = false,
  });
  final String label;
  final Widget child;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _FieldLabel(label, optional: optional),
          child,
        ],
      ),
    );
  }
}

class _SheetSectionLabel extends StatelessWidget {
  const _SheetSectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 10.5,
          letterSpacing: 1.1,
          fontWeight: RLTokens.medium,
          color: RLTokens.mutedSoft,
        ),
      ),
    );
  }
}

// ── 1. Basic Information ─────────────────────────────────────────────────────

class _BasicInfoSheet extends StatefulWidget {
  const _BasicInfoSheet({required this.applicant, required this.onClose});
  final ApplicationApplicant applicant;
  final void Function([ApplicationApplicant? result]) onClose;

  @override
  State<_BasicInfoSheet> createState() => _BasicInfoSheetState();
}

class _BasicInfoSheetState extends State<_BasicInfoSheet> {
  late final _first = TextEditingController(text: widget.applicant.firstName);
  late final _last = TextEditingController(text: widget.applicant.lastName);
  late final _other = TextEditingController(
    text: widget.applicant.otherNames ?? '',
  );
  late final _email = TextEditingController(text: widget.applicant.email);
  late final _phone = TextEditingController(text: widget.applicant.phone ?? '');
  late String? _gender = widget.applicant.gender;
  late String? _marital = widget.applicant.maritalStatus;
  late DateTime? _dob = widget.applicant.dateOfBirth;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _other.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool get _valid =>
      _first.text.trim().isNotEmpty &&
      _last.text.trim().isNotEmpty &&
      _phone.text.trim().isNotEmpty &&
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_email.text.trim());

  String? _nullIfEmpty(String v) => v.trim().isEmpty ? null : v.trim();

  @override
  Widget build(BuildContext context) {
    return _Sheet(
      title: 'Basic Information',
      desc: "The applicant's personal details.",
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: _valid
            ? () => widget.onClose(
                widget.applicant.copyWith(
                  firstName: _first.text.trim(),
                  lastName: _last.text.trim(),
                  otherNames: () => _nullIfEmpty(_other.text),
                  gender: () => _gender,
                  maritalStatus: () => _marital,
                  email: _email.text.trim(),
                  phone: () => _nullIfEmpty(_phone.text),
                  dateOfBirth: () => _dob,
                ),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Field(
            label: 'First name',
            child: _TextInput(
              controller: _first,
              placeholder: 'e.g. Ebenezer',
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Last name',
            child: _TextInput(
              controller: _last,
              placeholder: 'e.g. Adu',
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Other names',
            optional: true,
            child: _TextInput(
              controller: _other,
              placeholder: 'Middle or other names',
              textCapitalization: TextCapitalization.words,
            ),
          ),
          _Field(
            label: 'Gender',
            child: _SelectInput(
              value: _gender,
              options: kGenderOptions,
              onChanged: (v) => setState(() => _gender = v),
            ),
          ),
          _Field(
            label: 'Marital status',
            child: _SelectInput(
              value: _marital,
              options: kMaritalStatusOptions,
              onChanged: (v) => setState(() => _marital = v),
            ),
          ),
          _Field(
            label: 'Email',
            child: _TextInput(
              controller: _email,
              placeholder: 'name@example.com',
              keyboardType: TextInputType.emailAddress,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Phone',
            child: _TextInput(
              controller: _phone,
              placeholder: '+233 XX XXX XXXX',
              keyboardType: TextInputType.phone,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Date of birth',
            child: _DateInput(
              value: _dob,
              placeholder: 'Select a date',
              lastDate: DateTime.now(),
              onChanged: (d) => setState(() => _dob = d),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 2. Identity Verification ─────────────────────────────────────────────────

class _IdentitySheet extends StatefulWidget {
  const _IdentitySheet({required this.identity, required this.onClose});
  final ApplicationIdentity identity;
  final void Function([ApplicationIdentity? result]) onClose;

  @override
  State<_IdentitySheet> createState() => _IdentitySheetState();
}

class _IdentitySheetState extends State<_IdentitySheet> {
  late final _nationality = TextEditingController(
    text: widget.identity.nationality ?? '',
  );
  late final _idNumber = TextEditingController(
    text: widget.identity.idNumber ?? '',
  );
  late final _address = TextEditingController(
    text: widget.identity.currentAddress ?? '',
  );
  late String? _idType = widget.identity.idType;

  @override
  void dispose() {
    _nationality.dispose();
    _idNumber.dispose();
    _address.dispose();
    super.dispose();
  }

  bool get _valid =>
      _nationality.text.trim().isNotEmpty &&
      _idType != null &&
      _idNumber.text.trim().isNotEmpty &&
      _address.text.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return _Sheet(
      title: 'Identity Verification',
      desc: "The applicant's nationality and identity document.",
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: _valid
            ? () => widget.onClose(
                widget.identity.copyWith(
                  nationality: () => _nationality.text.trim(),
                  idType: () => _idType,
                  idNumber: () => _idNumber.text.trim(),
                  currentAddress: () => _address.text.trim(),
                ),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Field(
            label: 'Nationality',
            child: _TextInput(
              controller: _nationality,
              placeholder: 'e.g. Ghanaian',
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'ID type',
            child: _SelectInput(
              value: _idType,
              options: kIdTypeOptions,
              onChanged: (v) => setState(() => _idType = v),
            ),
          ),
          _Field(
            label: 'ID number',
            child: _TextInput(
              controller: _idNumber,
              placeholder: 'e.g. GHA-14564-464',
              textCapitalization: TextCapitalization.characters,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Current address',
            child: _TextInput(
              controller: _address,
              placeholder: 'Street, city, region',
              maxLines: 3,
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          const _SheetSectionLabel('ID document images'),
          const _UploadHint(
            text: 'Front and back images are captured on the web portal.',
          ),
        ],
      ),
    );
  }
}

class _UploadHint extends StatelessWidget {
  const _UploadHint({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline_rounded,
            size: 17,
            color: RLTokens.mutedSoft,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 3. Emergency Contact & Background ────────────────────────────────────────

class _BackgroundSheet extends StatefulWidget {
  const _BackgroundSheet({required this.background, required this.onClose});
  final ApplicationBackground background;
  final void Function([ApplicationBackground? result]) onClose;

  @override
  State<_BackgroundSheet> createState() => _BackgroundSheetState();
}

class _BackgroundSheetState extends State<_BackgroundSheet> {
  late final _name = TextEditingController(
    text: widget.background.emergencyContactName ?? '',
  );
  late final _relationship = TextEditingController(
    text: widget.background.relationshipToEmergencyContact ?? '',
  );
  late final _phone = TextEditingController(
    text: widget.background.emergencyContactPhone ?? '',
  );
  late final _occupation = TextEditingController(
    text: widget.background.occupation ?? '',
  );
  late final _employer = TextEditingController(
    text: widget.background.employer ?? '',
  );
  late final _occupationAddress = TextEditingController(
    text: widget.background.occupationAddress ?? '',
  );
  late String? _employerType = widget.background.employerType;

  bool get _isStudent => _employerType == 'STUDENT';

  @override
  void dispose() {
    _name.dispose();
    _relationship.dispose();
    _phone.dispose();
    _occupation.dispose();
    _employer.dispose();
    _occupationAddress.dispose();
    super.dispose();
  }

  bool get _valid =>
      _name.text.trim().length >= 2 &&
      _relationship.text.trim().length >= 2 &&
      _phone.text.trim().isNotEmpty &&
      _employerType != null;

  String? _nullIfEmpty(String v) => v.trim().isEmpty ? null : v.trim();

  @override
  Widget build(BuildContext context) {
    return _Sheet(
      title: 'Emergency Contact & Background',
      desc: 'Who to reach in an emergency, plus employment details.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: _valid
            ? () => widget.onClose(
                widget.background.copyWith(
                  emergencyContactName: () => _name.text.trim(),
                  relationshipToEmergencyContact: () =>
                      _relationship.text.trim(),
                  emergencyContactPhone: () => _phone.text.trim(),
                  employerType: () => _employerType,
                  // The web pins occupation to STUDENT for students.
                  occupation: () =>
                      _isStudent ? 'STUDENT' : _nullIfEmpty(_occupation.text),
                  employer: () => _nullIfEmpty(_employer.text),
                  occupationAddress: () =>
                      _nullIfEmpty(_occupationAddress.text),
                ),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetSectionLabel('Emergency contact'),
          _Field(
            label: 'Full name',
            child: _TextInput(
              controller: _name,
              placeholder: 'e.g. Akosua Ofori',
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Relationship',
            child: _TextInput(
              controller: _relationship,
              placeholder: 'e.g. Spouse',
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Phone number',
            child: _TextInput(
              controller: _phone,
              placeholder: '+233 XX XXX XXXX',
              keyboardType: TextInputType.phone,
              onChanged: (_) => setState(() {}),
            ),
          ),
          const Divider(color: RLTokens.hairlineSoft, height: 28),
          _SheetSectionLabel(
            _isStudent ? 'Student information' : 'Employment information',
          ),
          _Field(
            label: 'Employment type',
            child: _SelectInput(
              value: _employerType,
              options: kEmployerTypeOptions,
              onChanged: (v) => setState(() => _employerType = v),
            ),
          ),
          if (!_isStudent)
            _Field(
              label: 'Occupation',
              optional: true,
              child: _TextInput(
                controller: _occupation,
                placeholder: 'e.g. Software Engineer',
                textCapitalization: TextCapitalization.words,
              ),
            ),
          _Field(
            label: _isStudent ? 'Institution/School' : 'Employer',
            optional: true,
            child: _TextInput(
              controller: _employer,
              placeholder: _isStudent
                  ? 'e.g. University of Ghana'
                  : 'e.g. Bollore Transport',
              textCapitalization: TextCapitalization.words,
            ),
          ),
          _Field(
            label: 'Address',
            optional: true,
            child: _TextInput(
              controller: _occupationAddress,
              placeholder: 'e.g. 123 Business St, City, Country',
              maxLines: 2,
              textCapitalization: TextCapitalization.words,
            ),
          ),
          _UploadHint(
            text:
                'Proof of ${_isStudent ? 'admission' : 'income'} is uploaded on the web portal.',
          ),
        ],
      ),
    );
  }
}

// ── 4. Move In Setup ─────────────────────────────────────────────────────────

class _MoveInSheet extends StatefulWidget {
  const _MoveInSheet({required this.moveIn, required this.onClose});
  final ApplicationMoveIn moveIn;
  final void Function([ApplicationMoveIn? result]) onClose;

  @override
  State<_MoveInSheet> createState() => _MoveInSheetState();
}

class _MoveInSheetState extends State<_MoveInSheet> {
  late final _duration = TextEditingController(
    text: widget.moveIn.stayDuration?.toString() ?? '',
  );
  late DateTime? _date = widget.moveIn.desiredMoveInDate;
  late String? _frequency = widget.moveIn.stayDurationFrequency;

  @override
  void dispose() {
    _duration.dispose();
    super.dispose();
  }

  int? get _durationValue {
    final n = int.tryParse(_duration.text.trim());
    return (n != null && n >= 1) ? n : null;
  }

  /// Duration is optional, but a non-empty value must be at least 1.
  bool get _valid => _duration.text.trim().isEmpty || _durationValue != null;

  @override
  Widget build(BuildContext context) {
    final unit = periodLabel(_frequency, _durationValue ?? 2);
    return _Sheet(
      title: 'Move In Setup',
      desc: 'When the tenant moves in and how long they intend to stay.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: _valid
            ? () => widget.onClose(
                widget.moveIn.copyWith(
                  desiredMoveInDate: () => _date,
                  stayDurationFrequency: () => _frequency,
                  stayDuration: () => _durationValue,
                ),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Field(
            label: 'Desired move-in date',
            optional: true,
            child: _DateInput(
              value: _date,
              placeholder: 'Select a date',
              onChanged: (d) => setState(() => _date = d),
            ),
          ),
          _Field(
            label: 'Stay duration frequency',
            optional: true,
            child: _SelectInput(
              value: _frequency,
              options: kStayFrequencyOptions,
              onChanged: (v) => setState(() => _frequency = v),
            ),
          ),
          _Field(
            label: 'Stay duration',
            optional: true,
            child: _TextInput(
              controller: _duration,
              placeholder: 'Number of $unit',
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (_duration.text.trim().isNotEmpty && _durationValue == null)
            const _InlineError('Stay duration must be at least 1.'),
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12.5,
          color: RLTokens.danger,
        ),
      ),
    );
  }
}

// ── 5. Financial Setup ───────────────────────────────────────────────────────

class _FinancialSheet extends StatefulWidget {
  const _FinancialSheet({
    required this.financial,
    required this.stayDuration,
    required this.stayDurationFrequency,
    required this.onClose,
  });

  final ApplicationFinancial financial;
  final int? stayDuration;
  final String? stayDurationFrequency;
  final void Function([ApplicationFinancial? result]) onClose;

  @override
  State<_FinancialSheet> createState() => _FinancialSheetState();
}

class _FinancialSheetState extends State<_FinancialSheet> {
  late final _rent = TextEditingController(
    text: widget.financial.rentFee == null
        ? ''
        : pesewasToCedis(widget.financial.rentFee!).toStringAsFixed(2),
  );
  late final _deposit = TextEditingController(
    text: widget.financial.securityDepositFee == null
        ? ''
        : pesewasToCedis(
            widget.financial.securityDepositFee!,
          ).toStringAsFixed(2),
  );
  late final _periods = TextEditingController(
    text: widget.financial.customPeriods.toString(),
  );
  late String? _frequency = widget.financial.paymentFrequency;
  late bool _depositEnabled = widget.financial.securityDepositEnabled;
  late String _mode = widget.financial.paymentMode;

  @override
  void dispose() {
    _rent.dispose();
    _deposit.dispose();
    _periods.dispose();
    super.dispose();
  }

  int? _pesewasFrom(TextEditingController c) {
    final v = double.tryParse(c.text.trim());
    return v == null ? null : cedisToPesewas(v);
  }

  int get _maxPeriods => widget.stayDuration ?? 1;

  int get _periodsValue {
    final n = int.tryParse(_periods.text.trim()) ?? 1;
    return n.clamp(1, _maxPeriods < 1 ? 1 : _maxPeriods);
  }

  bool get _valid {
    final rent = _pesewasFrom(_rent);
    if (rent == null || rent <= 0) return false;
    if (_frequency == null) return false;
    if (_depositEnabled) {
      final d = _pesewasFrom(_deposit);
      if (d == null || d < 0) return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final rentPesewas = _pesewasFrom(_rent);
    final periods = _mode == 'CUSTOM' ? _periodsValue : _maxPeriods;
    final subtotal = rentPesewas == null ? null : rentPesewas * periods;
    final depositPesewas = _depositEnabled ? (_pesewasFrom(_deposit) ?? 0) : 0;
    final total = subtotal == null ? null : subtotal + depositPesewas;
    final unitLabel = periodLabel(widget.stayDurationFrequency, periods);

    return _Sheet(
      title: 'Financial Setup',
      desc: 'Rent, deposit and the payment the tenant makes upfront.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: _valid
            ? () => widget.onClose(
                widget.financial.copyWith(
                  rentFee: () => _pesewasFrom(_rent),
                  paymentFrequency: () => _frequency,
                  securityDepositEnabled: _depositEnabled,
                  securityDepositFee: () =>
                      _depositEnabled ? _pesewasFrom(_deposit) : null,
                  paymentMode: _mode,
                  customPeriods: _periodsValue,
                ),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetSectionLabel('Rent'),
          if (widget.financial.unitDefaultRentFee != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'Unit default: ${formatPesewas(widget.financial.unitDefaultRentFee)}'
                '${widget.financial.paymentFrequency != null ? ' / ${kPaymentFrequencyOptions[widget.financial.paymentFrequency]?.toLowerCase()}' : ''}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.muted,
                ),
              ),
            ),
          _Field(
            label: 'Agreed rent fee',
            child: _TextInput(
              controller: _rent,
              placeholder: '0.00',
              prefixText: 'GH₵ ',
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
              ],
              onChanged: (_) => setState(() {}),
            ),
          ),
          _Field(
            label: 'Payment frequency',
            child: _SelectInput(
              value: _frequency,
              options: kPaymentFrequencyOptions,
              onChanged: (v) => setState(() => _frequency = v),
            ),
          ),
          const Divider(color: RLTokens.hairlineSoft, height: 28),
          const _SheetSectionLabel('Security deposit'),
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Require a refundable security deposit from the tenant.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                      height: 1.45,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Switch.adaptive(
                  value: _depositEnabled,
                  activeTrackColor: RLTokens.crimson,
                  onChanged: (v) {
                    Haptics.vibrate(HapticsType.selection);
                    setState(() => _depositEnabled = v);
                  },
                ),
              ],
            ),
          ),
          if (_depositEnabled)
            _Field(
              label: 'Deposit amount',
              child: _TextInput(
                controller: _deposit,
                placeholder: '0.00',
                prefixText: 'GH₵ ',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                ],
                onChanged: (_) => setState(() {}),
              ),
            ),
          const Divider(color: RLTokens.hairlineSoft, height: 28),
          const _SheetSectionLabel('Initial payment'),
          const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: Text(
              'How much should the tenant pay upfront before move-in? A full '
              'payment for the entire stay, or a custom number of periods.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.5,
              ),
            ),
          ),
          _Field(
            label: 'Mode',
            child: _SelectInput(
              value: _mode,
              options: kPaymentModeOptions,
              onChanged: (v) => setState(() => _mode = v ?? 'ONE_TIME_PAYMENT'),
            ),
          ),
          if (_mode == 'CUSTOM')
            _Field(
              label:
                  'Number of ${periodLabel(widget.stayDurationFrequency, 2)} (max $_maxPeriods)',
              child: _TextInput(
                controller: _periods,
                placeholder: '1',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
              ),
            )
          else
            _Field(
              label: 'Periods',
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 15,
                ),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: RLTokens.hairline, width: 1.5),
                ),
                child: Text(
                  '$_maxPeriods $unitLabel',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.muted,
                  ),
                ),
              ),
            ),
          _InvoicePreview(
            frequencyLabel: kPaymentFrequencyOptions[_frequency] ?? '—',
            periods: periods,
            unitLabel: unitLabel,
            subtotal: subtotal,
            deposit: _depositEnabled ? depositPesewas : null,
            total: total,
          ),
        ],
      ),
    );
  }
}

class _InvoicePreview extends StatelessWidget {
  const _InvoicePreview({
    required this.frequencyLabel,
    required this.periods,
    required this.unitLabel,
    required this.subtotal,
    required this.deposit,
    required this.total,
  });

  final String frequencyLabel;
  final int periods;
  final String unitLabel;
  final int? subtotal;
  final int? deposit;
  final int? total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.receipt_long_rounded, size: 17, color: RLTokens.ink),
              SizedBox(width: 8),
              Text(
                'Invoice Summary',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  fontWeight: RLTokens.bold,
                  color: RLTokens.ink,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _InvoiceRow(
            label: 'Rent ($frequencyLabel) × $periods $unitLabel',
            value: formatPesewas(subtotal),
          ),
          if (deposit != null) ...[
            const SizedBox(height: 10),
            _InvoiceRow(
              label: 'Security deposit',
              value: formatPesewas(deposit),
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: RLTokens.hairlineSoft, height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  fontWeight: RLTokens.bold,
                  color: RLTokens.ink,
                ),
              ),
              Expanded(
                child: Text(
                  formatPesewas(total),
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 19,
                    color: RLTokens.ink,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InvoiceRow extends StatelessWidget {
  const _InvoiceRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
      ],
    );
  }
}

// ── 6. Change unit ───────────────────────────────────────────────────────────

class _ChangeUnitSheet extends StatefulWidget {
  const _ChangeUnitSheet({
    required this.units,
    required this.currentUnitId,
    required this.onClose,
  });

  final List<ApplicationUnit> units;
  final String? currentUnitId;
  final void Function([ApplicationUnit? result]) onClose;

  @override
  State<_ChangeUnitSheet> createState() => _ChangeUnitSheetState();
}

class _ChangeUnitSheetState extends State<_ChangeUnitSheet> {
  late String? _selectedId = widget.currentUnitId;

  @override
  Widget build(BuildContext context) {
    final changed = _selectedId != null && _selectedId != widget.currentUnitId;
    final selected = widget.units
        .where((u) => u.id == _selectedId)
        .cast<ApplicationUnit?>()
        .firstOrNull;

    return _Sheet(
      title: widget.currentUnitId == null ? 'Assign unit' : 'Change unit',
      desc: 'Select the unit for this lease application.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        // Saving the unit already selected would be a no-op, so it stays off
        // until the choice actually differs — matching the web.
        onSave: changed && selected != null
            ? () => widget.onClose(selected)
            : null,
      ),
      child: widget.units.isEmpty
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Text(
                'No units available for this property.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  color: RLTokens.muted,
                ),
              ),
            )
          : Column(
              children: [
                for (final unit in widget.units)
                  _UnitOption(
                    unit: unit,
                    selected: _selectedId == unit.id,
                    isCurrent: widget.currentUnitId == unit.id,
                    onTap: () {
                      Haptics.vibrate(HapticsType.selection);
                      setState(() => _selectedId = unit.id);
                    },
                  ),
              ],
            ),
    );
  }
}

class _UnitOption extends StatelessWidget {
  const _UnitOption({
    required this.unit,
    required this.selected,
    required this.isCurrent,
    required this.onTap,
  });

  final ApplicationUnit unit;
  final bool selected;
  final bool isCurrent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // An occupied or under-maintenance unit can't be taken — unless it is the
    // one already on this application, which must stay selectable.
    final selectable = unit.isAvailable || isCurrent;
    final statusLabel = propertyStatusLabel(unit.status);

    return Opacity(
      opacity: selectable ? 1 : 0.5,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: selectable ? onTap : null,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: selected ? RLTokens.crimsonTint : RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
            border: Border.all(
              color: selected ? RLTokens.crimson : RLTokens.hairline,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              RLAvatar(unit.name, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            unit.name,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 14.5,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.ink,
                            ),
                          ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: 6),
                          const Text(
                            '(current)',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 11,
                              color: RLTokens.mutedSoft,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        RLPill(statusLabel, tone: statusTone(statusLabel)),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            _rentLine(unit),
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              _SelectionDot(selected: selected),
            ],
          ),
        ),
      ),
    );
  }
}

String _rentLine(ApplicationUnit unit) {
  final rent = formatPesewas(unit.rentFee);
  if (unit.paymentFrequency == null) return rent;
  return '$rent / ${paymentFrequencyLabel(unit.paymentFrequency!)}';
}

class _SelectionDot extends StatelessWidget {
  const _SelectionDot({required this.selected});
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: selected ? RLTokens.crimson : Colors.transparent,
        shape: BoxShape.circle,
        border: selected
            ? null
            : Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      child: selected
          ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
          : null,
    );
  }
}

// ── 7. Add document ──────────────────────────────────────────────────────────

class _AddDocumentSheet extends StatefulWidget {
  const _AddDocumentSheet({required this.onClose});
  final void Function([void result]) onClose;

  @override
  State<_AddDocumentSheet> createState() => _AddDocumentSheetState();
}

class _AddDocumentSheetState extends State<_AddDocumentSheet> {
  String _mode = 'library';
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    return _Sheet(
      title: 'Add document',
      desc: 'Upload your own or select from the library.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        onSave: () => widget.onClose(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLSegmented(
            value: _mode,
            items: const [
              RLSegmentItem(key: 'upload', label: 'Manual Upload'),
              RLSegmentItem(key: 'library', label: 'From Library'),
            ],
            onChanged: (v) => setState(() => _mode = v),
          ),
          const SizedBox(height: 16),
          if (_mode == 'upload') ..._uploadMode() else ..._libraryMode(),
        ],
      ),
    );
  }

  List<Widget> _uploadMode() => [
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text(
        'Upload your own lease or tenancy document. PDF or Word, up to 5MB.',
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12.5,
          color: RLTokens.muted,
          height: 1.5,
        ),
      ),
    ),
    const SizedBox(height: 12),
    DottedBorderBox(
      child: Column(
        children: [
          const Icon(
            Icons.description_outlined,
            size: 30,
            color: RLTokens.mutedSoft,
          ),
          const SizedBox(height: 12),
          RLBtn(
            label: 'Choose document',
            kind: RLBtnKind.light,
            large: false,
            onPressed: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Document picker coming soon')),
              );
            },
          ),
        ],
      ),
    ),
  ];

  List<Widget> _libraryMode() => [
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: const Row(
        children: [
          Icon(Icons.search_rounded, size: 18, color: RLTokens.micro),
          SizedBox(width: 9),
          Text(
            'Search documents…',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              color: RLTokens.micro,
            ),
          ),
        ],
      ),
    ),
    const SizedBox(height: 12),
    // Wrap, not Row: three chips plus their padding outrun a 375pt screen.
    Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final f in ['All', 'Global', 'Property'])
          GestureDetector(
            onTap: () {
              Haptics.vibrate(HapticsType.selection);
              setState(() => _filter = f);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: _filter == f ? RLTokens.crimsonTint : RLTokens.surface,
                borderRadius: BorderRadius.circular(RLTokens.rPill),
                border: Border.all(
                  color: _filter == f
                      ? RLTokens.crimsonTint2
                      : RLTokens.hairline,
                ),
              ),
              child: Text(
                f,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: _filter == f ? RLTokens.crimson : RLTokens.muted,
                ),
              ),
            ),
          ),
      ],
    ),
    const SizedBox(height: 14),
    // Both cards should match the taller one's height. `stretch` alone can't
    // do that here: the sheet body is an unbounded-height scroll view, so
    // stretching asks the children for infinite height and fails layout.
    // IntrinsicHeight bounds the row to its tallest child first.
    IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: DottedBorderBox(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 22),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: RLTokens.micro,
                        width: 1.5,
                        strokeAlign: BorderSide.strokeAlignInside,
                      ),
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      size: 20,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Empty Document',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Start from scratch',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 11.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Column(
                children: [
                  const DocxTile(),
                  const SizedBox(height: 10),
                  const Text(
                    'basic-lease-agreement',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 8),
                  RLPill('Global', tone: RLTone.success),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  ];
}

/// Dashed-outline container used by the document picker states.
class DottedBorderBox extends StatelessWidget {
  const DottedBorderBox({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(),
      child: Container(width: double.infinity, padding: padding, child: child),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = RLTokens.hairline
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(14),
    );
    final path = Path()..addRRect(rrect);
    // Walk the outline emitting 5px dashes with 4px gaps.
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = (distance + 5).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + 4;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Blue DOCX file chip used on document rows and cards.
class DocxTile extends StatelessWidget {
  const DocxTile({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.infoBg,
        borderRadius: BorderRadius.circular(11),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.description_outlined,
            size: size * 0.42,
            color: RLTokens.info,
          ),
          Text(
            'DOCX',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: size * 0.16,
              fontWeight: RLTokens.bold,
              color: RLTokens.info,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ── 8. What's next ───────────────────────────────────────────────────────────

class _WhatsNextSheet extends StatelessWidget {
  const _WhatsNextSheet({required this.tenantName, required this.onClose});
  final String tenantName;
  final void Function([void result]) onClose;

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.home_outlined, 'Go to the lease'),
      (Icons.account_balance_wallet_outlined, 'Add a charge to this lease'),
      (Icons.checklist_rounded, 'Create a move-in inspection checklist'),
      (Icons.person_outline_rounded, 'Visit tenant profile'),
      (Icons.add_rounded, 'Create another rental application'),
    ];

    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _DragHandle(),
          const SizedBox(height: 14),
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(
              color: RLTokens.successBg,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 26,
              color: RLTokens.success,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            "What's next?",
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 23,
              color: RLTokens.ink,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 6, 28, 0),
            child: Text(
              "$tenantName's lease is active. Here's what you can do next.",
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                color: RLTokens.muted,
                height: 1.5,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
            child: RLCard(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Column(
                children: [
                  for (var i = 0; i < items.length; i++)
                    _NextRow(
                      icon: items[i].$1,
                      label: items[i].$2,
                      last: i == items.length - 1,
                      onTap: onClose,
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(18, 14, 18, 30 + bottom),
            child: RLBtn(
              label: 'Close',
              kind: RLBtnKind.light,
              full: true,
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                onClose();
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _NextRow extends StatelessWidget {
  const _NextRow({
    required this.icon,
    required this.label,
    required this.last,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool last;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          border: last
              ? null
              : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: RLTokens.ink),
            const SizedBox(width: 13),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.ink,
                ),
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: RLTokens.micro,
            ),
          ],
        ),
      ),
    );
  }
}
