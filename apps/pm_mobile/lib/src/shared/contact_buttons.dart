import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/phone.dart';
import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class RLContactButtons extends ConsumerWidget {
  const RLContactButtons({super.key, required this.phone});

  final String? phone;

  Future<void> _open(WidgetRef ref, Uri url) async {
    await Haptics.vibrate(HapticsType.selection);
    var opened = false;
    try {
      opened = await ref.read(urlOpenerProvider)(url);
    } catch (_) {}
    if (!opened) {
      showRLToast(ref, tone: RLToastTone.error, title: "Couldn't open that.");
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final call = callUri(phone);
    final wa = whatsAppNumber(phone);
    if (call == null || wa == null) return const SizedBox.shrink();
    return Row(
      children: [
        Expanded(
          child: RLBtn(
            label: 'Call',
            icon: Icons.phone_outlined,
            kind: RLBtnKind.light,
            large: false,
            full: true,
            onPressed: () => _open(ref, call),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: RLBtn(
            label: 'WhatsApp',
            icon: Icons.chat_bubble_outline_rounded,
            kind: RLBtnKind.light,
            large: false,
            full: true,
            onPressed: () => _open(ref, Uri.parse('https://wa.me/$wa')),
          ),
        ),
      ],
    );
  }
}
