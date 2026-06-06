import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class AddPropertyMemberScreen extends StatefulWidget {
  const AddPropertyMemberScreen({super.key, required this.id});
  final String id;

  @override
  State<AddPropertyMemberScreen> createState() => _State();
}

class _State extends State<AddPropertyMemberScreen> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _role = 'Admin';

  String get _roleDesc => _role == 'Admin'
      ? 'Admins have full access to all features and settings.'
      : 'Staff have limited access based on permissions you set.';

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'New member'),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(RLTokens.gutter, 14, RLTokens.gutter, 120 + bottom),
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
                    "We'll send an invitation to join via email or phone number.",
                    style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, color: RLTokens.muted, height: 1.5),
                  ),
                  const SizedBox(height: 24),

                  // Full name
                  const _FieldLabel('Full name'),
                  _Field(controller: _nameCtrl, placeholder: 'John Doe', keyboardType: TextInputType.name, textCapitalization: TextCapitalization.words),
                  const SizedBox(height: 18),

                  // Email
                  const _FieldLabel('Email'),
                  _Field(controller: _emailCtrl, placeholder: 'name@example.com', keyboardType: TextInputType.emailAddress, prefixIcon: Icons.mail_outline_rounded),
                  const SizedBox(height: 18),

                  // Phone
                  const _FieldLabel('Phone number'),
                  _PhoneField(controller: _phoneCtrl),
                  const SizedBox(height: 18),

                  // Role
                  const _FieldLabel('Role'),
                  Row(
                    children: ['Admin', 'Staff'].map((r) {
                      final on = _role == r;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () async {
                            await Haptics.vibrate(HapticsType.selection);
                            setState(() => _role = r);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            margin: EdgeInsets.only(right: r == 'Admin' ? 8 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 10),
                            decoration: BoxDecoration(
                              color: on ? RLTokens.crimsonTint : RLTokens.surface,
                              border: Border.all(color: on ? RLTokens.crimson : RLTokens.hairline, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  r == 'Admin' ? Icons.settings_outlined : Icons.person_outline_rounded,
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
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '$_roleDesc You can change their role later.',
                    style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted, height: 1.5),
                  ),
                ],
              ),
            ),
          ),
          _Footer(onCancel: () => context.pop()),
        ],
      ),
    );
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  const _Footer({required this.onCancel});
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 12 + bottom),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              onCancel();
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
              child: Text(
                'Cancel',
                style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
              ),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => Haptics.vibrate(HapticsType.medium),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
              decoration: BoxDecoration(
                color: RLTokens.crimson,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
              child: const Row(
                children: [
                  Text(
                    'Send invitation',
                    style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: Colors.white),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.placeholder,
    this.keyboardType = TextInputType.text,
    this.textCapitalization = TextCapitalization.none,
    this.prefixIcon,
  });
  final TextEditingController controller;
  final String placeholder;
  final TextInputType keyboardType;
  final TextCapitalization textCapitalization;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.mutedSoft),
        prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 18, color: RLTokens.mutedSoft) : null,
        filled: true,
        fillColor: RLTokens.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border:        OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.hairline, width: 1.5)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: RLTokens.crimson,   width: 1.5)),
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
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      child: Row(
        children: [
          // Flag picker
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: const [
                Text('🇬🇭', style: TextStyle(fontSize: 17)),
                SizedBox(width: 6),
                Icon(Icons.keyboard_arrow_down_rounded, size: 13, color: RLTokens.mutedSoft),
              ],
            ),
          ),
          Container(width: 1, height: 26, color: RLTokens.hairline),
          const SizedBox(width: 12),
          const Text('+233', style: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.muted)),
          const SizedBox(width: 6),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.ink, letterSpacing: 0.5),
              decoration: const InputDecoration(
                hintText: '24 000 0000',
                hintStyle: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.mutedSoft),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
