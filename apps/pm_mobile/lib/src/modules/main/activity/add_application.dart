import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/lib/phone.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_application_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/invite_tenant_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Constants ─────────────────────────────────────────────────────────────────

const _kStepLabels = ['Unit', 'Basic info', 'Identity', 'Background', 'Review'];

const _kMethodFill = "I'll fill it in";
const _kMethodLink = 'Send the tenant a link';

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String _unitLabel(UnitModel u) => [
  u.name,
  if (u.propertyBlock != null) u.propertyBlock!.name,
  if (u.property != null) u.property!.name,
].join(' · ');

String? _opt(String s) {
  final t = s.trim();
  return t.isEmpty ? null : t;
}

String _formatDate(DateTime d) => DateFormat('d MMM yyyy').format(d);

// ── Screen ────────────────────────────────────────────────────────────────────

class AddApplicationScreen extends ConsumerStatefulWidget {
  const AddApplicationScreen({super.key, this.propertyId});

  final String? propertyId;

  @override
  ConsumerState<AddApplicationScreen> createState() =>
      _AddApplicationScreenState();
}

class _AddApplicationScreenState extends ConsumerState<AddApplicationScreen> {
  int _step = 1;
  String? _picker;
  bool _showInvite = false;
  bool _looking = false;
  bool _returning = false;
  String? _lookedUpPhone;

  UnitModel? _unit;
  String _method = _kMethodFill;
  final _firstCtrl = TextEditingController();
  final _otherCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  String _gender = '';
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  DateTime? _dob;
  String _marital = '';
  final _addressCtrl = TextEditingController();
  final _natCtrl = TextEditingController(text: 'Ghanaian');
  String _idType = '';
  final _idNumCtrl = TextEditingController();
  final _ecNameCtrl = TextEditingController();
  final _ecRelCtrl = TextEditingController();
  final _ecPhoneCtrl = TextEditingController();
  String _employment = 'Worker';
  final _occupationCtrl = TextEditingController();
  final _employerCtrl = TextEditingController();
  final _workAddrCtrl = TextEditingController();

  String? _profileUrl;
  String? _idFrontUrl;
  String? _idBackUrl;
  String? _proofUrl;
  final _blocking = <String>{};
  final _errors = <String, String>{};

  bool get _isStudent => _employment == 'Student';
  bool get _fillIn => _method == _kMethodFill;

  @override
  void dispose() {
    for (final c in [
      _firstCtrl,
      _otherCtrl,
      _lastCtrl,
      _emailCtrl,
      _phoneCtrl,
      _addressCtrl,
      _natCtrl,
      _idNumCtrl,
      _ecNameCtrl,
      _ecRelCtrl,
      _ecPhoneCtrl,
      _occupationCtrl,
      _employerCtrl,
      _workAddrCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  List<String> _managedIds(Map<String, String> roles) => [
    for (final e in roles.entries)
      if (e.value == 'MANAGER' &&
          (widget.propertyId == null || e.key == widget.propertyId))
        e.key,
  ];

  Future<void> _pickUnit() async {
    final managed = ref.read(myPropertyRolesProvider).valueOrNull;
    if (managed == null) return;
    final options = unitOptionsNotifierProvider(
      UnitOptionsQuery(propertyIds: _managedIds(managed), bookableOnly: true),
    );
    final picked = await showPagedPickerSheet<UnitModel>(
      context: context,
      title: 'Select unit',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: _unitLabel,
      id: (u) => u.id,
      initial: [?_unit],
      emptyText: 'No available units',
    );
    if (picked == null || picked.isEmpty || !mounted) return;
    setState(() {
      _unit = picked.first;
      _errors.remove('unit');
    });
  }

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'gender':
          _gender = value;
          _errors.remove('gender');
        case 'marital':
          _marital = value;
          _errors.remove('marital');
        case 'idType':
          _idType = value;
          _errors.remove('idType');
      }
      _picker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  Future<void> _pickDob() async {
    Haptics.vibrate(HapticsType.selection);
    final now = DateTime.now();
    final latest = DateTime(now.year - 18, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob != null && !_dob!.isAfter(latest) ? _dob! : latest,
      firstDate: DateTime(1900),
      lastDate: latest,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _dob = DateTime.utc(picked.year, picked.month, picked.day);
      _errors.remove('dob');
    });
  }

  void _setBlocking(String id, bool blocking) {
    if (!mounted) return;
    setState(() => blocking ? _blocking.add(id) : _blocking.remove(id));
  }

  bool _validateStep(int step) {
    final errors = <String, String>{};
    switch (step) {
      case 1:
        if (_unit == null) errors['unit'] = 'Choose a unit.';
        if (_fillIn && normalizePhone(_phoneCtrl.text) == null) {
          errors['phone'] = 'Enter a valid phone number.';
        }
      case 2:
        if (_firstCtrl.text.trim().length < 2) {
          errors['first'] = 'Enter at least 2 letters.';
        }
        if (_lastCtrl.text.trim().length < 2) {
          errors['last'] = 'Enter at least 2 letters.';
        }
        if (_gender.isEmpty) errors['gender'] = 'Choose one.';
        if (_dob == null) {
          errors['dob'] = 'Choose a date.';
        } else if (!isAdult(_dob!, DateTime.now())) {
          errors['dob'] = 'Must be 18 or older.';
        }
        if (_addressCtrl.text.trim().length < 5) {
          errors['address'] = 'Enter at least 5 characters.';
        }
        final email = _emailCtrl.text.trim();
        if (email.isNotEmpty && !_emailPattern.hasMatch(email)) {
          errors['email'] = 'Enter a valid email.';
        }
        if (_marital.isEmpty) errors['marital'] = 'Choose one.';
      case 3:
        if (_natCtrl.text.trim().isEmpty) {
          errors['nationality'] = 'Enter a nationality.';
        }
        if (_idType.isEmpty) errors['idType'] = 'Choose one.';
        if (_idNumCtrl.text.trim().isEmpty) {
          errors['idNumber'] = 'Enter the ID number.';
        }
      case 4:
        if (_ecNameCtrl.text.trim().isEmpty) {
          errors['ecName'] = 'Enter a name.';
        }
        if (_ecRelCtrl.text.trim().isEmpty) {
          errors['ecRel'] = 'Enter a relationship.';
        }
        if (normalizePhone(_ecPhoneCtrl.text) == null) {
          errors['ecPhone'] = 'Enter a valid phone number.';
        }
        if (!_isStudent && _occupationCtrl.text.trim().isEmpty) {
          errors['occupation'] = 'Enter an occupation.';
        }
        if (_employerCtrl.text.trim().isEmpty) {
          errors['employer'] = _isStudent
              ? 'Enter a school.'
              : 'Enter an employer.';
        }
        if (_workAddrCtrl.text.trim().isEmpty) {
          errors['workAddr'] = 'Enter an address.';
        }
    }
    setState(() {
      const keysByStep = {
        1: ['unit', 'phone'],
        2: ['first', 'last', 'gender', 'dob', 'address', 'email', 'marital'],
        3: ['nationality', 'idType', 'idNumber'],
        4: ['ecName', 'ecRel', 'ecPhone', 'occupation', 'employer', 'workAddr'],
      };
      _errors.removeWhere((k, _) => (keysByStep[step] ?? []).contains(k));
      _errors.addAll(errors);
    });
    return errors.isEmpty;
  }

  int? _firstInvalidStep() {
    for (final step in [1, 2, 3, 4]) {
      if (!_validateStep(step)) return step;
    }
    return null;
  }

  void _prefill(TenantLookupModel t) {
    _firstCtrl.text = t.firstName ?? '';
    _otherCtrl.text = t.otherNames ?? '';
    _lastCtrl.text = t.lastName ?? '';
    _emailCtrl.text = t.email ?? '';
    if (t.phone != null) _phoneCtrl.text = nationalDigits(t.phone!);
    _addressCtrl.text = t.currentAddress ?? '';
    _gender = applicationGenderLabel(t.gender) ?? '';
    _marital = applicationMaritalStatusLabel(t.maritalStatus) ?? '';
    final dob = t.dateOfBirth?.toUtc();
    _dob = dob == null ? null : DateTime.utc(dob.year, dob.month, dob.day);
    _natCtrl.text = t.nationality ?? 'Ghanaian';
    _idType = applicationIdTypeLabel(t.idType) ?? '';
    _idNumCtrl.text = t.idNumber ?? '';
    _ecNameCtrl.text = t.emergencyContactName ?? '';
    _ecRelCtrl.text = t.relationshipToEmergencyContact ?? '';
    _ecPhoneCtrl.text = nationalDigits(t.emergencyContactPhone ?? '');
    _employment = t.occupation == 'STUDENT' ? 'Student' : 'Worker';
    _occupationCtrl.text = t.occupation == 'STUDENT' ? '' : t.occupation ?? '';
    _employerCtrl.text = t.employer ?? '';
    _workAddrCtrl.text = t.occupationAddress ?? '';
    _profileUrl = t.profilePhotoUrl;
    _idFrontUrl = t.idFrontUrl;
    _idBackUrl = t.idBackUrl;
    _proofUrl = t.proofOfIncomeUrl;
  }

  void _clearPrefill() {
    for (final c in [
      _firstCtrl,
      _otherCtrl,
      _lastCtrl,
      _emailCtrl,
      _addressCtrl,
      _idNumCtrl,
      _ecNameCtrl,
      _ecRelCtrl,
      _ecPhoneCtrl,
      _occupationCtrl,
      _employerCtrl,
      _workAddrCtrl,
    ]) {
      c.clear();
    }
    _natCtrl.text = 'Ghanaian';
    _gender = '';
    _marital = '';
    _dob = null;
    _idType = '';
    _employment = 'Worker';
    _profileUrl = null;
    _idFrontUrl = null;
    _idBackUrl = null;
    _proofUrl = null;
  }

  Future<void> _lookup() async {
    final e164 = normalizePhone(_phoneCtrl.text)!;
    if (e164 == _lookedUpPhone) {
      setState(() => _step = _returning ? 5 : 2);
      return;
    }
    setState(() => _looking = true);
    TenantLookupModel? tenant;
    var succeeded = true;
    try {
      tenant = await ref
          .read(tenantApplicationApiProvider)
          .lookupTenantByPhone(e164);
    } catch (_) {
      succeeded = false;
    }
    if (!mounted) return;
    setState(() {
      _looking = false;
      if (_returning) _clearPrefill();
      _lookedUpPhone = succeeded ? e164 : null;
      _returning = tenant != null;
      if (tenant != null) {
        _prefill(tenant);
        _step = 5;
      } else {
        _phoneCtrl.text = nationalDigits(e164);
        _step = 2;
      }
    });
  }

  Future<void> _submit() async {
    final invalid = _firstInvalidStep();
    if (invalid != null) {
      setState(() => _step = invalid);
      FocusManager.instance.primaryFocus?.unfocus();
      WidgetsBinding.instance.addPostFrameCallback((_) => _revealFirstError());
      return;
    }
    final unit = _unit!;
    final propertyId = unit.propertyId ?? unit.property?.id;
    if (propertyId == null) return;

    final input = CreateTenantApplicationInput(
      desiredUnitId: unit.id,
      firstName: _firstCtrl.text.trim(),
      lastName: _lastCtrl.text.trim(),
      phone: normalizePhone(_phoneCtrl.text)!,
      gender: applicationGenderApiValue(_gender),
      otherNames: _opt(_otherCtrl.text),
      email: _opt(_emailCtrl.text),
      dateOfBirth: _dob,
      nationality: _opt(_natCtrl.text),
      maritalStatus: _marital.isEmpty
          ? null
          : applicationMaritalStatusApiValue(_marital),
      idType: _idType.isEmpty ? null : applicationIdTypeApiValue(_idType),
      idNumber: _opt(_idNumCtrl.text),
      idFrontUrl: _idFrontUrl,
      idBackUrl: _idBackUrl,
      currentAddress: _opt(_addressCtrl.text),
      emergencyContactName: _opt(_ecNameCtrl.text),
      emergencyContactPhone: normalizePhone(_ecPhoneCtrl.text),
      relationshipToEmergencyContact: _opt(_ecRelCtrl.text),
      occupation: _isStudent ? 'STUDENT' : _opt(_occupationCtrl.text),
      employer: _opt(_employerCtrl.text),
      employerType: _isStudent ? 'STUDENT' : 'WORKER',
      proofOfIncomeUrl: _proofUrl,
      occupationAddress: _opt(_workAddrCtrl.text),
      profilePhotoUrl: _profileUrl,
    );

    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(createApplicationNotifierProvider.notifier);
    await notifier.submit(input, propertyId: propertyId);
    if (!mounted) return;
    final created = ref.read(createApplicationNotifierProvider).application;
    if (created != null) {
      context.pushReplacement(
        '/activity/applications/${created.id}?property_id=$propertyId',
      );
    }
  }

  Future<void> _next() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted || _looking) return;
    if (!_validateStep(_step)) {
      FocusManager.instance.primaryFocus?.unfocus();
      WidgetsBinding.instance.addPostFrameCallback((_) => _revealFirstError());
      return;
    }
    if (_step == 1) {
      if (_fillIn) {
        await _lookup();
      } else {
        setState(() => _showInvite = true);
      }
      return;
    }
    if (_step == 5) {
      await _submit();
      return;
    }
    setState(() => _step = _step + 1);
  }

  void _revealFirstError() {
    if (!mounted) return;
    BuildContext? first;
    void visit(Element e) {
      if (first != null) return;
      if (e.widget is _FieldError) {
        first = e;
        return;
      }
      e.visitChildren(visit);
    }

    (context as Element).visitChildren(visit);
    final target = first;
    if (target == null) return;
    Scrollable.ensureVisible(
      target,
      alignment: 0.3,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  void _prev() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _step = (_step - 1).clamp(1, 5));
  }

  void _cancel() async {
    await Haptics.vibrate(HapticsType.selection);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final managedAsync = ref
        .watch(myPropertyRolesProvider)
        .whenData(_managedIds);
    final submitting = ref
        .watch(createApplicationNotifierProvider)
        .status
        .isLoading();
    final canAdvance = _blocking.isEmpty && !_looking && !submitting;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              _StepHeader(step: _step, onClose: _cancel),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 140),
                  child: _buildStep(managedAsync),
                ),
              ),
            ],
          ),

          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _Footer(
              step: _step,
              busy: _looking || submitting,
              onCancel: _cancel,
              onBack: _prev,
              onNext: canAdvance ? _next : null,
            ),
          ),

          if (_picker == 'gender')
            _PickerSheet(
              title: 'Gender',
              options: kApplicationGenderLabels
                  .map((l) => _PickerOption(label: l))
                  .toList(),
              selected: _gender,
              onPick: (v) => _pick('gender', v),
              onClose: () => setState(() => _picker = null),
            ),
          if (_picker == 'marital')
            _PickerSheet(
              title: 'Marital status',
              options: kApplicationMaritalStatusLabels
                  .map((l) => _PickerOption(label: l))
                  .toList(),
              selected: _marital,
              onPick: (v) => _pick('marital', v),
              onClose: () => setState(() => _picker = null),
            ),
          if (_picker == 'idType')
            _PickerSheet(
              title: 'ID type',
              options: kApplicationIdTypeLabels
                  .map((l) => _PickerOption(label: l))
                  .toList(),
              selected: _idType,
              onPick: (v) => _pick('idType', v),
              onClose: () => setState(() => _picker = null),
            ),

          if (_showInvite)
            InviteTenantSheet(
              unit: _unit!,
              onClose: () => setState(() => _showInvite = false),
              onSent: () => context.pop(),
            ),
        ],
      ),
    );
  }

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _picker = key);
  }

  Widget _buildStep(AsyncValue<List<String>> managedAsync) {
    return switch (_step) {
      1 => _Step1(
        managedAsync: managedAsync,
        unit: _unit == null ? '' : _unitLabel(_unit!),
        method: _method,
        phoneCtrl: _phoneCtrl,
        unitError: _errors['unit'],
        phoneError: _errors['phone'],
        onOpenUnitPicker: _pickUnit,
        onRetryUnits: () => ref.invalidate(myPropertyRolesProvider),
        onMethodChanged: (v) => setState(() => _method = v),
      ),
      2 => _Step2(
        firstCtrl: _firstCtrl,
        otherCtrl: _otherCtrl,
        lastCtrl: _lastCtrl,
        gender: _gender,
        emailCtrl: _emailCtrl,
        dob: _dob == null ? '' : _formatDate(_dob!),
        marital: _marital,
        addressCtrl: _addressCtrl,
        errors: _errors,
        profileUrl: _profileUrl,
        onProfileChanged: (u) => setState(() => _profileUrl = u),
        onBlockingChanged: _setBlocking,
        onOpenGenderPicker: () => _openPicker('gender'),
        onOpenDobPicker: _pickDob,
        onOpenMaritalPicker: () => _openPicker('marital'),
      ),
      3 => _Step3(
        natCtrl: _natCtrl,
        idType: _idType,
        idNumCtrl: _idNumCtrl,
        errors: _errors,
        frontUrl: _idFrontUrl,
        backUrl: _idBackUrl,
        onFrontChanged: (u) => setState(() => _idFrontUrl = u),
        onBackChanged: (u) => setState(() => _idBackUrl = u),
        onBlockingChanged: _setBlocking,
        onOpenIdTypePicker: () => _openPicker('idType'),
      ),
      4 => _Step4(
        ecNameCtrl: _ecNameCtrl,
        ecRelCtrl: _ecRelCtrl,
        ecPhoneCtrl: _ecPhoneCtrl,
        errors: _errors,
        employment: _employment,
        occupationCtrl: _occupationCtrl,
        employerCtrl: _employerCtrl,
        workAddrCtrl: _workAddrCtrl,
        proofUrl: _proofUrl,
        onProofChanged: (u) => setState(() => _proofUrl = u),
        onBlockingChanged: _setBlocking,
        onEmploymentChanged: (v) {
          Haptics.vibrate(HapticsType.selection);
          setState(() => _employment = v);
        },
      ),
      _ => _Step5(
        returning: _returning,
        unit: _unit == null ? '' : _unitLabel(_unit!),
        method: _method,
        phone: _phoneCtrl.text,
        first: _firstCtrl.text,
        other: _otherCtrl.text,
        last: _lastCtrl.text,
        gender: _gender,
        marital: _marital,
        dob: _dob == null ? '' : _formatDate(_dob!),
        email: _emailCtrl.text,
        addressCtrl: _addressCtrl,
        nationality: _natCtrl.text,
        idType: _idType,
        idNum: _idNumCtrl.text,
        ecName: _ecNameCtrl.text,
        ecRel: _ecRelCtrl.text,
        ecPhone: _ecPhoneCtrl.text,
        employment: _employment,
        occupation: _occupationCtrl.text,
        employer: _employerCtrl.text,
        workAddr: _workAddrCtrl.text,
        profileUrl: _profileUrl,
        idFrontUrl: _idFrontUrl,
        idBackUrl: _idBackUrl,
        proofUrl: _proofUrl,
        error: ref.watch(createApplicationNotifierProvider).errorMessage,
        onEditStep: (s) {
          Haptics.vibrate(HapticsType.selection);
          setState(() => _step = s);
        },
      ),
    };
  }
}

// ── Step header ───────────────────────────────────────────────────────────────

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.onClose});
  final int step;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Row(
              children: [
                GestureDetector(
                  onTap: onClose,
                  child: const Padding(
                    padding: EdgeInsets.all(6),
                    child: Icon(Icons.close, size: 22, color: RLTokens.ink),
                  ),
                ),
                const Expanded(
                  child: Text(
                    'New tenant',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 16,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ),
                Text(
                  '$step/5',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: List.generate(5, (i) {
                    return Expanded(
                      child: Container(
                        height: 4,
                        margin: EdgeInsets.only(right: i < 4 ? 5 : 0),
                        decoration: BoxDecoration(
                          color: i < step ? RLTokens.crimson : RLTokens.fill,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 8),
                Text(
                  'STEP $step · ${_kStepLabels[step - 1].toUpperCase()}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ),
          Container(height: 1, color: RLTokens.hairlineSoft),
        ],
      ),
    );
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  const _Footer({
    required this.step,
    required this.busy,
    required this.onCancel,
    required this.onBack,
    required this.onNext,
  });
  final int step;
  final bool busy;
  final VoidCallback onCancel;
  final VoidCallback onBack;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final String nextLabel = busy
        ? 'Please wait…'
        : step == 4
        ? 'Preview'
        : step == 5
        ? 'Add tenant'
        : 'Next';
    final IconData nextIcon = step == 5
        ? Icons.check_rounded
        : Icons.arrow_forward_rounded;

    return Container(
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
          if (step == 1)
            GestureDetector(
              onTap: onCancel,
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
            )
          else
            GestureDetector(
              onTap: onBack,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 4,
                  vertical: 12,
                ),
                child: Row(
                  children: const [
                    Icon(Icons.chevron_left, size: 18, color: RLTokens.ink),
                    SizedBox(width: 4),
                    Text(
                      'Back',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textAction,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const Spacer(),
          RLBtn(
            label: nextLabel,
            kind: RLBtnKind.primary,
            icon: nextIcon,
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

// ── Step 1 — Unit & method ────────────────────────────────────────────────────

class _Step1 extends StatelessWidget {
  const _Step1({
    required this.managedAsync,
    required this.unit,
    required this.method,
    required this.phoneCtrl,
    required this.unitError,
    required this.phoneError,
    required this.onOpenUnitPicker,
    required this.onRetryUnits,
    required this.onMethodChanged,
  });
  final AsyncValue<List<String>> managedAsync;
  final String unit;
  final String method;
  final TextEditingController phoneCtrl;
  final String? unitError, phoneError;
  final VoidCallback onOpenUnitPicker;
  final VoidCallback onRetryUnits;
  final ValueChanged<String> onMethodChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(
          title: 'Unit & onboarding',
          desc: 'Choose the unit and how this tenant will be added.',
        ),
        const SizedBox(height: 22),
        _FormField(
          label: 'Unit',
          error: unitError,
          child: managedAsync.when(
            loading: () => const _SelectField(
              value: '',
              placeholder: 'Loading units…',
              onTap: _noop,
            ),
            error: (_, __) => GestureDetector(
              onTap: onRetryUnits,
              child: const Text(
                "Couldn't load units. Tap to try again.",
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  color: RLTokens.danger,
                ),
              ),
            ),
            data: (managed) => managed.isEmpty
                ? const Text(
                    'You can only add tenants to properties you manage.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  )
                : _SelectField(
                    value: unit,
                    placeholder: 'Select unit',
                    onTap: onOpenUnitPicker,
                  ),
          ),
        ),
        const SizedBox(height: 18),
        const _FieldLabel(text: 'How do you want to add them?', required: true),
        const SizedBox(height: 8),
        _RentalRow(
          icon: Icons.person_outline_rounded,
          title: _kMethodFill,
          desc: 'You enter the tenant\'s details on their behalf.',
          selected: method == _kMethodFill,
          onTap: () => onMethodChanged(_kMethodFill),
        ),
        const SizedBox(height: 10),
        _RentalRow(
          icon: Icons.bolt_rounded,
          title: _kMethodLink,
          desc: 'They complete their own details from a link.',
          selected: method == _kMethodLink,
          onTap: () => onMethodChanged(_kMethodLink),
        ),
        if (method == _kMethodFill) ...[
          const SizedBox(height: 22),
          _FormField(
            label: 'Tenant\'s phone number',
            error: phoneError,
            child: _PhoneField(controller: phoneCtrl),
          ),
          const SizedBox(height: 6),
          const Text(
            'If they have rented with RentLoop before, we\'ll fill in their details.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.mutedSoft,
            ),
          ),
        ],
      ],
    );
  }
}

void _noop() {}

// ── Step 2 — Basic information ────────────────────────────────────────────────

class _Step2 extends StatelessWidget {
  const _Step2({
    required this.firstCtrl,
    required this.otherCtrl,
    required this.lastCtrl,
    required this.gender,
    required this.emailCtrl,
    required this.dob,
    required this.marital,
    required this.addressCtrl,
    required this.errors,
    required this.profileUrl,
    required this.onProfileChanged,
    required this.onBlockingChanged,
    required this.onOpenGenderPicker,
    required this.onOpenDobPicker,
    required this.onOpenMaritalPicker,
  });
  final TextEditingController firstCtrl,
      otherCtrl,
      lastCtrl,
      emailCtrl,
      addressCtrl;
  final String gender, dob, marital;
  final Map<String, String> errors;
  final String? profileUrl;
  final ValueChanged<String?> onProfileChanged;
  final void Function(String id, bool blocking) onBlockingChanged;
  final VoidCallback onOpenGenderPicker, onOpenDobPicker, onOpenMaritalPicker;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(
          title: 'Basic information',
          desc: 'The tenant\'s personal details.',
        ),
        const SizedBox(height: 22),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _FormField(
                label: 'First name',
                error: errors['first'],
                child: _InputField(controller: firstCtrl, placeholder: 'First'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FormField(
                label: 'Other names',
                required: false,
                child: _InputField(
                  controller: otherCtrl,
                  placeholder: 'Middle',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _FormField(
                label: 'Last name',
                error: errors['last'],
                child: _InputField(controller: lastCtrl, placeholder: 'Last'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FormField(
                label: 'Gender',
                error: errors['gender'],
                child: _SelectField(
                  value: gender,
                  placeholder: 'Select',
                  onTap: onOpenGenderPicker,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Email',
          required: false,
          error: errors['email'],
          child: _InputField(
            controller: emailCtrl,
            placeholder: 'name@example.com',
            prefixIcon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'We\'ll send notifications to this email.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 11.5,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _FormField(
                label: 'Date of birth',
                error: errors['dob'],
                child: _SelectField(
                  value: dob,
                  placeholder: 'Select date',
                  onTap: onOpenDobPicker,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FormField(
                label: 'Marital status',
                error: errors['marital'],
                child: _SelectField(
                  value: marital,
                  placeholder: 'Select',
                  onTap: onOpenMaritalPicker,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Current address',
          error: errors['address'],
          child: _InputField(
            controller: addressCtrl,
            placeholder: 'Street, city',
          ),
        ),
        const SizedBox(height: 20),
        const Text.rich(
          TextSpan(
            text: 'Profile picture',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
            children: [
              TextSpan(
                text: '  ·  Optional',
                style: TextStyle(
                  color: RLTokens.mutedSoft,
                  fontWeight: RLTokens.medium,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        ApplicationUploadTile(
          label: 'Profile picture',
          objectKeyPrefix: 'tenant-applications/profile-photos',
          circular: true,
          initialUrl: profileUrl,
          onChanged: onProfileChanged,
          onBlockingChanged: (b) => onBlockingChanged('profile', b),
        ),
      ],
    );
  }
}

// ── Step 3 — Identity verification ───────────────────────────────────────────

class _Step3 extends StatelessWidget {
  const _Step3({
    required this.natCtrl,
    required this.idType,
    required this.idNumCtrl,
    required this.errors,
    required this.frontUrl,
    required this.backUrl,
    required this.onFrontChanged,
    required this.onBackChanged,
    required this.onBlockingChanged,
    required this.onOpenIdTypePicker,
  });
  final TextEditingController natCtrl, idNumCtrl;
  final Map<String, String> errors;
  final String idType;
  final String? frontUrl, backUrl;
  final ValueChanged<String?> onFrontChanged, onBackChanged;
  final void Function(String id, bool blocking) onBlockingChanged;
  final VoidCallback onOpenIdTypePicker;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(
          title: 'Identity verification',
          desc: 'Provide identification details and document images.',
        ),
        const SizedBox(height: 22),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _FormField(
                label: 'Nationality',
                error: errors['nationality'],
                child: _InputField(controller: natCtrl, placeholder: 'Country'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FormField(
                label: 'ID type',
                error: errors['idType'],
                child: _SelectField(
                  value: idType,
                  placeholder: 'Select',
                  onTap: onOpenIdTypePicker,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'ID number',
          error: errors['idNumber'],
          child: _InputField(controller: idNumCtrl, placeholder: 'ID number'),
        ),
        const SizedBox(height: 24),
        const _SubHead(
          title: 'ID document images',
          desc: 'Upload clear photos of both sides of the ID.',
        ),
        ApplicationUploadTile(
          label: 'Front of ID',
          objectKeyPrefix: 'tenant-applications/id-documents',
          initialUrl: frontUrl,
          onChanged: onFrontChanged,
          onBlockingChanged: (b) => onBlockingChanged('idFront', b),
        ),
        const SizedBox(height: 12),
        ApplicationUploadTile(
          label: 'Back of ID',
          objectKeyPrefix: 'tenant-applications/id-documents',
          initialUrl: backUrl,
          onChanged: onBackChanged,
          onBlockingChanged: (b) => onBlockingChanged('idBack', b),
        ),
      ],
    );
  }
}

// ── Step 4 — Emergency contact & background ───────────────────────────────────

class _Step4 extends StatelessWidget {
  const _Step4({
    required this.ecNameCtrl,
    required this.ecRelCtrl,
    required this.ecPhoneCtrl,
    required this.errors,
    required this.employment,
    required this.occupationCtrl,
    required this.employerCtrl,
    required this.workAddrCtrl,
    required this.proofUrl,
    required this.onProofChanged,
    required this.onBlockingChanged,
    required this.onEmploymentChanged,
  });
  final TextEditingController ecNameCtrl,
      ecRelCtrl,
      ecPhoneCtrl,
      occupationCtrl,
      employerCtrl,
      workAddrCtrl;
  final Map<String, String> errors;
  final String employment;
  final String? proofUrl;
  final ValueChanged<String?> onProofChanged;
  final void Function(String id, bool blocking) onBlockingChanged;
  final ValueChanged<String> onEmploymentChanged;

  @override
  Widget build(BuildContext context) {
    final isStudent = employment == 'Student';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(
          title: 'Emergency contact & background',
          desc: 'Emergency contact and work or study details.',
        ),
        const SizedBox(height: 22),
        const _SubHead(title: 'Emergency contact'),
        _FormField(
          label: 'Full name',
          error: errors['ecName'],
          child: _InputField(
            controller: ecNameCtrl,
            placeholder: 'Enter full name',
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Relationship',
          error: errors['ecRel'],
          child: _InputField(
            controller: ecRelCtrl,
            placeholder: 'e.g. Sibling, Parent, Friend',
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Phone number',
          error: errors['ecPhone'],
          child: _PhoneField(controller: ecPhoneCtrl),
        ),
        const SizedBox(height: 26),
        Container(height: 1, color: RLTokens.hairlineSoft),
        const SizedBox(height: 22),
        const _SubHead(
          title: 'Work or study',
          desc: 'Select the current status.',
        ),
        Row(
          children: [
            Expanded(
              child: _ToggleButton(
                label: 'Worker',
                selected: !isStudent,
                onTap: () => onEmploymentChanged('Worker'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ToggleButton(
                label: 'Student',
                selected: isStudent,
                onTap: () => onEmploymentChanged('Student'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        _SubHead(
          title: isStudent ? 'Student information' : 'Worker information',
        ),
        if (!isStudent) ...[
          _FormField(
            label: 'Occupation',
            error: errors['occupation'],
            child: _InputField(
              controller: occupationCtrl,
              placeholder: 'e.g. Accountant',
            ),
          ),
          const SizedBox(height: 16),
        ],
        _FormField(
          label: isStudent ? 'School' : 'Employer',
          error: errors['employer'],
          child: _InputField(
            controller: employerCtrl,
            placeholder: isStudent
                ? 'e.g. University of Ghana'
                : 'e.g. Company',
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Address',
          error: errors['workAddr'],
          child: _InputField(
            controller: workAddrCtrl,
            placeholder: 'e.g. 123 Business St, City',
          ),
        ),
        const SizedBox(height: 26),
        Container(height: 1, color: RLTokens.hairlineSoft),
        const SizedBox(height: 22),
        _SubHead(
          title: isStudent ? 'Proof of admission' : 'Proof of employment',
          desc:
              'Upload a photo of a document, such as an admission letter or '
              'employment letter.',
        ),
        ApplicationUploadTile(
          label: isStudent ? 'Proof of admission' : 'Proof of employment',
          objectKeyPrefix: 'tenant-applications/proof-of-income',
          initialUrl: proofUrl,
          onChanged: onProofChanged,
          onBlockingChanged: (b) => onBlockingChanged('proof', b),
        ),
      ],
    );
  }
}

// ── Step 5 — Review ───────────────────────────────────────────────────────────

class _Step5 extends StatelessWidget {
  const _Step5({
    required this.returning,
    required this.unit,
    required this.method,
    required this.phone,
    required this.first,
    required this.other,
    required this.last,
    required this.gender,
    required this.marital,
    required this.dob,
    required this.email,
    required this.addressCtrl,
    required this.nationality,
    required this.idType,
    required this.idNum,
    required this.ecName,
    required this.ecRel,
    required this.ecPhone,
    required this.employment,
    required this.occupation,
    required this.employer,
    required this.workAddr,
    required this.profileUrl,
    required this.idFrontUrl,
    required this.idBackUrl,
    required this.proofUrl,
    required this.error,
    required this.onEditStep,
  });
  final bool returning;
  final String unit,
      method,
      phone,
      first,
      other,
      last,
      gender,
      marital,
      dob,
      email,
      nationality,
      idType,
      idNum,
      ecName,
      ecRel,
      ecPhone,
      employment,
      occupation,
      employer,
      workAddr;
  final TextEditingController addressCtrl;
  final String? profileUrl, idFrontUrl, idBackUrl, proofUrl, error;
  final ValueChanged<int> onEditStep;

  @override
  Widget build(BuildContext context) {
    final student = employment == 'Student';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(
          title: 'Review details',
          desc:
              'Review everything below. Tap edit to change a section before adding.',
        ),
        const SizedBox(height: 20),
        if (returning) ...[
          const RLInlineBanner(
            tone: RLBannerTone.info,
            title: 'Returning tenant — we filled in their details',
            body: 'Check them below. You can still change the current address.',
          ),
          const SizedBox(height: 12),
          _FormField(
            label: 'Current address',
            child: _InputField(
              controller: addressCtrl,
              placeholder: 'Street, city',
            ),
          ),
          const SizedBox(height: 16),
        ],
        _RevSection(
          title: 'Unit & onboarding',
          desc: 'Selected unit and method',
          onEdit: () => onEditStep(1),
          child: _RevGrid(
            children: [
              _RevPair(k: 'Unit', v: unit),
              _RevPair(k: 'Method', v: method),
              _RevPair(k: 'Phone', v: phone),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _RevSection(
          title: 'Basic information',
          desc: 'Personal details',
          onEdit: () => onEditStep(2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _RevGrid(
                children: [
                  _RevPair(k: 'First name', v: first),
                  _RevPair(k: 'Last name', v: last),
                  _RevPair(k: 'Other names', v: other),
                  _RevPair(k: 'Gender', v: gender),
                  _RevPair(k: 'Date of birth', v: dob),
                  _RevPair(k: 'Marital status', v: marital),
                  _RevPair(k: 'Email', v: email),
                ],
              ),
              const SizedBox(height: 14),
              _RevPair(k: 'Address', v: addressCtrl.text),
              _RevThumbs(urls: [profileUrl]),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _RevSection(
          title: 'Identity verification',
          desc: 'Identification details',
          onEdit: () => onEditStep(3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _RevGrid(
                children: [
                  _RevPair(k: 'Nationality', v: nationality),
                  _RevPair(k: 'ID type', v: idType),
                  _RevPair(k: 'ID number', v: idNum),
                ],
              ),
              _RevThumbs(urls: [idFrontUrl, idBackUrl]),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _RevSection(
          title: 'Emergency & background',
          desc: 'Contact and work or study',
          onEdit: () => onEditStep(4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _RevGrid(
                children: [
                  _RevPair(k: 'Emergency name', v: ecName),
                  _RevPair(k: 'Relationship', v: ecRel),
                  _RevPair(k: 'Emergency phone', v: ecPhone),
                  _RevPair(k: 'Status', v: employment),
                  if (!student) _RevPair(k: 'Occupation', v: occupation),
                  _RevPair(k: student ? 'School' : 'Employer', v: employer),
                  _RevPair(k: 'Address', v: workAddr),
                ],
              ),
              _RevThumbs(urls: [proofUrl]),
            ],
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 14),
          RLInlineBanner(title: error!),
        ],
      ],
    );
  }
}

class _RevThumbs extends StatelessWidget {
  const _RevThumbs({required this.urls});
  final List<String?> urls;

  @override
  Widget build(BuildContext context) {
    final shown = urls.whereType<String>().toList();
    if (shown.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          for (final url in shown)
            ClipRRect(
              borderRadius: BorderRadius.circular(RLTokens.rMd),
              child: SizedBox(
                width: 64,
                height: 64,
                child: Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: RLTokens.fill,
                    child: const Icon(
                      Icons.image_outlined,
                      color: RLTokens.mutedSoft,
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

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StepHead extends StatelessWidget {
  const _StepHead({required this.title, this.desc});
  final String title;
  final String? desc;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontWeight: RLTokens.headingWeight,
            fontSize: 25,
            color: RLTokens.ink,
            letterSpacing: -0.4,
            height: 1.1,
          ),
        ),
        if (desc != null) ...[
          const SizedBox(height: 7),
          Text(
            desc!,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
        ],
      ],
    );
  }
}

class _SubHead extends StatelessWidget {
  const _SubHead({required this.title, this.desc});
  final String title;
  final String? desc;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontWeight: RLTokens.headingWeight,
              fontSize: 18,
              color: RLTokens.ink,
              letterSpacing: -0.2,
            ),
          ),
          if (desc != null) ...[
            const SizedBox(height: 3),
            Text(
              desc!,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.text, this.required = true});
  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
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
        if (required)
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

class _FormField extends StatelessWidget {
  const _FormField({
    required this.label,
    required this.child,
    this.required = true,
    this.error,
  });
  final String label;
  final Widget child;
  final bool required;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _FieldLabel(text: label, required: required),
        const SizedBox(height: 8),
        child,
        if (error != null) ...[const SizedBox(height: 6), _FieldError(error!)],
      ],
    );
  }
}

class _FieldError extends StatelessWidget {
  const _FieldError(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Text(
      message,
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 12,
        color: RLTokens.danger,
      ),
    );
  }
}

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.value,
    required this.placeholder,
    required this.onTap,
  });
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
                ),
                overflow: TextOverflow.ellipsis,
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

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.placeholder,
    this.prefixIcon,
    this.keyboardType,
  });
  final TextEditingController controller;
  final String placeholder;
  final IconData? prefixIcon;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: EdgeInsets.only(left: prefixIcon != null ? 12 : 14, right: 14),
      child: Row(
        children: [
          if (prefixIcon != null) ...[
            Icon(prefixIcon, size: 18, color: RLTokens.mutedSoft),
            const SizedBox(width: 9),
          ],
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
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
          ),
        ],
      ),
    );
  }
}

// ── Phone field ───────────────────────────────────────────────────────────────

class _PhoneField extends StatelessWidget {
  const _PhoneField({required this.controller});
  final TextEditingController controller;

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
          // Country flag + chevron
          Row(
            children: const [
              Text('🇬🇭', style: TextStyle(fontSize: 17)),
              SizedBox(width: 4),
              Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 13,
                color: RLTokens.mutedSoft,
              ),
            ],
          ),
          Container(
            width: 1,
            height: 26,
            color: RLTokens.hairline,
            margin: const EdgeInsets.symmetric(horizontal: 11),
          ),
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
              decoration: const InputDecoration(
                hintText: '24 000 0000',
                hintStyle: TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 15,
                  color: RLTokens.mutedSoft,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Rental row (onboarding method selector) ───────────────────────────────────

class _RentalRow extends StatelessWidget {
  const _RentalRow({
    required this.icon,
    required this.title,
    required this.desc,
    required this.selected,
    required this.onTap,
  });
  final IconData icon;
  final String title, desc;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: selected ? RLTokens.surface : RLTokens.fill,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(
                icon,
                size: 20,
                color: selected ? RLTokens.crimson : RLTokens.inkSoft,
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? RLTokens.crimson : RLTokens.surface,
                border: Border.all(
                  color: selected ? RLTokens.crimson : RLTokens.hairline,
                  width: 1.5,
                ),
              ),
              child: selected
                  ? const Icon(
                      Icons.check_rounded,
                      size: 13,
                      color: Colors.white,
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Toggle button (Student / Worker) ─────────────────────────────────────────

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          color: selected ? RLTokens.crimson : RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: 1.5,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14.5,
              fontWeight: RLTokens.semibold,
              color: selected ? Colors.white : RLTokens.ink,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Review components ─────────────────────────────────────────────────────────

class _RevSection extends StatelessWidget {
  const _RevSection({
    required this.title,
    required this.desc,
    required this.onEdit,
    required this.child,
  });
  final String title, desc;
  final VoidCallback onEdit;
  final Widget child;

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15.5,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      desc,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: onEdit,
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(
                    Icons.edit_outlined,
                    size: 17,
                    color: RLTokens.crimson,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _RevPair extends StatelessWidget {
  const _RevPair({required this.k, required this.v});
  final String k, v;

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
            letterSpacing: 0.5,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          v.isEmpty ? '—' : v,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.ink,
          ),
        ),
      ],
    );
  }
}

class _RevGrid extends StatelessWidget {
  const _RevGrid({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += 2) {
      if (rows.isNotEmpty) rows.add(const SizedBox(height: 14));
      rows.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: children[i]),
            const SizedBox(width: 14),
            Expanded(
              child: i + 1 < children.length
                  ? children[i + 1]
                  : const SizedBox(),
            ),
          ],
        ),
      );
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: rows);
  }
}

// ── Picker sheet ──────────────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label, String? value})
    : value = value ?? label;
  final String label;
  final String value;
}

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
                              fontWeight: RLTokens.headingWeight,
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
                          final isSel = selected == o.value;
                          return GestureDetector(
                            onTap: () => onPick(o.value),
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
                                  Expanded(
                                    child: Text(
                                      o.label,
                                      style: TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 15,
                                        fontWeight: isSel
                                            ? RLTokens.bold
                                            : RLTokens.medium,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                  ),
                                  if (isSel)
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

// ── Invite tenant sheet ───────────────────────────────────────────────────────

class InviteTenantSheet extends ConsumerStatefulWidget {
  const InviteTenantSheet({
    super.key,
    required this.unit,
    required this.onClose,
    required this.onSent,
  });
  final UnitModel unit;
  final VoidCallback onClose;
  final VoidCallback onSent;

  @override
  ConsumerState<InviteTenantSheet> createState() => _InviteTenantSheetState();
}

class _InviteTenantSheetState extends ConsumerState<InviteTenantSheet> {
  static final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  String _tab = 'Phone';
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _copied = false;

  @override
  void initState() {
    super.initState();
    _emailCtrl.addListener(_refresh);
    _phoneCtrl.addListener(_refresh);
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  String? get _phone =>
      _tab == 'Phone' ? normalizePhone(_phoneCtrl.text) : null;
  String? get _email {
    final v = _emailCtrl.text.trim();
    return _tab == 'Email' && _emailPattern.hasMatch(v) ? v : null;
  }

  bool get _valid => _phone != null || _email != null;

  String? get _clientUserId => ref.read(currentWorkspaceNotifierProvider)?.id;

  String? get _link {
    final id = _clientUserId;
    if (id == null) return null;
    return tenantApplyUrl(unitId: widget.unit.id, referredBy: id).toString();
  }

  Future<void> _copy() async {
    final link = _link;
    if (link == null) return;
    await Haptics.vibrate(HapticsType.medium);
    await Clipboard.setData(ClipboardData(text: link));
    if (!mounted) return;
    setState(() => _copied = true);
    showRLToast(ref, tone: RLToastTone.success, title: 'Link copied');
  }

  Future<void> _share() async {
    final link = _link;
    if (link == null) return;
    await Haptics.vibrate(HapticsType.selection);
    await Share.share(
      'Please complete your tenant setup for ${widget.unit.name}: $link',
    );
  }

  Future<void> _send() async {
    final propertyId = widget.unit.propertyId ?? widget.unit.property?.id;
    if (!_valid || propertyId == null) return;
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(inviteTenantNotifierProvider.notifier);
    await notifier.submit(
      propertyId: propertyId,
      unitId: widget.unit.id,
      email: _email,
      phone: _phone,
    );
    if (!mounted) return;
    if (ref.read(inviteTenantNotifierProvider).status == ApiStatus.success) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Link sent');
      widget.onSent();
    }
  }

  @override
  Widget build(BuildContext context) {
    final invite = ref.watch(inviteTenantNotifierProvider);
    final sending = invite.status == ApiStatus.pending;
    final url = _link ?? '';

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
                  top: Radius.circular(RLTokens.rXl),
                ),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.92,
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            'Send ${widget.unit.name} setup link to the tenant',
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontWeight: RLTokens.headingWeight,
                              fontSize: 21,
                              color: RLTokens.ink,
                              letterSpacing: -0.3,
                              height: 1.15,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        RLIconBtn(
                          icon: Icons.close,
                          bg: RLTokens.fill,
                          iconColor: RLTokens.inkSoft,
                          onTap: widget.onClose,
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 30),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'We will message your tenant a link to set up their tenancy, or you can copy and share the link yourself.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 13,
                              color: RLTokens.muted,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 16),
                          RLSegmented(
                            value: _tab,
                            onChanged: (v) {
                              Haptics.vibrate(HapticsType.selection);
                              setState(() => _tab = v);
                            },
                            items: const [
                              RLSegmentItem(key: 'Phone', label: 'Phone'),
                              RLSegmentItem(key: 'Email', label: 'Email'),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (_tab == 'Email') ...[
                            const _FieldLabel(text: 'Email', required: false),
                            const SizedBox(height: 8),
                            _InputField(
                              controller: _emailCtrl,
                              placeholder: 'Enter email address',
                              prefixIcon: Icons.mail_outline_rounded,
                              keyboardType: TextInputType.emailAddress,
                            ),
                          ] else ...[
                            const _FieldLabel(text: 'Phone', required: false),
                            const SizedBox(height: 8),
                            _PhoneField(controller: _phoneCtrl),
                          ],
                          const SizedBox(height: 22),
                          const Text(
                            'Anyone with the link can open this tenant setup.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: RLTokens.fill,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'SETUP LINK',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 9.5,
                                    letterSpacing: 0.8,
                                    color: RLTokens.mutedSoft,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  url,
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 12.5,
                                    color: RLTokens.ink,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: RLBtn(
                                        label: _copied
                                            ? 'Copied!'
                                            : 'Copy link',
                                        kind: RLBtnKind.light,
                                        full: true,
                                        large: false,
                                        icon: _copied
                                            ? Icons.check_rounded
                                            : Icons.copy_outlined,
                                        onPressed: _copy,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: RLBtn(
                                        label: 'Share',
                                        kind: RLBtnKind.light,
                                        full: true,
                                        large: false,
                                        icon: Icons.ios_share_rounded,
                                        onPressed: _share,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          if (invite.status == ApiStatus.failed) ...[
                            RLInlineBanner(
                              title:
                                  invite.errorMessage ??
                                  'Could not send the link',
                            ),
                            const SizedBox(height: 12),
                          ],
                          Row(
                            children: [
                              RLBtn(
                                label: 'Cancel',
                                kind: RLBtnKind.light,
                                large: false,
                                onPressed: () async {
                                  await Haptics.vibrate(HapticsType.selection);
                                  widget.onClose();
                                },
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RLBtn(
                                  label: sending ? 'Sending...' : 'Send link',
                                  kind: RLBtnKind.primary,
                                  full: true,
                                  large: false,
                                  icon: Icons.arrow_forward_rounded,
                                  onPressed: _valid && !sending ? _send : null,
                                ),
                              ),
                            ],
                          ),
                        ],
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
