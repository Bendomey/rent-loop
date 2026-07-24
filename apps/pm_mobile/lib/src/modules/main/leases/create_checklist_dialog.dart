import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/create_checklist_notifier.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// Ports the web `CreateChecklistDialog` — a confirm step before creating a
/// new inspection report (the manager fills in no fields upfront; the
/// backend auto-populates items depending on [type]). Returns true if the
/// checklist was created, false/null if skipped or dismissed.
Future<bool?> showCreateChecklistDialog({
  required BuildContext context,
  required WidgetRef ref,
  required String propertyId,
  required String leaseId,
  required String type,
}) async {
  await Haptics.vibrate(HapticsType.selection);
  if (!context.mounted) return null;

  ref.read(createChecklistNotifierProvider.notifier).reset();

  return showDialog<bool>(
    context: context,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    builder: (ctx) => _CreateChecklistDialog(
      propertyId: propertyId,
      leaseId: leaseId,
      type: type,
    ),
  );
}

class _CreateChecklistDialog extends ConsumerStatefulWidget {
  const _CreateChecklistDialog({
    required this.propertyId,
    required this.leaseId,
    required this.type,
  });
  final String propertyId;
  final String leaseId;
  final String type;

  @override
  ConsumerState<_CreateChecklistDialog> createState() =>
      _CreateChecklistDialogState();
}

class _CreateChecklistDialogState
    extends ConsumerState<_CreateChecklistDialog> {
  Future<void> _create() async {
    await Haptics.vibrate(HapticsType.selection);
    await ref
        .read(createChecklistNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          leaseId: widget.leaseId,
          type: widget.type,
        );
    if (!mounted) return;
    if (ref.read(createChecklistNotifierProvider).status.isSuccess()) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Checklist created');
      Navigator.of(context).pop(true);
    }
  }

  String get _description => switch (widget.type) {
    'CHECK_IN' =>
      "Documenting the property condition at move-in protects both you and your tenant against future disputes.",
    'CHECK_OUT' =>
      'Documenting the property condition at move-out lets you accurately assess damage and support any deposit deductions.',
    _ =>
      "Documenting the property's current condition helps you track maintenance needs and support future reports.",
  };

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createChecklistNotifierProvider);
    final isPending = state.status.isLoading();
    final label = leaseChecklistTypeLabel(widget.type);

    return AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RLTokens.rXl),
      ),
      contentPadding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
      actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Create $label',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 20,
              letterSpacing: -0.3,
              color: RLTokens.ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            _description,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
              height: 1.45,
            ),
          ),
          if (widget.type == 'CHECK_OUT') ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: RLTokens.warningBg,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
                border: Border.all(color: RLTokens.warning.withAlpha(60)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    size: 16,
                    color: RLTokens.warning,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Without a Move-Out Report you may not be able to '
                      'support damage claims or deposit deductions.',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.inkSoft,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (state.status.isFailed()) ...[
            const SizedBox(height: 12),
            Text(
              state.errorMessage ?? 'Failed to create checklist.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.danger,
              ),
            ),
          ],
          const SizedBox(height: 4),
        ],
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: isPending
                    ? null
                    : () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) Navigator.of(context).pop(false);
                      },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: Text(
                      'Not now',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: isPending ? null : _create,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.crimson,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: Text(
                      isPending ? 'Creating…' : 'Create Report',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.semibold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
