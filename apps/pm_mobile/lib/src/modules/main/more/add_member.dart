import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kProperties = [
  "Gideon's villa",
  'Emirate Hotel',
  'Airbnb/Lease Apartment',
  'Empty Property Test',
  'Serenity villa',
  "Domey's Villa",
  "Domey's Residence",
];

// ── Screen ────────────────────────────────────────────────────────────────────

class AddMemberScreen extends StatefulWidget {
  const AddMemberScreen({super.key});

  @override
  State<AddMemberScreen> createState() => _AddMemberScreenState();
}

class _AddMemberScreenState extends State<AddMemberScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _role = 'Admin';
  final _assigned = <String>{};

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _toggle(String p) {
    Haptics.vibrate(HapticsType.selection);
    setState(() {
      if (_assigned.contains(p)) {
        _assigned.remove(p);
      } else {
        _assigned.add(p);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'New member',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Create new member',
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
                    "We'll send the member an invitation to join via email / phone number.",
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      color: RLTokens.muted,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Form fields ──────────────────────────────────────────
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Full name
                      const _FormLabel(label: 'Full name'),
                      const SizedBox(height: 6),
                      _InputField(
                        controller: _nameCtrl,
                        placeholder: 'John Doe',
                      ),
                      const SizedBox(height: 18),

                      // Email
                      const _FormLabel(label: 'Email'),
                      const SizedBox(height: 6),
                      _InputField(
                        controller: _emailCtrl,
                        placeholder: 'm@example.com',
                        leadingIcon: Icons.mail_outline_rounded,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 18),

                      // Phone
                      const _FormLabel(label: 'Phone number'),
                      const SizedBox(height: 6),
                      _PhoneField(controller: _phoneCtrl),
                      const SizedBox(height: 18),

                      // Role
                      const _FormLabel(label: 'Role'),
                      const SizedBox(height: 8),
                      _RoleSelector(
                        role: _role,
                        onChanged: (r) {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _role = r);
                        },
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Admins have full access to all features and settings; Staff have limited access based on permissions. You can change their role later.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),

                  // ── Assign properties ─────────────────────────────────────
                  Container(
                    margin: const EdgeInsets.only(top: 28),
                    padding: const EdgeInsets.only(top: 22),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: RLTokens.hairlineSoft),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: const [
                            Text(
                              'Assign properties',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 18,
                                color: RLTokens.ink,
                                letterSpacing: -0.2,
                              ),
                            ),
                            SizedBox(width: 6),
                            Text(
                              '· Optional',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13,
                                fontWeight: RLTokens.medium,
                                color: RLTokens.mutedSoft,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'The member will have access to all properties you select. You can assign properties later.',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 9,
                          runSpacing: 9,
                          children: _kProperties.map((p) {
                            final on = _assigned.contains(p);
                            return GestureDetector(
                              onTap: () => _toggle(p),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 13,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: on
                                      ? RLTokens.crimsonTint
                                      : RLTokens.surface,
                                  border: Border.all(
                                    color: on
                                        ? RLTokens.crimson
                                        : RLTokens.hairline,
                                    width: 1.5,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (on) ...[
                                      const Icon(
                                        Icons.check_rounded,
                                        size: 13,
                                        color: RLTokens.crimson,
                                      ),
                                      const SizedBox(width: 6),
                                    ],
                                    Text(
                                      p,
                                      style: TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 13,
                                        fontWeight: RLTokens.semibold,
                                        color: on
                                            ? RLTokens.crimson
                                            : RLTokens.ink,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        if (_assigned.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Text(
                            '${_assigned.length} propert${_assigned.length == 1 ? 'y' : 'ies'} selected',
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
                ],
              ),
            ),
          ),

          // ── Footer ───────────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottomPad),
            decoration: const BoxDecoration(
              color: RLTokens.surface,
              border: Border(top: BorderSide(color: RLTokens.hairline)),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (context.mounted) Navigator.of(context).pop();
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                RLBtn(
                  label: 'Create member',
                  icon: Icons.check_rounded,
                  onPressed: () async {
                    await Haptics.vibrate(HapticsType.medium);
                    if (context.mounted) Navigator.of(context).pop();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Role selector ─────────────────────────────────────────────────────────────

class _RoleSelector extends StatelessWidget {
  const _RoleSelector({required this.role, required this.onChanged});
  final String role;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: ['Admin', 'Staff'].asMap().entries.map((e) {
        final r = e.value;
        final on = r == role;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: e.key == 0 ? 8 : 0),
            child: GestureDetector(
              onTap: () => onChanged(r),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(
                  vertical: 13,
                  horizontal: 10,
                ),
                decoration: BoxDecoration(
                  color: on ? RLTokens.crimsonTint : RLTokens.surface,
                  border: Border.all(
                    color: on ? RLTokens.crimson : RLTokens.hairline,
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      r == 'Admin'
                          ? Icons.settings_outlined
                          : Icons.person_outline_rounded,
                      size: 17,
                      color: on ? RLTokens.crimson : RLTokens.inkSoft,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      r,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.semibold,
                        color: on ? RLTokens.crimson : RLTokens.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Form field helpers ────────────────────────────────────────────────────────

class _FormLabel extends StatelessWidget {
  const _FormLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
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
      padding: EdgeInsets.only(left: leadingIcon != null ? 10 : 14, right: 14),
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
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

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
          Row(
            children: const [
              Text('🇬🇭', style: TextStyle(fontSize: 17)),
              SizedBox(width: 6),
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
                hintText: '20 000 0000',
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
