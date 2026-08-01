import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Shared bottom-sheet chrome and form controls.
///
/// The General Settings sheets are built on these. My Account still carries
/// its own private copies (modules/main/more/my_account/sheets.dart) and can
/// migrate onto this kit when it is next touched.

/// Opens a sheet and hands the builder a `close` callback, so a sheet body
/// never has to reach for the right [Navigator] itself.
void showRLSheet(
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

/// Grabber, title, optional lede, close button, scrolling body and a pinned
/// footer. Caps at 90% of screen height and lifts above the keyboard.
class RLSheet extends StatelessWidget {
  const RLSheet({
    super.key,
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

/// Cancel on the left, the committing action on the right.
Widget rlSheetFooter({
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

/// Labelled single-line text input.
class RLSheetField extends StatelessWidget {
  const RLSheetField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return _LabelledField(
      label: label,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
        ),
        decoration: _inputDecoration(hint),
      ),
    );
  }
}

/// Labelled multi-line text input, with optional helper copy underneath.
class RLSheetTextArea extends StatelessWidget {
  const RLSheetTextArea({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.helper,
    this.lines = 3,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? helper;
  final int lines;

  @override
  Widget build(BuildContext context) {
    return _LabelledField(
      label: label,
      helper: helper,
      child: TextField(
        controller: controller,
        maxLines: lines,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: 1.5,
        ),
        decoration: _inputDecoration(hint),
      ),
    );
  }
}

/// Tappable radio rows — the phone's stand-in for the web dropdown.
class RLSheetSelect extends StatelessWidget {
  const RLSheetSelect({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.helper,
  });

  final String label;
  final String? value;
  final List<String> options;
  final ValueChanged<String> onChanged;
  final String? helper;

  @override
  Widget build(BuildContext context) {
    return _LabelledField(
      label: label,
      helper: helper,
      child: Column(
        children: [
          for (final option in options) ...[
            GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                onChanged(option);
              },
              behavior: HitTestBehavior.opaque,
              child: _SelectRow(label: option, selected: option == value),
            ),
            if (option != options.last) const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _SelectRow extends StatelessWidget {
  const _SelectRow({required this.label, required this.selected});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: selected ? RLTokens.crimsonTint : RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(
          color: selected ? RLTokens.crimsonTint2 : RLTokens.hairline,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? RLTokens.crimson : RLTokens.micro,
                width: 1.5,
              ),
            ),
            child: selected
                ? Center(
                    child: Container(
                      width: 9,
                      height: 9,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: RLTokens.crimson,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 14,
                fontWeight: selected ? RLTokens.bold : RLTokens.medium,
                color: RLTokens.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Tinted callout for the consequence of a destructive or one-way action.
class RLSheetNote extends StatelessWidget {
  const RLSheetNote({super.key, required this.text, this.tone = RLTone.info});

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

/// Bulleted "what changes" list shown before a one-way action.
class RLSheetBullets extends StatelessWidget {
  const RLSheetBullets({super.key, required this.title, required this.items});

  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
          ),
          for (final item in items)
            Padding(
              padding: const EdgeInsets.only(top: 7),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '•',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        color: RLTokens.inkSoft,
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ── Internals ────────────────────────────────────────────────────────────────

class _LabelledField extends StatelessWidget {
  const _LabelledField({required this.label, required this.child, this.helper});

  final String label;
  final Widget child;
  final String? helper;

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
        child,
        if (helper != null) ...[
          const SizedBox(height: 6),
          Text(
            helper!,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.muted,
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }
}

InputDecoration _inputDecoration(String? hint) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(
      fontFamily: RLTokens.fontSans,
      fontSize: 14.5,
      color: RLTokens.micro,
    ),
    filled: true,
    fillColor: RLTokens.paper,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
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
  );
}
