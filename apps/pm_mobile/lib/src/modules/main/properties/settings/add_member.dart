import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kRoles = [
  _RoleOption(label: 'Manager',   sub: 'Can manage units, tenants, and leases',         icon: Icons.manage_accounts_outlined),
  _RoleOption(label: 'Staff',     sub: 'Can view and update maintenance requests',        icon: Icons.build_outlined),
  _RoleOption(label: 'View only', sub: 'Read-only access to property data',               icon: Icons.visibility_outlined),
];

class _RoleOption {
  const _RoleOption({required this.label, required this.sub, required this.icon});
  final String   label, sub;
  final IconData icon;
}

class AddPropertyMemberScreen extends StatefulWidget {
  const AddPropertyMemberScreen({super.key, required this.id});
  final String id;

  @override
  State<AddPropertyMemberScreen> createState() => _State();
}

class _State extends State<AddPropertyMemberScreen> {
  final _emailCtrl = TextEditingController();
  final _nameCtrl  = TextEditingController();
  int  _roleIndex  = -1;
  bool _sending    = false;
  final _formKey   = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    if (_roleIndex < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select a role.', style: TextStyle(fontFamily: RLTokens.fontSans)),
          backgroundColor: RLTokens.ink,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(RLTokens.rMd)),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    setState(() => _sending = true);
    await Haptics.vibrate(HapticsType.medium);
    await Future.delayed(const Duration(milliseconds: 1000));
    if (!mounted) return;
    setState(() => _sending = false);
    await Haptics.vibrate(HapticsType.success);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'Invite member'),
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 24),
                children: [
                  _Label('Email address'),
                  _InputField(
                    controller: _emailCtrl,
                    hint: 'colleague@example.com',
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Required';
                      if (!v.contains('@')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  _Label('Name (optional)'),
                  _InputField(
                    controller: _nameCtrl,
                    hint: 'e.g. Kofi Asante',
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 24),
                  const _Label('Assign role'),
                  const SizedBox(height: 4),
                  ...List.generate(_kRoles.length, (i) {
                    final r      = _kRoles[i];
                    final active = i == _roleIndex;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GestureDetector(
                        onTap: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          setState(() => _roleIndex = i);
                        },
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
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: active ? RLTokens.crimsonTint2 : RLTokens.fill,
                                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                                ),
                                child: Icon(r.icon, size: 18, color: active ? RLTokens.crimson : RLTokens.inkSoft),
                              ),
                              const SizedBox(width: 13),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      r.label,
                                      style: TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 14.5,
                                        fontWeight: RLTokens.semibold,
                                        color: active ? RLTokens.crimson : RLTokens.ink,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(r.sub, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
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
              ),
            ),
          ),
          _SendBar(sending: _sending, onSend: _send),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.validator,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      textCapitalization: textCapitalization,
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

class _SendBar extends StatelessWidget {
  const _SendBar({required this.sending, required this.onSend});
  final bool sending;
  final VoidCallback onSend;

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
        onTap: sending ? null : onSend,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: RLTokens.crimson,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
          ),
          child: Center(
            child: sending
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.send_outlined, size: 17, color: Colors.white),
                      SizedBox(width: 8),
                      Text('Send invite', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15.5, fontWeight: RLTokens.semibold, color: Colors.white)),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
