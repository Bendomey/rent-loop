// Bottom sheets for the Application Info screen.
//
// Each "Edit" affordance on a section card opens the matching sheet here. The
// field sets mirror the web forms one-for-one (see
// apps/property-manager/.../applications/application/{tenant,move-in,financial}),
// so the validation rules and enum options line up with the API. The tenant
// sheets (basic, identity, background) save through UpdateApplicationNotifier
// and close on success; the remaining sheets pop an updated sub-model, or null
// when cancelled.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/phone.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_unit_options_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart' show RLSheetNote;
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:shimmer/shimmer.dart';

// ── Public API ───────────────────────────────────────────────────────────────

Future<void> showBasicInfoSheet(
  BuildContext context, {
  required ApplicationApplicant applicant,
  required String propertyId,
  required String id,
}) => _open<void>(
  context,
  (close) => _BasicInfoSheet(
    applicant: applicant,
    propertyId: propertyId,
    id: id,
    onClose: close,
  ),
);

Future<void> showIdentitySheet(
  BuildContext context, {
  required ApplicationIdentity identity,
  required String propertyId,
  required String id,
}) => _open<void>(
  context,
  (close) => _IdentitySheet(
    identity: identity,
    propertyId: propertyId,
    id: id,
    onClose: close,
  ),
);

Future<void> showBackgroundSheet(
  BuildContext context, {
  required ApplicationBackground background,
  required String propertyId,
  required String id,
}) => _open<void>(
  context,
  (close) => _BackgroundSheet(
    background: background,
    propertyId: propertyId,
    id: id,
    onClose: close,
  ),
);

Future<void> showMoveInSheet(
  BuildContext context, {
  required ApplicationMoveIn moveIn,
  required String? fallbackFrequency,
  required int chargeCount,
  required String propertyId,
  required String id,
}) => _open<void>(
  context,
  (close) => _MoveInSheet(
    moveIn: moveIn,
    fallbackFrequency: fallbackFrequency,
    chargeCount: chargeCount,
    propertyId: propertyId,
    id: id,
    onClose: close,
  ),
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

Future<void> showChangeUnitSheet(
  BuildContext context, {
  required String propertyId,
  required String id,
  required String? currentUnitId,
  required int? applicationRentFee,
}) => _open<void>(
  context,
  (close) => _ChangeUnitSheet(
    propertyId: propertyId,
    id: id,
    currentUnitId: currentUnitId,
    applicationRentFee: applicationRentFee,
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

/// Sends [patch] and reports whether the save went through; the shared
/// notifier carries the error message the sheet shows on failure.
Future<bool> _savePatch(
  WidgetRef ref, {
  required String propertyId,
  required String id,
  required Map<String, dynamic> patch,
}) async {
  await ref
      .read(updateApplicationNotifierProvider.notifier)
      .submit(propertyId: propertyId, id: id, patch: patch);
  return ref.read(updateApplicationNotifierProvider).status.isSuccess();
}

String _dateOnly(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';

Widget _saveError(UpdateApplicationState state) =>
    state.status == ApiStatus.failed
    ? Padding(
        padding: const EdgeInsets.only(top: 14),
        child: RLSheetNote(
          text: state.errorMessage ?? 'Something happened. Try again.',
          tone: RLTone.danger,
        ),
      )
    : const SizedBox.shrink();

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
    this.firstDate,
  });

  final DateTime? value;
  final ValueChanged<DateTime> onChanged;
  final String placeholder;
  final DateTime? lastDate;
  final DateTime? firstDate;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (!context.mounted) return;
        final first = firstDate ?? DateTime(1900);
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

class _BasicInfoSheet extends ConsumerStatefulWidget {
  const _BasicInfoSheet({
    required this.applicant,
    required this.propertyId,
    required this.id,
    required this.onClose,
  });
  final ApplicationApplicant applicant;
  final String propertyId;
  final String id;
  final VoidCallback onClose;

  @override
  ConsumerState<_BasicInfoSheet> createState() => _BasicInfoSheetState();
}

class _BasicInfoSheetState extends ConsumerState<_BasicInfoSheet> {
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
  late String? _photoUrl = widget.applicant.profilePhotoUrl;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(updateApplicationNotifierProvider.notifier).reset(),
    );
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _other.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool get _adult => _dob == null || isAdult(_dob!, DateTime.now());

  bool get _valid =>
      _first.text.trim().isNotEmpty &&
      _last.text.trim().isNotEmpty &&
      normalizePhone(_phone.text) != null &&
      _adult &&
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_email.text.trim());

  String? _nullIfEmpty(String v) => v.trim().isEmpty ? null : v.trim();

  Future<void> _save() async {
    final ok = await _savePatch(
      ref,
      propertyId: widget.propertyId,
      id: widget.id,
      patch: {
        'first_name': _first.text.trim(),
        'last_name': _last.text.trim(),
        'other_names': _nullIfEmpty(_other.text),
        'gender': _gender,
        'marital_status': _marital,
        'email': _email.text.trim(),
        'phone': normalizePhone(_phone.text),
        'date_of_birth': _dob == null ? null : _dateOnly(_dob!),
        'profile_photo_url': _photoUrl,
      },
    );
    if (ok && mounted) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(updateApplicationNotifierProvider);
    final pending = state.status.isLoading();
    return _Sheet(
      title: 'Basic Information',
      desc: "The tenant's personal details.",
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        saveLabel: pending ? 'Saving…' : 'Save',
        onSave: _valid && !pending && !_uploading ? _save : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Field(
            label: 'Profile photo',
            optional: true,
            child: ApplicationUploadTile(
              label: 'Profile photo',
              objectKeyPrefix: 'tenant-applications/profile-photos/',
              initialUrl: _photoUrl,
              circular: true,
              onChanged: (url) => _photoUrl = url,
              onBlockingChanged: (b) => setState(() => _uploading = b),
            ),
          ),
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
          if (!_adult)
            const RLSheetNote(
              text: 'The tenant must be at least 18 years old.',
              tone: RLTone.danger,
            ),
          _saveError(state),
        ],
      ),
    );
  }
}

// ── 2. Identity Verification ─────────────────────────────────────────────────

class _IdentitySheet extends ConsumerStatefulWidget {
  const _IdentitySheet({
    required this.identity,
    required this.propertyId,
    required this.id,
    required this.onClose,
  });
  final ApplicationIdentity identity;
  final String propertyId;
  final String id;
  final VoidCallback onClose;

  @override
  ConsumerState<_IdentitySheet> createState() => _IdentitySheetState();
}

class _IdentitySheetState extends ConsumerState<_IdentitySheet> {
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
  late String? _frontUrl = widget.identity.idFrontUrl;
  late String? _backUrl = widget.identity.idBackUrl;
  bool _frontBusy = false;
  bool _backBusy = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(updateApplicationNotifierProvider.notifier).reset(),
    );
  }

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

  Future<void> _save() async {
    final ok = await _savePatch(
      ref,
      propertyId: widget.propertyId,
      id: widget.id,
      patch: {
        'nationality': _nationality.text.trim(),
        'id_type': _idType,
        'id_number': _idNumber.text.trim(),
        'current_address': _address.text.trim(),
        'id_front_url': _frontUrl,
        'id_back_url': _backUrl,
      },
    );
    if (ok && mounted) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(updateApplicationNotifierProvider);
    final pending = state.status.isLoading();
    return _Sheet(
      title: 'Identity Verification',
      desc: "The tenant's nationality and identity document.",
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        saveLabel: pending ? 'Saving…' : 'Save',
        onSave: _valid && !pending && !_frontBusy && !_backBusy ? _save : null,
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
          ApplicationUploadTile(
            label: 'ID front',
            objectKeyPrefix: 'tenant-applications/id-documents/',
            initialUrl: _frontUrl,
            onChanged: (url) => _frontUrl = url,
            onBlockingChanged: (b) => setState(() => _frontBusy = b),
          ),
          const SizedBox(height: 12),
          ApplicationUploadTile(
            label: 'ID back',
            objectKeyPrefix: 'tenant-applications/id-documents/',
            initialUrl: _backUrl,
            onChanged: (url) => _backUrl = url,
            onBlockingChanged: (b) => setState(() => _backBusy = b),
          ),
          _saveError(state),
        ],
      ),
    );
  }
}

// ── 3. Emergency Contact & Background ────────────────────────────────────────

class _BackgroundSheet extends ConsumerStatefulWidget {
  const _BackgroundSheet({
    required this.background,
    required this.propertyId,
    required this.id,
    required this.onClose,
  });
  final ApplicationBackground background;
  final String propertyId;
  final String id;
  final VoidCallback onClose;

  @override
  ConsumerState<_BackgroundSheet> createState() => _BackgroundSheetState();
}

class _BackgroundSheetState extends ConsumerState<_BackgroundSheet> {
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
  late String? _proofUrl = widget.background.proofOfIncomeUrl;
  bool _uploading = false;

  bool get _isStudent => _employerType == 'STUDENT';

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(updateApplicationNotifierProvider.notifier).reset(),
    );
  }

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
      normalizePhone(_phone.text) != null &&
      _employerType != null;

  Future<void> _save() async {
    final ok = await _savePatch(
      ref,
      propertyId: widget.propertyId,
      id: widget.id,
      patch: {
        'emergency_contact_name': _name.text.trim(),
        'emergency_contact_phone': normalizePhone(_phone.text),
        'relationship_to_emergency_contact': _relationship.text.trim(),
        'employer_type': _employerType,
        // The web pins occupation to STUDENT for students.
        // The backend skips a null for these three plain-string fields, so a
        // cleared value has to travel as an empty string.
        'occupation': _isStudent ? 'STUDENT' : _occupation.text.trim(),
        'employer': _employer.text.trim(),
        'occupation_address': _occupationAddress.text.trim(),
        'proof_of_income_url': _proofUrl,
      },
    );
    if (ok && mounted) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(updateApplicationNotifierProvider);
    final pending = state.status.isLoading();
    return _Sheet(
      title: 'Emergency Contact & Background',
      desc: 'Who to reach in an emergency, plus employment details.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        saveLabel: pending ? 'Saving…' : 'Save',
        onSave: _valid && !pending && !_uploading ? _save : null,
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
          ApplicationUploadTile(
            label: 'Proof of ${_isStudent ? 'admission' : 'income'}',
            objectKeyPrefix: 'tenant-applications/proof-of-income/',
            initialUrl: _proofUrl,
            onChanged: (url) => _proofUrl = url,
            onBlockingChanged: (b) => setState(() => _uploading = b),
          ),
          _saveError(state),
        ],
      ),
    );
  }
}

// ── 4. Move In Setup ─────────────────────────────────────────────────────────

class _MoveInSheet extends ConsumerStatefulWidget {
  const _MoveInSheet({
    required this.moveIn,
    required this.fallbackFrequency,
    required this.chargeCount,
    required this.propertyId,
    required this.id,
    required this.onClose,
  });
  final ApplicationMoveIn moveIn;
  final String? fallbackFrequency;
  final int chargeCount;
  final String propertyId;
  final String id;
  final VoidCallback onClose;

  @override
  ConsumerState<_MoveInSheet> createState() => _MoveInSheetState();
}

class _MoveInSheetState extends ConsumerState<_MoveInSheet> {
  late final _duration = TextEditingController(
    text: (widget.moveIn.stayDuration ?? 6).toString(),
  );
  late DateTime? _date = widget.moveIn.desiredMoveInDate;

  String? get _frequency =>
      widget.moveIn.stayDurationFrequency ?? widget.fallbackFrequency;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(updateApplicationNotifierProvider.notifier).reset(),
    );
  }

  @override
  void dispose() {
    _duration.dispose();
    super.dispose();
  }

  DateTime get _today {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day);
  }

  int? get _durationValue {
    final n = int.tryParse(_duration.text.trim());
    return (n != null && n >= 1) ? n : null;
  }

  bool get _dateChanged {
    final saved = widget.moveIn.desiredMoveInDate;
    final d = _date;
    if (d == null || saved == null) return d != saved;
    return d.year != saved.year || d.month != saved.month || d.day != saved.day;
  }

  bool get _changed =>
      _dateChanged || _durationValue != widget.moveIn.stayDuration;

  bool get _datePast =>
      _dateChanged && _date != null && _date!.isBefore(_today);

  bool get _valid => _date != null && !_datePast && _durationValue != null;

  Future<bool> _confirmRecalculation() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        content: const Text(
          'Changing this will recalculate the rent for this tenant. Continue?',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.ink,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _save() async {
    if (widget.chargeCount > 0 && _changed && !await _confirmRecalculation()) {
      return;
    }
    if (!mounted) return;
    final d = _date!;
    final ok = await _savePatch(
      ref,
      propertyId: widget.propertyId,
      id: widget.id,
      patch: {
        'desired_move_in_date': DateTime.utc(
          d.year,
          d.month,
          d.day,
        ).toIso8601String(),
        'stay_duration': _durationValue,
        'stay_duration_frequency': _frequency,
      },
    );
    if (ok && mounted) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(updateApplicationNotifierProvider);
    final pending = state.status.isLoading();
    final unit = periodLabel(_frequency, _durationValue ?? 2);
    return _Sheet(
      title: 'Move In Setup',
      desc: 'When the tenant moves in and how long they intend to stay.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        saveLabel: pending ? 'Saving…' : 'Save',
        onSave: _valid && !pending ? _save : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Field(
            label: 'Desired move-in date',
            child: _DateInput(
              value: _date,
              placeholder: 'Select a date',
              firstDate: _today,
              onChanged: (d) => setState(() => _date = d),
            ),
          ),
          if (_datePast)
            const _InlineError("Move-in date can't be in the past."),
          _Field(
            label: 'Stay duration frequency',
            child: _ReadOnlyValue(kStayFrequencyOptions[_frequency] ?? '—'),
          ),
          _Field(
            label: 'Stay duration',
            child: _TextInput(
              controller: _duration,
              placeholder: 'Number of $unit',
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (_durationValue == null)
            const _InlineError('Stay duration must be at least 1.'),
          _saveError(state),
        ],
      ),
    );
  }
}

class _ReadOnlyValue extends StatelessWidget {
  const _ReadOnlyValue(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 15,
          color: RLTokens.muted,
        ),
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

class _ChangeUnitSheet extends ConsumerStatefulWidget {
  const _ChangeUnitSheet({
    required this.propertyId,
    required this.id,
    required this.currentUnitId,
    required this.applicationRentFee,
    required this.onClose,
  });

  final String propertyId;
  final String id;
  final String? currentUnitId;
  final int? applicationRentFee;
  final VoidCallback onClose;

  @override
  ConsumerState<_ChangeUnitSheet> createState() => _ChangeUnitSheetState();
}

class _ChangeUnitSheetState extends ConsumerState<_ChangeUnitSheet> {
  late String? _selectedId = widget.currentUnitId;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(updateApplicationNotifierProvider.notifier).reset(),
    );
  }

  Future<void> _save(ApplicationUnit unit) async {
    final ok = await _savePatch(
      ref,
      propertyId: widget.propertyId,
      id: widget.id,
      patch: {
        'desired_unit_id': unit.id,
        'rent_fee': widget.applicationRentFee ?? unit.rentFee,
        'rent_fee_currency': unit.rentFeeCurrency,
        'payment_frequency': unit.paymentFrequency,
        'stay_duration_frequency': unit.paymentFrequency,
      },
    );
    if (ok && mounted) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    final options = ref.watch(
      applicationUnitOptionsProvider(widget.propertyId),
    );
    final state = ref.watch(updateApplicationNotifierProvider);
    final pending = state.status.isLoading();
    final units = [
      for (final u in options.valueOrNull ?? const <UnitModel>[])
        ApplicationUnit.fromModel(u),
    ];
    final changed = _selectedId != null && _selectedId != widget.currentUnitId;
    final selected = units.where((u) => u.id == _selectedId).firstOrNull;

    return _Sheet(
      title: widget.currentUnitId == null ? 'Assign unit' : 'Change unit',
      desc: 'Select the unit for this tenant.',
      onDismiss: widget.onClose,
      footer: _saveCancel(
        onCancel: widget.onClose,
        saveLabel: pending ? 'Saving…' : 'Save',
        onSave: changed && selected != null && !pending
            ? () => _save(selected)
            : null,
      ),
      child: options.when(
        loading: () => const _UnitOptionsSkeleton(),
        error: (_, __) => RLSectionError(
          title: "Couldn't load units",
          compact: true,
          onRetry: () =>
              ref.invalidate(applicationUnitOptionsProvider(widget.propertyId)),
        ),
        data: (_) => units.isEmpty
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
                  for (final unit in units)
                    _UnitOption(
                      unit: unit,
                      selected: _selectedId == unit.id,
                      isCurrent: widget.currentUnitId == unit.id,
                      onTap: () {
                        Haptics.vibrate(HapticsType.selection);
                        setState(() => _selectedId = unit.id);
                      },
                    ),
                  _saveError(state),
                ],
              ),
      ),
    );
  }
}

class _UnitOptionsSkeleton extends StatelessWidget {
  const _UnitOptionsSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block() => Container(
      height: 68,
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
      ),
    );
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Column(children: [block(), block(), block()]),
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
    final selectable = unit.isBookable || isCurrent;
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
      (Icons.add_rounded, 'Add another tenant'),
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
