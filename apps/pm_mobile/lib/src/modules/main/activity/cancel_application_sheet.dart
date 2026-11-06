import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/cancel_application_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const kCancelReasonMaxLength = 500;

/// Resolves to true once the tenant setup was cancelled.
Future<bool> showCancelApplicationSheet(
  BuildContext context, {
  required String propertyId,
  required String id,
}) async {
  final cancelled = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _CancelApplicationSheet(
      propertyId: propertyId,
      id: id,
      onClose: ([cancelled = false]) => Navigator.of(ctx).pop(cancelled),
    ),
  );
  return cancelled ?? false;
}

class _CancelApplicationSheet extends ConsumerStatefulWidget {
  const _CancelApplicationSheet({
    required this.propertyId,
    required this.id,
    required this.onClose,
  });

  final String propertyId;
  final String id;
  final void Function([bool cancelled]) onClose;

  @override
  ConsumerState<_CancelApplicationSheet> createState() =>
      _CancelApplicationSheetState();
}

class _CancelApplicationSheetState
    extends ConsumerState<_CancelApplicationSheet> {
  final _reason = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(cancelApplicationNotifierProvider.notifier).reset(),
    );
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(cancelApplicationNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      id: widget.id,
      reason: _reason.text.trim(),
    );
    if (!mounted) return;
    if (ref.read(cancelApplicationNotifierProvider).status.isSuccess()) {
      widget.onClose(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cancelApplicationNotifierProvider);
    final pending = state.status.isLoading();
    final canSubmit = _reason.text.trim().isNotEmpty && !pending;

    return RLSheet(
      title: 'Cancel tenant setup?',
      desc:
          'The tenant will no longer be able to move in. This can\'t be '
          'undone.',
      onClose: widget.onClose,
      footer: Row(
        children: [
          Expanded(
            child: RLBtn(
              label: 'Go back',
              kind: RLBtnKind.light,
              full: true,
              onPressed: widget.onClose,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: 'Cancel tenant setup',
              kind: RLBtnKind.primary,
              full: true,
              onPressed: canSubmit ? _submit : null,
            ),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLSheetTextArea(
            label: 'Reason',
            controller: _reason,
            hint: 'Why is this being cancelled?',
            maxLength: kCancelReasonMaxLength,
            onChanged: (_) => setState(() {}),
          ),
          if (state.status == ApiStatus.failed) ...[
            const SizedBox(height: 12),
            RLSheetNote(
              text: state.errorMessage ?? 'Something happened. Try again.',
              tone: RLTone.danger,
            ),
          ],
        ],
      ),
    );
  }
}
