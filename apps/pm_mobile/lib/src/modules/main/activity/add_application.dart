import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Constants ─────────────────────────────────────────────────────────────────

const _kStepLabels = ['Unit', 'Basic info', 'Identity', 'Background', 'Review'];

const _kUnits = ['003 · Available', '005 · Available', '012 · Available', '1C · Available'];
const _kGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const _kMarital = ['Single', 'Married', 'Divorced', 'Widowed'];
const _kIdTypes = ['National ID', "Driver's License", 'Passport', 'Voter ID'];

// ── Screen ────────────────────────────────────────────────────────────────────

class AddApplicationScreen extends StatefulWidget {
  const AddApplicationScreen({super.key});

  @override
  State<AddApplicationScreen> createState() => _AddApplicationScreenState();
}

class _AddApplicationScreenState extends State<AddApplicationScreen> {
  int _step = 1;
  String? _picker;
  bool _showInvite = false;

  // form state
  String _unit = '';
  String _method = 'Admin onboarding';
  final _firstCtrl    = TextEditingController();
  final _otherCtrl    = TextEditingController();
  final _lastCtrl     = TextEditingController();
  String _gender      = '';
  final _emailCtrl    = TextEditingController();
  final _phoneCtrl    = TextEditingController();
  String _dob         = '';
  String _marital     = '';
  final _addressCtrl  = TextEditingController();
  final _natCtrl      = TextEditingController();
  String _idType      = '';
  final _idNumCtrl    = TextEditingController();
  final _ecNameCtrl   = TextEditingController();
  final _ecRelCtrl    = TextEditingController();
  final _ecPhoneCtrl  = TextEditingController();
  String _employment  = 'Student';
  final _schoolCtrl   = TextEditingController();
  final _schoolAddrCtrl = TextEditingController();

  @override
  void dispose() {
    for (final c in [
      _firstCtrl, _otherCtrl, _lastCtrl, _emailCtrl, _phoneCtrl,
      _addressCtrl, _natCtrl, _idNumCtrl, _ecNameCtrl, _ecRelCtrl,
      _ecPhoneCtrl, _schoolCtrl, _schoolAddrCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'unit':    _unit = value;
        case 'gender':  _gender = value;
        case 'marital': _marital = value;
        case 'dob':     _dob = value;
        case 'idType':  _idType = value;
      }
      _picker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  void _next() async {
    await Haptics.vibrate(HapticsType.selection);
    if (_step == 1 && _method == 'Self onboarding') {
      setState(() => _showInvite = true);
      return;
    }
    setState(() => _step = (_step + 1).clamp(1, 5));
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
                  child: _buildStep(),
                ),
              ),
            ],
          ),

          // ── Sticky footer ──────────────────────────────────────────────
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: _Footer(
              step: _step,
              onCancel: _cancel,
              onBack: _prev,
              onNext: _next,
            ),
          ),

          // ── Pickers ────────────────────────────────────────────────────
          if (_picker == 'unit')
            _PickerSheet(title: 'Select unit', options: _kUnits.map((l) => _PickerOption(label: l)).toList(), selected: _unit, onPick: (v) => _pick('unit', v), onClose: () => setState(() => _picker = null)),
          if (_picker == 'gender')
            _PickerSheet(title: 'Gender', options: _kGenders.map((l) => _PickerOption(label: l)).toList(), selected: _gender, onPick: (v) => _pick('gender', v), onClose: () => setState(() => _picker = null)),
          if (_picker == 'marital')
            _PickerSheet(title: 'Marital status', options: _kMarital.map((l) => _PickerOption(label: l)).toList(), selected: _marital, onPick: (v) => _pick('marital', v), onClose: () => setState(() => _picker = null)),
          if (_picker == 'dob')
            _PickerSheet(title: 'Date of birth', options: ['1990', '1992', '1995', '1998', '2000'].map((l) => _PickerOption(label: l)).toList(), selected: _dob, onPick: (v) => _pick('dob', v), onClose: () => setState(() => _picker = null)),
          if (_picker == 'idType')
            _PickerSheet(title: 'ID type', options: _kIdTypes.map((l) => _PickerOption(label: l)).toList(), selected: _idType, onPick: (v) => _pick('idType', v), onClose: () => setState(() => _picker = null)),

          // ── Invite sheet ───────────────────────────────────────────────
          if (_showInvite)
            _InviteSheet(unit: _unit, onClose: () => setState(() => _showInvite = false)),
        ],
      ),
    );
  }

  Widget _buildStep() {
    return switch (_step) {
      1 => _Step1(
        unit: _unit, method: _method,
        onOpenUnitPicker: () => setState(() { _picker = 'unit'; Haptics.vibrate(HapticsType.selection); }),
        onMethodChanged: (v) => setState(() => _method = v),
      ),
      2 => _Step2(
        firstCtrl: _firstCtrl, otherCtrl: _otherCtrl, lastCtrl: _lastCtrl,
        gender: _gender, emailCtrl: _emailCtrl, phoneCtrl: _phoneCtrl,
        dob: _dob, marital: _marital, addressCtrl: _addressCtrl,
        onOpenGenderPicker:  () => setState(() { _picker = 'gender';  Haptics.vibrate(HapticsType.selection); }),
        onOpenDobPicker:     () => setState(() { _picker = 'dob';     Haptics.vibrate(HapticsType.selection); }),
        onOpenMaritalPicker: () => setState(() { _picker = 'marital'; Haptics.vibrate(HapticsType.selection); }),
      ),
      3 => _Step3(
        natCtrl: _natCtrl, idType: _idType, idNumCtrl: _idNumCtrl,
        onOpenIdTypePicker: () => setState(() { _picker = 'idType'; Haptics.vibrate(HapticsType.selection); }),
      ),
      4 => _Step4(
        ecNameCtrl: _ecNameCtrl, ecRelCtrl: _ecRelCtrl, ecPhoneCtrl: _ecPhoneCtrl,
        employment: _employment, schoolCtrl: _schoolCtrl, schoolAddrCtrl: _schoolAddrCtrl,
        onEmploymentChanged: (v) { Haptics.vibrate(HapticsType.selection); setState(() => _employment = v); },
      ),
      _ => _Step5(
        unit: _unit, method: _method,
        first: _firstCtrl.text, last: _lastCtrl.text,
        gender: _gender, marital: _marital,
        email: _emailCtrl.text, phone: _phoneCtrl.text, address: _addressCtrl.text,
        nationality: _natCtrl.text, idType: _idType, idNum: _idNumCtrl.text,
        ecName: _ecNameCtrl.text, ecRel: _ecRelCtrl.text,
        employment: _employment, school: _schoolCtrl.text,
        onEditStep: (s) { Haptics.vibrate(HapticsType.selection); setState(() => _step = s); },
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
                    'New application',
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
  const _Footer({required this.step, required this.onCancel, required this.onBack, required this.onNext});
  final int step;
  final VoidCallback onCancel;
  final VoidCallback onBack;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final String nextLabel = step == 4 ? 'Preview' : step == 5 ? 'Submit application' : 'Next';
    final IconData nextIcon = step == 5 ? Icons.check_rounded : Icons.arrow_forward_rounded;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
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
                child: Text('Cancel', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textAction, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
              ),
            )
          else
            GestureDetector(
              onTap: onBack,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                child: Row(
                  children: const [
                    Icon(Icons.chevron_left, size: 18, color: RLTokens.ink),
                    SizedBox(width: 4),
                    Text('Back', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textAction, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                  ],
                ),
              ),
            ),
          const Spacer(),
          RLBtn(label: nextLabel, kind: RLBtnKind.primary, icon: nextIcon, onPressed: onNext),
        ],
      ),
    );
  }
}

// ── Step 1 — Unit & onboarding ────────────────────────────────────────────────

class _Step1 extends StatelessWidget {
  const _Step1({required this.unit, required this.method, required this.onOpenUnitPicker, required this.onMethodChanged});
  final String unit;
  final String method;
  final VoidCallback onOpenUnitPicker;
  final ValueChanged<String> onMethodChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(title: 'Unit & onboarding', desc: 'Choose the unit and how this tenant will be onboarded.'),
        const SizedBox(height: 22),
        _FormField(label: 'Unit', child: _SelectField(value: unit, placeholder: 'Select unit', onTap: onOpenUnitPicker)),
        const SizedBox(height: 18),
        const _FieldLabel(text: 'Onboarding method', required: true),
        const SizedBox(height: 8),
        _RentalRow(
          icon: Icons.person_outline_rounded,
          title: 'Admin onboarding',
          desc: 'You fill out the application on the tenant\'s behalf.',
          selected: method == 'Admin onboarding',
          onTap: () => onMethodChanged('Admin onboarding'),
        ),
        const SizedBox(height: 10),
        _RentalRow(
          icon: Icons.bolt_rounded,
          title: 'Self onboarding',
          desc: 'Send the tenant a link to complete it themselves.',
          selected: method == 'Self onboarding',
          onTap: () => onMethodChanged('Self onboarding'),
        ),
      ],
    );
  }
}

// ── Step 2 — Basic information ────────────────────────────────────────────────

class _Step2 extends StatelessWidget {
  const _Step2({
    required this.firstCtrl, required this.otherCtrl, required this.lastCtrl,
    required this.gender, required this.emailCtrl, required this.phoneCtrl,
    required this.dob, required this.marital, required this.addressCtrl,
    required this.onOpenGenderPicker, required this.onOpenDobPicker, required this.onOpenMaritalPicker,
  });
  final TextEditingController firstCtrl, otherCtrl, lastCtrl, emailCtrl, phoneCtrl, addressCtrl;
  final String gender, dob, marital;
  final VoidCallback onOpenGenderPicker, onOpenDobPicker, onOpenMaritalPicker;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(title: 'Basic information', desc: 'The applicant\'s personal details.'),
        const SizedBox(height: 22),

        // First + Other name
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _FormField(label: 'First name', child: _InputField(controller: firstCtrl, placeholder: 'First'))),
            const SizedBox(width: 12),
            Expanded(child: _FormField(label: 'Other names', required: false, child: _InputField(controller: otherCtrl, placeholder: 'Middle'))),
          ],
        ),
        const SizedBox(height: 16),

        // Last + Gender
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _FormField(label: 'Last name', child: _InputField(controller: lastCtrl, placeholder: 'Last'))),
            const SizedBox(width: 12),
            Expanded(child: _FormField(label: 'Gender', child: _SelectField(value: gender, placeholder: 'Select', onTap: onOpenGenderPicker))),
          ],
        ),
        const SizedBox(height: 16),

        // Email
        _FormField(label: 'Email', required: false, child: _InputField(controller: emailCtrl, placeholder: 'name@example.com', prefixIcon: Icons.mail_outline_rounded)),
        const SizedBox(height: 6),
        const Text('We\'ll send notifications to this email.', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: RLTokens.mutedSoft)),
        const SizedBox(height: 16),

        // Phone
        _FormField(label: 'Phone', child: _PhoneField(controller: phoneCtrl)),
        const SizedBox(height: 6),
        const Text('We\'ll send notifications to this number.', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: RLTokens.mutedSoft)),
        const SizedBox(height: 16),

        // DOB + Marital
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _FormField(label: 'Date of birth', child: _SelectField(value: dob, placeholder: 'Select date', onTap: onOpenDobPicker))),
            const SizedBox(width: 12),
            Expanded(child: _FormField(label: 'Marital status', child: _SelectField(value: marital, placeholder: 'Select', onTap: onOpenMaritalPicker))),
          ],
        ),
        const SizedBox(height: 16),

        // Address
        _FormField(label: 'Current address', child: _InputField(controller: addressCtrl, placeholder: 'Street, city')),
        const SizedBox(height: 20),

        // Profile picture
        Row(
          children: [
            const Text('Profile picture', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
            const Text('  ·  Optional', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.mutedSoft, fontWeight: RLTokens.medium)),
          ],
        ),
        const SizedBox(height: 10),
        const _ProfilePic(),
      ],
    );
  }
}

// ── Step 3 — Identity verification ───────────────────────────────────────────

class _Step3 extends StatelessWidget {
  const _Step3({required this.natCtrl, required this.idType, required this.idNumCtrl, required this.onOpenIdTypePicker});
  final TextEditingController natCtrl, idNumCtrl;
  final String idType;
  final VoidCallback onOpenIdTypePicker;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(title: 'Identity verification', desc: 'Provide identification details and document images.'),
        const SizedBox(height: 22),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _FormField(label: 'Nationality', child: _InputField(controller: natCtrl, placeholder: 'Country'))),
            const SizedBox(width: 12),
            Expanded(child: _FormField(label: 'ID type', child: _SelectField(value: idType, placeholder: 'Select', onTap: onOpenIdTypePicker))),
          ],
        ),
        const SizedBox(height: 16),
        _FormField(label: 'ID number', child: _InputField(controller: idNumCtrl, placeholder: 'ID number')),
        const SizedBox(height: 24),
        const _SubHead(title: 'ID document images', desc: 'Upload clear photos of both sides of the ID.'),
        const _UploadTile(label: 'Front of ID', optional: true),
        const SizedBox(height: 12),
        const _UploadTile(label: 'Back of ID', optional: true),
      ],
    );
  }
}

// ── Step 4 — Emergency contact & background ───────────────────────────────────

class _Step4 extends StatelessWidget {
  const _Step4({
    required this.ecNameCtrl, required this.ecRelCtrl, required this.ecPhoneCtrl,
    required this.employment, required this.schoolCtrl, required this.schoolAddrCtrl,
    required this.onEmploymentChanged,
  });
  final TextEditingController ecNameCtrl, ecRelCtrl, ecPhoneCtrl, schoolCtrl, schoolAddrCtrl;
  final String employment;
  final ValueChanged<String> onEmploymentChanged;

  @override
  Widget build(BuildContext context) {
    final isStudent = employment == 'Student';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(title: 'Emergency contact & background', desc: 'Emergency contact and employment details.'),
        const SizedBox(height: 22),

        // Emergency contact
        const _SubHead(title: 'Emergency contact'),
        _FormField(label: 'Full name', child: _InputField(controller: ecNameCtrl, placeholder: 'Enter full name')),
        const SizedBox(height: 16),
        _FormField(label: 'Relationship', child: _InputField(controller: ecRelCtrl, placeholder: 'e.g. Sibling, Parent, Friend')),
        const SizedBox(height: 16),
        _FormField(label: 'Phone number', child: _PhoneField(controller: ecPhoneCtrl)),

        // Employment divider
        const SizedBox(height: 26),
        Container(height: 1, color: RLTokens.hairlineSoft),
        const SizedBox(height: 22),
        const _SubHead(title: 'Employment type', desc: 'Select the current employment status.'),
        Row(
          children: [
            Expanded(child: _ToggleButton(label: 'Student', selected: isStudent, onTap: () => onEmploymentChanged('Student'))),
            const SizedBox(width: 8),
            Expanded(child: _ToggleButton(label: 'Worker', selected: !isStudent, onTap: () => onEmploymentChanged('Worker'))),
          ],
        ),
        const SizedBox(height: 18),
        _SubHead(title: isStudent ? 'Student information' : 'Worker information'),
        _FormField(
          label: isStudent ? 'Institution / school' : 'Employer',
          required: false,
          child: _InputField(controller: schoolCtrl, placeholder: isStudent ? 'e.g. Institution / school' : 'e.g. Company name'),
        ),
        const SizedBox(height: 16),
        _FormField(label: 'Address', required: false, child: _InputField(controller: schoolAddrCtrl, placeholder: 'e.g. 123 Business St, City, Country')),

        // Proof divider
        const SizedBox(height: 26),
        Container(height: 1, color: RLTokens.hairlineSoft),
        const SizedBox(height: 22),
        _SubHead(
          title: isStudent ? 'Proof of admission' : 'Proof of employment',
          desc: 'Upload a document (acceptance letter, enrollment / employment verification, etc.).',
        ),
        _UploadTile(label: isStudent ? 'Proof of admission' : 'Proof of employment', kind: _UploadKind.doc, optional: true),
      ],
    );
  }
}

// ── Step 5 — Review ───────────────────────────────────────────────────────────

class _Step5 extends StatelessWidget {
  const _Step5({
    required this.unit, required this.method,
    required this.first, required this.last, required this.gender, required this.marital,
    required this.email, required this.phone, required this.address,
    required this.nationality, required this.idType, required this.idNum,
    required this.ecName, required this.ecRel,
    required this.employment, required this.school,
    required this.onEditStep,
  });
  final String unit, method, first, last, gender, marital, email, phone, address;
  final String nationality, idType, idNum, ecName, ecRel, employment, school;
  final ValueChanged<int> onEditStep;

  @override
  Widget build(BuildContext context) {
    final unitName = unit.isNotEmpty ? unit.split(' · ').first : '—';
    final unitStatus = unit.contains(' · ') ? unit.split(' · ').last : 'Available';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepHead(title: 'Review application', desc: 'Review everything below. Tap edit to change a section before submitting.'),
        const SizedBox(height: 20),

        _RevSection(title: 'Unit & onboarding', desc: 'Selected unit and method', onEdit: () => onEditStep(1),
          child: _RevGrid(children: [
            _RevPair(k: 'Unit', v: '$unitName ($unitStatus)'),
            _RevPair(k: 'Onboarding', v: method),
          ]),
        ),
        const SizedBox(height: 12),

        _RevSection(title: 'Basic information', desc: 'Personal details', onEdit: () => onEditStep(2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _RevGrid(children: [
                _RevPair(k: 'First name', v: first),
                _RevPair(k: 'Last name', v: last),
                _RevPair(k: 'Gender', v: gender),
                _RevPair(k: 'Marital status', v: marital),
                _RevPair(k: 'Email', v: email),
                _RevPair(k: 'Phone', v: phone),
              ]),
              if (address.isNotEmpty) ...[
                const SizedBox(height: 14),
                _RevPair(k: 'Address', v: address),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        _RevSection(title: 'Identity verification', desc: 'Identification details', onEdit: () => onEditStep(3),
          child: _RevGrid(children: [
            _RevPair(k: 'Nationality', v: nationality),
            _RevPair(k: 'ID type', v: idType),
            _RevPair(k: 'ID number', v: idNum),
          ]),
        ),
        const SizedBox(height: 12),

        _RevSection(title: 'Emergency & background', desc: 'Contact and employment', onEdit: () => onEditStep(4),
          child: _RevGrid(children: [
            _RevPair(k: 'Emergency name', v: ecName),
            _RevPair(k: 'Relationship', v: ecRel),
            _RevPair(k: 'Employment', v: employment),
            _RevPair(k: employment == 'Student' ? 'School' : 'Employer', v: school),
          ]),
        ),
      ],
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
        Text(title, style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 25, color: RLTokens.ink, letterSpacing: -0.4, height: 1.1)),
        if (desc != null) ...[
          const SizedBox(height: 7),
          Text(desc!, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted, height: 1.5)),
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
          Text(title, style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 18, color: RLTokens.ink, letterSpacing: -0.2)),
          if (desc != null) ...[
            const SizedBox(height: 3),
            Text(desc!, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted, height: 1.4)),
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
        Text(text, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
        if (required)
          const Text(' *', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.bold, color: RLTokens.crimson)),
      ],
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.child, this.required = true});
  final String label;
  final Widget child;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _FieldLabel(text: label, required: required),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

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
        decoration: BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.circular(RLTokens.rMd), border: Border.all(color: RLTokens.hairline, width: 1.5)),
        child: Row(
          children: [
            Expanded(child: Text(value.isEmpty ? placeholder : value, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: value.isEmpty ? RLTokens.mutedSoft : RLTokens.ink), overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 8),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: RLTokens.mutedSoft),
          ],
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({required this.controller, required this.placeholder, this.prefixIcon});
  final TextEditingController controller;
  final String placeholder;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.circular(RLTokens.rMd), border: Border.all(color: RLTokens.hairline, width: 1.5)),
      padding: EdgeInsets.only(left: prefixIcon != null ? 12 : 14, right: 14),
      child: Row(
        children: [
          if (prefixIcon != null) ...[Icon(prefixIcon, size: 18, color: RLTokens.mutedSoft), const SizedBox(width: 9)],
          Expanded(
            child: TextField(
              controller: controller,
              style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, color: RLTokens.ink),
              decoration: InputDecoration(hintText: placeholder, hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, color: RLTokens.mutedSoft), border: InputBorder.none, isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 14)),
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
      decoration: BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.circular(RLTokens.rMd), border: Border.all(color: RLTokens.hairline, width: 1.5)),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          // Country flag + chevron
          Row(
            children: const [
              Text('🇬🇭', style: TextStyle(fontSize: 17)),
              SizedBox(width: 4),
              Icon(Icons.keyboard_arrow_down_rounded, size: 13, color: RLTokens.mutedSoft),
            ],
          ),
          Container(width: 1, height: 26, color: RLTokens.hairline, margin: const EdgeInsets.symmetric(horizontal: 11)),
          const Text('+233', style: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.muted)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.ink, letterSpacing: 0.5),
              decoration: const InputDecoration(hintText: '24 000 0000', hintStyle: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.mutedSoft), border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.symmetric(vertical: 14)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Rental row (onboarding method selector) ───────────────────────────────────

class _RentalRow extends StatelessWidget {
  const _RentalRow({required this.icon, required this.title, required this.desc, required this.selected, required this.onTap});
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
          border: Border.all(color: selected ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: selected ? RLTokens.surface : RLTokens.fill, borderRadius: BorderRadius.circular(11)),
              child: Icon(icon, size: 20, color: selected ? RLTokens.crimson : RLTokens.inkSoft),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                  const SizedBox(height: 2),
                  Text(desc, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted, height: 1.4)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? RLTokens.crimson : RLTokens.surface,
                border: Border.all(color: selected ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
              ),
              child: selected ? const Icon(Icons.check_rounded, size: 13, color: Colors.white) : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Toggle button (Student / Worker) ─────────────────────────────────────────

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({required this.label, required this.selected, required this.onTap});
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
          border: Border.all(color: selected ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
        ),
        child: Center(
          child: Text(label, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: selected ? Colors.white : RLTokens.ink)),
        ),
      ),
    );
  }
}

// ── Upload tile ───────────────────────────────────────────────────────────────

enum _UploadKind { image, doc }

class _UploadTile extends StatelessWidget {
  const _UploadTile({required this.label, this.kind = _UploadKind.image, this.optional = false});
  final String label;
  final _UploadKind kind;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    final thumbSize = kind == _UploadKind.doc ? 64.0 : 84.0;
    final thumbIcon = kind == _UploadKind.doc ? Icons.description_outlined : Icons.camera_alt_outlined;
    final btnLabel = kind == _UploadKind.doc ? 'Choose document' : 'Choose image';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: RLTokens.hairline), borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                width: thumbSize, height: thumbSize,
                decoration: BoxDecoration(color: RLTokens.fill, borderRadius: BorderRadius.circular(RLTokens.rMd), border: Border.all(color: RLTokens.hairlineSoft)),
                child: Icon(thumbIcon, size: 24, color: RLTokens.mutedSoft),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RLBtn(label: btnLabel, kind: RLBtnKind.light, large: false, onPressed: () async => Haptics.vibrate(HapticsType.selection)),
                  if (optional) ...[
                    const SizedBox(height: 8),
                    const Text('Optional', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: RLTokens.mutedSoft)),
                  ],
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Profile pic ───────────────────────────────────────────────────────────────

class _ProfilePic extends StatelessWidget {
  const _ProfilePic();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 92, height: 92,
          decoration: BoxDecoration(shape: BoxShape.circle, color: RLTokens.fill, border: Border.all(color: RLTokens.hairlineSoft)),
          child: const Icon(Icons.camera_alt_outlined, size: 26, color: RLTokens.mutedSoft),
        ),
        const SizedBox(width: 16),
        RLBtn(label: 'Choose image', kind: RLBtnKind.light, large: false, onPressed: () async => Haptics.vibrate(HapticsType.selection)),
      ],
    );
  }
}

// ── Review components ─────────────────────────────────────────────────────────

class _RevSection extends StatelessWidget {
  const _RevSection({required this.title, required this.desc, required this.onEdit, required this.child});
  final String title, desc;
  final VoidCallback onEdit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.circular(RLTokens.rLg), border: Border.all(color: RLTokens.hairline)),
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
                    Text(title, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15.5, fontWeight: RLTokens.bold, color: RLTokens.ink)),
                    const SizedBox(height: 2),
                    Text(desc, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
                  ],
                ),
              ),
              GestureDetector(
                onTap: onEdit,
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(Icons.edit_outlined, size: 17, color: RLTokens.crimson),
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
        Text(k.toUpperCase(), style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 9.5, letterSpacing: 0.5, color: RLTokens.mutedSoft)),
        const SizedBox(height: 4),
        Text(v.isEmpty ? '—' : v, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, color: RLTokens.ink)),
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
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: children[i]),
          const SizedBox(width: 14),
          Expanded(child: i + 1 < children.length ? children[i + 1] : const SizedBox()),
        ],
      ));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: rows);
  }
}

// ── Picker sheet ──────────────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label});
  final String label;
}

class _PickerSheet extends StatelessWidget {
  const _PickerSheet({required this.title, required this.options, required this.selected, required this.onPick, required this.onClose});
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
              decoration: const BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)), boxShadow: RLTokens.elevSheet),
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(width: 38, height: 5, decoration: BoxDecoration(color: RLTokens.hairline, borderRadius: BorderRadius.circular(5))),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      children: [
                        Expanded(child: Text(title, style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20, color: RLTokens.ink, letterSpacing: -0.3))),
                        RLIconBtn(icon: Icons.close, bg: RLTokens.fill, iconColor: RLTokens.inkSoft, onTap: onClose),
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
                          final isSel = selected == o.label;
                          return GestureDetector(
                            onTap: () => onPick(o.label),
                            behavior: HitTestBehavior.opaque,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 8),
                              decoration: BoxDecoration(border: isLast ? null : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft))),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(o.label, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: isSel ? RLTokens.bold : RLTokens.medium, color: RLTokens.ink)),
                                  ),
                                  if (isSel) const Icon(Icons.check_rounded, size: 18, color: RLTokens.crimson),
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

class _InviteSheet extends StatefulWidget {
  const _InviteSheet({required this.unit, required this.onClose});
  final String unit;
  final VoidCallback onClose;

  @override
  State<_InviteSheet> createState() => _InviteSheetState();
}

class _InviteSheetState extends State<_InviteSheet> {
  String _tab = 'Email';
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _copied = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final unitName = widget.unit.isNotEmpty ? widget.unit.split(' · ').first : '003';
    final unitStatus = widget.unit.contains(' · ') ? widget.unit.split(' · ').last : 'Available';
    final url = 'https://rentloopapp.com/tenants/apply?unit=${unitName.toLowerCase()}';

    return GestureDetector(
      onTap: widget.onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              decoration: const BoxDecoration(color: RLTokens.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)), boxShadow: RLTokens.elevSheet),
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.92),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(width: 38, height: 5, decoration: BoxDecoration(color: RLTokens.hairline, borderRadius: BorderRadius.circular(5))),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 21, color: RLTokens.ink, letterSpacing: -0.3, height: 1.15),
                              children: [
                                TextSpan(text: 'Invite tenant to $unitName '),
                                TextSpan(text: '($unitStatus)', style: const TextStyle(color: RLTokens.muted)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        RLIconBtn(icon: Icons.close, bg: RLTokens.fill, iconColor: RLTokens.inkSoft, onTap: widget.onClose),
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
                            'Invite your tenant to complete their application via email, phone number, or by sharing the application link below.',
                            style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, color: RLTokens.muted, height: 1.5),
                          ),
                          const SizedBox(height: 16),
                          RLSegmented(
                            value: _tab,
                            onChanged: (v) { Haptics.vibrate(HapticsType.selection); setState(() => _tab = v); },
                            items: const [
                              RLSegmentItem(key: 'Email', label: 'Email'),
                              RLSegmentItem(key: 'Phone', label: 'Phone'),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (_tab == 'Email') ...[
                            const _FieldLabel(text: 'Email', required: false),
                            const SizedBox(height: 8),
                            _InputField(controller: _emailCtrl, placeholder: 'Enter email address', prefixIcon: Icons.mail_outline_rounded),
                          ] else ...[
                            const _FieldLabel(text: 'Phone', required: false),
                            const SizedBox(height: 8),
                            _PhoneField(controller: _phoneCtrl),
                          ],
                          const SizedBox(height: 22),
                          const Text('Anyone with the link can access this application.', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: RLTokens.fill, borderRadius: BorderRadius.circular(14)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('APPLICATION LINK', style: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 9.5, letterSpacing: 0.8, color: RLTokens.mutedSoft)),
                                const SizedBox(height: 8),
                                Text(url, style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 12.5, color: RLTokens.ink, height: 1.5)),
                                const SizedBox(height: 12),
                                RLBtn(
                                  label: _copied ? 'Copied!' : 'Copy link',
                                  kind: RLBtnKind.light,
                                  full: true,
                                  large: false,
                                  icon: _copied ? Icons.check_rounded : Icons.copy_outlined,
                                  onPressed: () async {
                                    await Haptics.vibrate(HapticsType.medium);
                                    setState(() => _copied = true);
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              RLBtn(label: 'Cancel', kind: RLBtnKind.light, large: false, onPressed: () async { await Haptics.vibrate(HapticsType.selection); widget.onClose(); }),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RLBtn(label: 'Invite tenant', kind: RLBtnKind.primary, full: true, large: false, icon: Icons.arrow_forward_rounded, onPressed: () async => Haptics.vibrate(HapticsType.medium)),
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
