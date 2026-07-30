import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/placeholder_data.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Public API ────────────────────────────────────────────────────────────────
//
// UI only — none of these are wired to the API. Confirmations call back so
// the calling page can update its local state.

void showChangeNameSheet(BuildContext context, {required String name}) {
  _openSheet(context, (close) => _ChangeNameSheet(name: name, onClose: close));
}

void showChangePasswordSheet(BuildContext context) {
  _openSheet(context, (close) => _ChangePasswordSheet(onClose: close));
}

void showUploadPhotoSheet(BuildContext context) {
  _openSheet(context, (close) => _UploadPhotoSheet(onClose: close));
}

void showRemovePhotoSheet(BuildContext context, {required String initials}) {
  _openSheet(
    context,
    (close) => _RemovePhotoSheet(initials: initials, onClose: close),
  );
}

void showSignOutDeviceSheet(
  BuildContext context, {
  required AccountSession session,
  required VoidCallback onConfirm,
}) {
  _openSheet(
    context,
    (close) => _SignOutDeviceSheet(
      session: session,
      onClose: close,
      onConfirm: onConfirm,
    ),
  );
}

void showSignOutOthersSheet(
  BuildContext context, {
  required int count,
  required VoidCallback onConfirm,
}) {
  _openSheet(
    context,
    (close) =>
        _SignOutOthersSheet(count: count, onClose: close, onConfirm: onConfirm),
  );
}

void showSignOutSelfSheet(
  BuildContext context, {
  required VoidCallback onConfirm,
}) {
  _openSheet(
    context,
    (close) => _SignOutSelfSheet(onClose: close, onConfirm: onConfirm),
  );
}

// ── Sheet launcher ────────────────────────────────────────────────────────────

void _openSheet(
  BuildContext context,
  Widget Function(VoidCallback close) builder,
) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => builder(() => Navigator.of(ctx).pop()),
  );
}

// ── Sheet chrome ──────────────────────────────────────────────────────────────

class _AccountSheet extends StatelessWidget {
  const _AccountSheet({
    required this.title,
    this.desc,
    required this.onClose,
    required this.child,
    required this.footer,
  });

  final String title;
  final String? desc;
  final VoidCallback onClose;
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
            Padding(
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
            ),
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
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      onClose();
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
                  ),
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

// ── Field ─────────────────────────────────────────────────────────────────────

class _SheetField extends StatelessWidget {
  const _SheetField({
    required this.label,
    required this.controller,
    this.hint,
    this.obscure = false,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool obscure;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
        const SizedBox(height: 7),
        TextField(
          controller: controller,
          obscureText: obscure,
          onChanged: onChanged,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.ink,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14.5,
              color: RLTokens.micro,
            ),
            filled: true,
            fillColor: RLTokens.paper,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 13,
            ),
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
              borderSide: const BorderSide(color: RLTokens.crimson),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Note callout ──────────────────────────────────────────────────────────────

class _SheetNote extends StatelessWidget {
  const _SheetNote({required this.text, this.tone = RLTone.info});

  final String text;
  final RLTone tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12.5,
          color: RLTokens.inkSoft,
          height: 1.5,
        ),
      ),
    );
  }
}

// ── Footer helpers ────────────────────────────────────────────────────────────

Widget _twoButtonFooter({
  required String confirmLabel,
  required VoidCallback onCancel,
  required VoidCallback onConfirm,
  bool enabled = true,
  RLBtnKind confirmKind = RLBtnKind.primary,
}) {
  return Row(
    children: [
      Expanded(
        child: RLBtn(
          label: 'Cancel',
          kind: RLBtnKind.light,
          full: true,
          onPressed: onCancel,
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: RLBtn(
          label: confirmLabel,
          kind: confirmKind,
          full: true,
          onPressed: enabled ? onConfirm : null,
        ),
      ),
    ],
  );
}

// ── Change name ───────────────────────────────────────────────────────────────

class _ChangeNameSheet extends StatefulWidget {
  const _ChangeNameSheet({required this.name, required this.onClose});
  final String name;
  final VoidCallback onClose;

  @override
  State<_ChangeNameSheet> createState() => _ChangeNameSheetState();
}

class _ChangeNameSheetState extends State<_ChangeNameSheet> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.name,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final value = _controller.text.trim();
    final canSave = value.length > 1 && value != widget.name;
    return _AccountSheet(
      title: 'Change your name',
      desc:
          'This is the name shown to your team, tenants and on documents you sign.',
      onClose: widget.onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Save name',
        enabled: canSave,
        onCancel: widget.onClose,
        onConfirm: widget.onClose,
      ),
      child: _SheetField(
        label: 'Full name',
        controller: _controller,
        hint: 'Your full name',
        onChanged: (_) => setState(() {}),
      ),
    );
  }
}

// ── Change password ───────────────────────────────────────────────────────────

int _passwordScore(String v) {
  var score = 0;
  if (v.length >= 8) score++;
  if (RegExp(r'[A-Z]').hasMatch(v) && RegExp(r'[a-z]').hasMatch(v)) score++;
  if (RegExp(r'\d').hasMatch(v)) score++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(v)) score++;
  return score;
}

class _PasswordMeter extends StatelessWidget {
  const _PasswordMeter({required this.value});
  final String value;

  @override
  Widget build(BuildContext context) {
    final score = _passwordScore(value);
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    final colors = [
      RLTokens.micro,
      RLTokens.crimson,
      RLTokens.warning,
      RLTokens.info,
      RLTokens.success,
    ];
    final color = colors[score];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                height: 5,
                margin: EdgeInsets.only(right: i == 3 ? 0 : 5),
                decoration: BoxDecoration(
                  color: i < score ? color : RLTokens.hairline,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 7),
        Row(
          children: [
            const Expanded(
              child: Text(
                'At least 8 characters, one number and one symbol.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 11.5,
                  color: RLTokens.muted,
                ),
              ),
            ),
            if (value.isNotEmpty)
              Text(
                labels[score],
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 11.5,
                  fontWeight: RLTokens.bold,
                  color: color,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet({required this.onClose});
  final VoidCallback onClose;

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mismatch = _confirm.text.isNotEmpty && _confirm.text != _next.text;
    return _AccountSheet(
      title: 'Change your password',
      desc:
          'Last changed $kPlaceholderPasswordChanged. You’ll stay signed in on this device.',
      onClose: widget.onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Update password',
        onCancel: widget.onClose,
        onConfirm: widget.onClose,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SheetField(
            label: 'Current password',
            controller: _current,
            hint: '••••••••',
            obscure: true,
          ),
          const SizedBox(height: 16),
          _SheetField(
            label: 'New password',
            controller: _next,
            hint: '••••••••',
            obscure: true,
            onChanged: (_) => setState(() {}),
          ),
          _PasswordMeter(value: _next.text),
          const SizedBox(height: 16),
          _SheetField(
            label: 'Confirm new password',
            controller: _confirm,
            hint: '••••••••',
            obscure: true,
            onChanged: (_) => setState(() {}),
          ),
          if (mismatch) ...[
            const SizedBox(height: 6),
            const Text(
              'Passwords don’t match.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12,
                fontWeight: RLTokens.semibold,
                color: RLTokens.crimson,
              ),
            ),
          ],
          const SizedBox(height: 16),
          const _SheetNote(
            text:
                'Other devices stay signed in. To sign them out, use Sessions after updating.',
            tone: RLTone.warning,
          ),
        ],
      ),
    );
  }
}

// ── Upload photo ──────────────────────────────────────────────────────────────

class _UploadPhotoSheet extends StatelessWidget {
  const _UploadPhotoSheet({required this.onClose});
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return _AccountSheet(
      title: 'Upload a profile photo',
      desc:
          'A square image works best — it’s cropped to a circle everywhere it appears.',
      onClose: onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Save photo',
        onCancel: onClose,
        onConfirm: onClose,
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 26),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              border: Border.all(
                color: RLTokens.hairline,
                style: BorderStyle.solid,
              ),
              color: RLTokens.paper,
            ),
            child: Column(
              children: [
                const Icon(
                  Icons.photo_camera_outlined,
                  size: 26,
                  color: RLTokens.mutedSoft,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Choose an image',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'JPG or PNG · min 200×200px · up to 2MB',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    RLBtn(
                      label: 'Photo library',
                      kind: RLBtnKind.light,
                      large: false,
                      icon: Icons.photo_library_outlined,
                      onPressed: () {},
                    ),
                    const SizedBox(width: 10),
                    RLBtn(
                      label: 'Camera',
                      kind: RLBtnKind.light,
                      large: false,
                      icon: Icons.photo_camera_outlined,
                      onPressed: () {},
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Remove photo ──────────────────────────────────────────────────────────────

class _RemovePhotoSheet extends StatelessWidget {
  const _RemovePhotoSheet({required this.initials, required this.onClose});
  final String initials;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return _AccountSheet(
      title: 'Remove your photo?',
      desc:
          'We’ll show your initials $initials instead. You can upload a new photo at any time.',
      onClose: onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Remove photo',
        onCancel: onClose,
        onConfirm: onClose,
      ),
      child: const SizedBox.shrink(),
    );
  }
}

// ── Sign out one device ───────────────────────────────────────────────────────

IconData deviceIcon(SessionKind kind) => switch (kind) {
  SessionKind.laptop => Icons.laptop_mac_rounded,
  SessionKind.phone => Icons.smartphone_rounded,
  SessionKind.tablet => Icons.tablet_mac_rounded,
};

class _SignOutDeviceSheet extends StatelessWidget {
  const _SignOutDeviceSheet({
    required this.session,
    required this.onClose,
    required this.onConfirm,
  });

  final AccountSession session;
  final VoidCallback onClose;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return _AccountSheet(
      title: 'Sign out this device?',
      desc:
          'We’ll end the session on ${session.device}. Signing back in needs the password again.',
      onClose: onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Sign out device',
        onCancel: onClose,
        onConfirm: () {
          onConfirm();
          onClose();
        },
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          children: [
            RLIconTile(icon: deviceIcon(session.kind), tone: RLTone.neutral),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.device,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${session.where} · ${session.last}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sign out all other sessions ───────────────────────────────────────────────

class _SignOutOthersSheet extends StatelessWidget {
  const _SignOutOthersSheet({
    required this.count,
    required this.onClose,
    required this.onConfirm,
  });

  final int count;
  final VoidCallback onClose;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return _AccountSheet(
      title: 'Sign out $count other ${count == 1 ? 'session' : 'sessions'}?',
      desc:
          'Every device except this one is signed out. This device stays signed in.',
      onClose: onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Sign out all others',
        onCancel: onClose,
        onConfirm: () {
          onConfirm();
          onClose();
        },
      ),
      child: const _SheetNote(
        text:
            'If you think someone else has access, change your password too — signing out alone won’t stop them logging back in.',
        tone: RLTone.warning,
      ),
    );
  }
}

// ── Sign out of this device ───────────────────────────────────────────────────

class _SignOutSelfSheet extends StatelessWidget {
  const _SignOutSelfSheet({required this.onClose, required this.onConfirm});

  final VoidCallback onClose;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return _AccountSheet(
      title: 'Sign out of this device?',
      desc:
          'You’ll need your password to sign back in. Your other sessions stay signed in.',
      onClose: onClose,
      footer: _twoButtonFooter(
        confirmLabel: 'Sign out',
        onCancel: onClose,
        onConfirm: () {
          onClose();
          onConfirm();
        },
      ),
      child: const SizedBox.shrink(),
    );
  }
}
