// Toast system — dark pill that floats above the tab bar.
// Two families of feedback:
//   • Inline banners  (RLInlineBanner / RLSectionError in widgets.dart)
//     — live inside forms and sections where the user is acting
//   • Toasts (this file)
//     — handle async / background results; appear over the UI, auto-dismiss
//
// Usage:
//   showRLToast(ref, tone: RLToastTone.success, title: 'Payment recorded',
//     body: 'GH₵ 4,200 · Ama Boateng');
//
//   showRLToast(ref, tone: RLToastTone.undo, title: 'Application rejected',
//     body: 'Selorm Kudjo', actionLabel: 'Undo', onAction: _undo);

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tokens.dart';

// ── Tone ──────────────────────────────────────────────────────────────────────

enum RLToastTone { error, success, offline, info, undo }

extension _RLToastToneX on RLToastTone {
  Color get fg => switch (this) {
    RLToastTone.error   => const Color(0xFFFF6F8E),
    RLToastTone.success => const Color(0xFF5FD08F),
    RLToastTone.offline => const Color(0xFFF0A868),
    RLToastTone.info    => const Color(0xFF7FA6FF),
    RLToastTone.undo    => const Color(0xFFFF6F8E),
  };

  IconData get icon => switch (this) {
    RLToastTone.error   => Icons.warning_rounded,
    RLToastTone.success => Icons.check_rounded,
    RLToastTone.offline => Icons.wifi_off_rounded,
    RLToastTone.info    => Icons.info_outline_rounded,
    RLToastTone.undo    => Icons.undo_rounded,
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────

class RLToastData {
  const RLToastData({
    required this.tone,
    required this.title,
    this.body,
    this.actionLabel,
    this.onAction,
  });

  final RLToastTone tone;
  final String title;
  final String? body;
  final String? actionLabel;
  final VoidCallback? onAction;
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class RLToastNotifier extends Notifier<RLToastData?> {
  Timer? _timer;

  @override
  RLToastData? build() => null;

  void show(
    RLToastData data, {
    Duration duration = const Duration(seconds: 4),
  }) {
    _timer?.cancel();
    state = data;
    _timer = Timer(duration, dismiss);
  }

  void dismiss() {
    _timer?.cancel();
    _timer = null;
    state = null;
  }
}

final rlToastProvider =
    NotifierProvider<RLToastNotifier, RLToastData?>(RLToastNotifier.new);

// ── Convenience function ──────────────────────────────────────────────────────

void showRLToast(
  WidgetRef ref, {
  required RLToastTone tone,
  required String title,
  String? body,
  String? actionLabel,
  VoidCallback? onAction,
  Duration duration = const Duration(seconds: 4),
}) {
  ref.read(rlToastProvider.notifier).show(
    RLToastData(
      tone: tone,
      title: title,
      body: body,
      actionLabel: actionLabel,
      onAction: onAction,
    ),
    duration: duration,
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

class RLToastWidget extends StatelessWidget {
  const RLToastWidget({
    super.key,
    required this.toast,
    required this.onDismiss,
  });

  final RLToastData toast;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final fg = toast.tone.fg;
    final icon = toast.tone.icon;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.45),
            blurRadius: 34,
            spreadRadius: -10,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(255, 255, 255, 0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 17, color: fg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  toast.title,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: Colors.white,
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (toast.body != null)
                  Text(
                    toast.body!,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: Color.fromRGBO(255, 255, 255, 0.6),
                      height: 1.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          if (toast.actionLabel != null)
            GestureDetector(
              onTap: () {
                toast.onAction?.call();
                onDismiss();
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  toast.actionLabel!,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.bold,
                    color: fg,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            )
          else
            GestureDetector(
              onTap: onDismiss,
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.close_rounded,
                  size: 16,
                  color: Color.fromRGBO(255, 255, 255, 0.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
