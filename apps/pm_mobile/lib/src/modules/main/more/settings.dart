import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Screen ────────────────────────────────────────────────────────────────────

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _acctType = 'Company';
  String? _sheet;

  bool get _isCompany => _acctType == 'Company';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          // ── Scrollable body ──────────────────────────────────────────────
          Column(
            children: [
              RLBackHeader(
                title: 'General settings',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'General settings',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 25,
                          color: RLTokens.ink,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'Update and manage your essential information.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Column(
                        children: [
                          // Profile
                          _OCard(
                            title: 'Profile',
                            desc: 'Your account name and ownership type.',
                            onEdit: () {
                              Haptics.vibrate(HapticsType.selection);
                              setState(() => _sheet = 'profile');
                            },
                            child: _ProfileContent(
                              isCompany: _isCompany,
                              onSwitch: () {
                                Haptics.vibrate(HapticsType.selection);
                                setState(() => _sheet = _isCompany
                                    ? 'switchIndividual'
                                    : 'switchCompany');
                              },
                            ),
                          ),
                          // Company details (company only)
                          if (_isCompany) ...[
                            const SizedBox(height: 12),
                            _OCard(
                              title: 'Company details',
                              desc: 'Information about your company.',
                              onEdit: () {
                                Haptics.vibrate(HapticsType.selection);
                                setState(() => _sheet = 'company');
                              },
                              child: const _CompanyDetailsContent(),
                            ),
                          ],
                          // Identity (individual only)
                          if (!_isCompany) ...[
                            const SizedBox(height: 12),
                            _OCard(
                              title: 'Identity',
                              desc: 'Your government-issued identification.',
                              onEdit: () {
                                Haptics.vibrate(HapticsType.selection);
                                setState(() => _sheet = 'identity');
                              },
                              child: const _IdentityContent(),
                            ),
                          ],
                          const SizedBox(height: 12),
                          // Business location
                          _OCard(
                            title: 'Business location',
                            desc: 'Your official physical address.',
                            onEdit: () {
                              Haptics.vibrate(HapticsType.selection);
                              setState(() => _sheet = 'location');
                            },
                            child: const _LocationContent(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Sheet overlays ───────────────────────────────────────────────
          if (_sheet == 'profile')
            _EditProfileSheet(
              isCompany: _isCompany,
              onClose: () => setState(() => _sheet = null),
            ),
          if (_sheet == 'company')
            _EditCompanySheet(
              onClose: () => setState(() => _sheet = null),
            ),
          if (_sheet == 'identity')
            _EditIdentitySheet(
              onClose: () => setState(() => _sheet = null),
            ),
          if (_sheet == 'location')
            _EditLocationSheet(
              onClose: () => setState(() => _sheet = null),
            ),
          if (_sheet == 'switchIndividual')
            _SwitchAcctDialog(
              to: 'Individual',
              onConfirm: () =>
                  setState(() { _acctType = 'Individual'; _sheet = null; }),
              onClose: () => setState(() => _sheet = null),
            ),
          if (_sheet == 'switchCompany')
            _SwitchAcctDialog(
              to: 'Company',
              onConfirm: () =>
                  setState(() { _acctType = 'Company'; _sheet = null; }),
              onClose: () => setState(() => _sheet = null),
            ),
        ],
      ),
    );
  }
}

// ── OCard — titled section card with Edit link ────────────────────────────────

class _OCard extends StatelessWidget {
  const _OCard({
    required this.title,
    this.desc,
    this.onEdit,
    required this.child,
  });
  final String title;
  final String? desc;
  final VoidCallback? onEdit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
            ),
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
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14,
                          fontWeight: RLTokens.bold,
                          color: RLTokens.ink,
                        ),
                      ),
                      if (desc != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          desc!,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (onEdit != null) ...[
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: onEdit,
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
              ],
            ),
          ),
          Padding(padding: const EdgeInsets.all(16), child: child),
        ],
      ),
    );
  }
}

// ── OField — read-only labelled value ─────────────────────────────────────────

class _OField extends StatelessWidget {
  const _OField({required this.label, required this.value});
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12,
            fontWeight: RLTokens.medium,
            color: RLTokens.muted,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value ?? '—',
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.ink,
            height: 1.45,
          ),
        ),
      ],
    );
  }
}

// ── OGrid — 2-column read-only grid ──────────────────────────────────────────

class _OGrid extends StatelessWidget {
  const _OGrid({required this.children});
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
          const SizedBox(width: 16),
          Expanded(
            child: i + 1 < children.length
                ? children[i + 1]
                : const SizedBox(),
          ),
        ],
      ));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: rows,
    );
  }
}

// ── Card content ──────────────────────────────────────────────────────────────

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.isCompany,
    required this.onSwitch,
  });
  final bool isCompany;
  final VoidCallback onSwitch;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OField(
          label: 'Name',
          value: isCompany ? 'Rentloop Test Company' : 'Benjamin Domey',
        ),
        const SizedBox(height: 14),
        const Text(
          'Type',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12.5,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
              decoration: BoxDecoration(
                border: Border.all(color: RLTokens.hairline),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isCompany
                        ? Icons.business_outlined
                        : Icons.person_outline_rounded,
                    size: 14,
                    color: RLTokens.ink,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isCompany ? 'Company' : 'Individual',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ],
              ),
            ),
            if (isCompany)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Property Manager',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.inkSoft,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: onSwitch,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
            decoration: BoxDecoration(
              color: RLTokens.surface,
              border: Border.all(color: RLTokens.hairline),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_horiz_rounded,
                    size: 16, color: RLTokens.ink),
                const SizedBox(width: 8),
                Text(
                  'Switch to ${isCompany ? 'Individual' : 'Company'}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
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

class _CompanyDetailsContent extends StatelessWidget {
  const _CompanyDetailsContent();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OGrid(children: const [
          _OField(label: 'Description', value: null),
          _OField(label: 'Registration no.', value: null),
          _OField(label: 'Support email', value: 'domeyope@rentloopapp.com'),
          _OField(label: 'Support phone', value: '+233 20 123 4567'),
        ]),
        const SizedBox(height: 14),
        const _OField(label: 'Website', value: null),
      ],
    );
  }
}

class _IdentityContent extends StatelessWidget {
  const _IdentityContent();

  @override
  Widget build(BuildContext context) {
    return _OGrid(children: const [
      _OField(label: 'ID type', value: 'National ID'),
      _OField(label: 'ID number', value: 'kjiyb'),
      _OField(label: 'Expiry date', value: '09/04/2026'),
    ]);
  }
}

class _LocationContent extends StatelessWidget {
  const _LocationContent();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _OField(
          label: 'Address',
          value:
              'Adenta new site Presbyterian church, Liberty Road, Adenta Municipality',
        ),
        const SizedBox(height: 14),
        _OGrid(children: const [
          _OField(label: 'Country', value: 'Ghana'),
          _OField(label: 'Region', value: 'Greater Accra Region'),
          _OField(label: 'City', value: 'Adenta Municipality'),
        ]),
      ],
    );
  }
}

// ── Sheet base widget ─────────────────────────────────────────────────────────

class _OSheet extends StatelessWidget {
  const _OSheet({
    required this.title,
    this.desc,
    required this.onClose,
    required this.body,
    required this.onSave,
  });
  final String title;
  final String? desc;
  final VoidCallback onClose;
  final Widget body;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(0, 0, 0, 0.35),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
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
                                const SizedBox(height: 4),
                                Text(
                                  desc!,
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 13,
                                    color: RLTokens.muted,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        GestureDetector(
                          onTap: onClose,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: RLTokens.fill,
                              borderRadius:
                                  BorderRadius.circular(RLTokens.rPill),
                            ),
                            child: const Icon(Icons.close_rounded,
                                size: 16, color: RLTokens.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.55,
                    ),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
                      child: body,
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottomPad),
                    decoration: const BoxDecoration(
                      border: Border(
                          top: BorderSide(color: RLTokens.hairlineSoft)),
                    ),
                    child: RLBtn(
                      label: 'Save changes',
                      icon: Icons.check_rounded,
                      full: true,
                      onPressed: onSave,
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

// ── Edit profile sheet ────────────────────────────────────────────────────────

class _EditProfileSheet extends StatefulWidget {
  const _EditProfileSheet({
    required this.isCompany,
    required this.onClose,
  });
  final bool isCompany;
  final VoidCallback onClose;

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  late final TextEditingController _nameCtrl;
  String _sub = 'Property Manager';

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(
      text: widget.isCompany ? 'Rentloop Test Company' : 'Benjamin Domey',
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _OSheet(
      title: 'Edit profile',
      desc: 'Update your name and account type.',
      onClose: widget.onClose,
      onSave: () async {
        await Haptics.vibrate(HapticsType.medium);
        widget.onClose();
      },
      body: Column(
        children: [
          _FormLabel(
            label: widget.isCompany ? 'Company name' : 'Full name',
          ),
          const SizedBox(height: 6),
          _InputField(
            controller: _nameCtrl,
            placeholder:
                widget.isCompany ? 'Company name' : 'Full name',
          ),
          if (widget.isCompany) ...[
            const SizedBox(height: 16),
            const _FormLabel(label: 'Sub type'),
            const SizedBox(height: 8),
            Row(
              children:
                  ['Property Manager', 'Developer', 'Agency']
                      .asMap()
                      .entries
                      .map((e) {
                final s = e.value;
                final on = s == _sub;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                        right: e.key < 2 ? 8 : 0),
                    child: GestureDetector(
                      onTap: () {
                        Haptics.vibrate(HapticsType.selection);
                        setState(() => _sub = s);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding:
                            const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: on
                              ? RLTokens.crimson
                              : RLTokens.surface,
                          border: Border.all(
                            color: on
                                ? RLTokens.crimson
                                : RLTokens.hairline,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: Text(
                          s,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            fontWeight: RLTokens.semibold,
                            color: on ? Colors.white : RLTokens.ink,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ── Edit company details sheet ────────────────────────────────────────────────

class _EditCompanySheet extends StatefulWidget {
  const _EditCompanySheet({required this.onClose});
  final VoidCallback onClose;

  @override
  State<_EditCompanySheet> createState() => _EditCompanySheetState();
}

class _EditCompanySheetState extends State<_EditCompanySheet> {
  final _descCtrl = TextEditingController();
  final _regCtrl = TextEditingController();
  final _emailCtrl =
      TextEditingController(text: 'domeyope@rentloopapp.com');
  final _phoneCtrl = TextEditingController(text: '20 123 4567');
  final _webCtrl = TextEditingController();

  @override
  void dispose() {
    _descCtrl.dispose();
    _regCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _webCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _OSheet(
      title: 'Edit company details',
      onClose: widget.onClose,
      onSave: () async {
        await Haptics.vibrate(HapticsType.medium);
        widget.onClose();
      },
      body: Column(
        children: [
          _FormLabel(label: 'Description', optional: true),
          const SizedBox(height: 6),
          _TextAreaField(
            controller: _descCtrl,
            placeholder: 'What does your company do?',
          ),
          const SizedBox(height: 16),
          _FormLabel(label: 'Registration number', optional: true),
          const SizedBox(height: 6),
          _InputField(
              controller: _regCtrl, placeholder: 'e.g. CS-1234567'),
          const SizedBox(height: 16),
          const _FormLabel(label: 'Support email'),
          const SizedBox(height: 6),
          _InputField(
            controller: _emailCtrl,
            placeholder: 'email@example.com',
            leadingIcon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          const _FormLabel(label: 'Support phone'),
          const SizedBox(height: 6),
          _PhoneField(
            controller: _phoneCtrl,
            placeholder: '20 000 0000',
          ),
          const SizedBox(height: 16),
          _FormLabel(label: 'Website', optional: true),
          const SizedBox(height: 6),
          _InputField(
            controller: _webCtrl,
            placeholder: 'https://',
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ── Edit identity sheet ───────────────────────────────────────────────────────

class _EditIdentitySheet extends StatefulWidget {
  const _EditIdentitySheet({required this.onClose});
  final VoidCallback onClose;

  @override
  State<_EditIdentitySheet> createState() => _EditIdentitySheetState();
}

class _EditIdentitySheetState extends State<_EditIdentitySheet> {
  String _idType = 'National ID';
  final _numCtrl = TextEditingController(text: 'kjiyb');
  String _expiry = '09/04/2026';
  bool _pickerOpen = false;

  @override
  void dispose() {
    _numCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _OSheet(
          title: 'Edit identity',
          desc: 'Update your identity document details.',
          onClose: widget.onClose,
          onSave: () async {
            await Haptics.vibrate(HapticsType.medium);
            widget.onClose();
          },
          body: Column(
            children: [
              const _FormLabel(label: 'ID type'),
              const SizedBox(height: 8),
              Row(
                children: ['National ID', 'Passport', "Driver's License"]
                    .asMap()
                    .entries
                    .map((e) {
                  final t = e.value;
                  final on = t == _idType;
                  return Expanded(
                    child: Padding(
                      padding:
                          EdgeInsets.only(right: e.key < 2 ? 8 : 0),
                      child: GestureDetector(
                        onTap: () {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _idType = t);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding:
                              const EdgeInsets.symmetric(vertical: 11),
                          decoration: BoxDecoration(
                            color: on
                                ? RLTokens.crimson
                                : RLTokens.surface,
                            border: Border.all(
                              color: on
                                  ? RLTokens.crimson
                                  : RLTokens.hairline,
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(11),
                          ),
                          child: Text(
                            t,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12,
                              fontWeight: RLTokens.semibold,
                              color: on ? Colors.white : RLTokens.ink,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const _FormLabel(label: 'ID number'),
              const SizedBox(height: 6),
              _InputField(controller: _numCtrl, placeholder: 'ID number'),
              const SizedBox(height: 16),
              const _FormLabel(label: 'ID expiry'),
              const SizedBox(height: 6),
              _SelectField(
                value: _expiry,
                placeholder: 'Select date',
                onTap: () {
                  Haptics.vibrate(HapticsType.selection);
                  setState(() => _pickerOpen = true);
                },
              ),
              const SizedBox(height: 16),
              _FormLabel(label: 'ID document', optional: true),
              const SizedBox(height: 6),
              const _UploadTile(label: 'Document image'),
              const SizedBox(height: 8),
            ],
          ),
        ),
        if (_pickerOpen)
          _PickerSheet(
            title: 'ID expiry',
            options: const [
              _PickerOption(label: '09/04/2026'),
              _PickerOption(label: '12/31/2027'),
              _PickerOption(label: '06/15/2028'),
              _PickerOption(label: '03/22/2030'),
            ],
            selected: _expiry,
            onPick: (v) => setState(() {
              _expiry = v;
              _pickerOpen = false;
            }),
            onClose: () => setState(() => _pickerOpen = false),
          ),
      ],
    );
  }
}

// ── Edit location sheet ───────────────────────────────────────────────────────

class _EditLocationSheet extends StatefulWidget {
  const _EditLocationSheet({required this.onClose});
  final VoidCallback onClose;

  @override
  State<_EditLocationSheet> createState() => _EditLocationSheetState();
}

class _EditLocationSheetState extends State<_EditLocationSheet> {
  final _addrCtrl = TextEditingController(
    text:
        'Adenta new site Presbyterian church, Liberty Road, Adenta Municipality',
  );

  @override
  void dispose() {
    _addrCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _OSheet(
      title: 'Edit location',
      desc: 'Search and select your address to update location details.',
      onClose: widget.onClose,
      onSave: () async {
        await Haptics.vibrate(HapticsType.medium);
        widget.onClose();
      },
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _FormLabel(label: 'Address'),
          const SizedBox(height: 6),
          _InputField(
            controller: _addrCtrl,
            placeholder: 'Search address...',
            leadingIcon: Icons.search_rounded,
          ),
          const SizedBox(height: 8),
          const Text(
            'Country, region and city update automatically.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ── Switch account type dialog ────────────────────────────────────────────────

class _SwitchAcctDialog extends StatelessWidget {
  const _SwitchAcctDialog({
    required this.to,
    required this.onConfirm,
    required this.onClose,
  });
  final String to;
  final VoidCallback onConfirm;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(0, 0, 0, 0.4),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: GestureDetector(
          onTap: () {},
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        size: 22, color: RLTokens.crimson),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Switch to $to?',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 21,
                          color: RLTokens.ink,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Some information specific to your current account type will be permanently removed. This action cannot be undone.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    color: RLTokens.muted,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    RLBtn(
                      label: 'Cancel',
                      kind: RLBtnKind.ghost,
                      onPressed: onClose,
                    ),
                    const SizedBox(width: 10),
                    RLBtn(
                      label: 'Continue',
                      kind: RLBtnKind.primary,
                      onPressed: () async {
                        await Haptics.vibrate(HapticsType.medium);
                        onConfirm();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Form field helpers ────────────────────────────────────────────────────────

class _FormLabel extends StatelessWidget {
  const _FormLabel({required this.label, this.optional = false});
  final String label;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    if (optional) {
      return RichText(
        text: TextSpan(children: [
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
        ]),
      );
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
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
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
                  color: value.isEmpty
                      ? RLTokens.mutedSoft
                      : RLTokens.ink,
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

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.placeholder,
    this.keyboardType,
    this.leadingIcon,
  });
  final TextEditingController controller;
  final String placeholder;
  final TextInputType? keyboardType;
  final IconData? leadingIcon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: EdgeInsets.only(
          left: leadingIcon != null ? 10 : 14, right: 14),
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
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({
    required this.controller,
    required this.placeholder,
  });
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

class _PhoneField extends StatelessWidget {
  const _PhoneField({
    required this.controller,
    required this.placeholder,
  });
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
          Row(
            children: const [
              Text('🇬🇭', style: TextStyle(fontSize: 17)),
              SizedBox(width: 6),
              Icon(Icons.keyboard_arrow_down_rounded,
                  size: 13, color: RLTokens.mutedSoft),
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
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 15,
                  color: RLTokens.mutedSoft,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Upload tile ───────────────────────────────────────────────────────────────

class _UploadTile extends StatelessWidget {
  const _UploadTile({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_upload_outlined,
              size: 20, color: RLTokens.muted),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upload $label',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.ink,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Tap to select from device',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  color: RLTokens.muted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Picker option + sheet ─────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({required this.label});
  final String label;
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
                    top: Radius.circular(RLTokens.rXl)),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                  maxHeight:
                      MediaQuery.of(context).size.height * 0.8),
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
                          final o = e.value;
                          final isLast = e.key == options.length - 1;
                          final isSel = selected == o.label;
                          return GestureDetector(
                            onTap: () {
                              Haptics.vibrate(HapticsType.selection);
                              onPick(o.label);
                            },
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
                                        fontWeight: isSel
                                            ? RLTokens.bold
                                            : RLTokens.medium,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                  ),
                                  if (isSel)
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
