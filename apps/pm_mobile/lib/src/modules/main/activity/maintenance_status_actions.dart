import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// Status-transition UI shared by the maintenance board (drag between columns)
// and the maintenance detail screen (Change status action).
//
// Both entry points must gate the same two transitions identically: Resolved
// asks for confirmation, Cancelled requires a written reason. Keeping the
// prompts here means a change to either rule lands in one place instead of
// drifting between the two screens.

/// Confirmation before moving a request to Resolved. Returns true to proceed.
Future<bool> confirmMaintenanceResolve(
  BuildContext context,
  String requestTitle,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Mark as Resolved?'),
      content: Text('"$requestTitle" will be moved to Resolved.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Confirm'),
        ),
      ],
    ),
  );
  return confirmed == true;
}

/// Prompts for the mandatory cancellation reason. Returns the trimmed reason,
/// or null when the manager backs out.
Future<String?> promptMaintenanceCancelReason(
  BuildContext context,
  String requestTitle,
) async {
  final reason = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => MaintenanceCancelReasonSheet(title: requestTitle),
  );
  final trimmed = reason?.trim();
  if (trimmed == null || trimmed.isEmpty) return null;
  return trimmed;
}

/// Picks the status to move a request to. [currentStatusLabel] is excluded —
/// there is nothing to submit for a no-op transition.
Future<String?> pickMaintenanceStatus(
  BuildContext context,
  String currentStatusLabel,
) {
  final options = kMaintenanceStatusOrder
      .where((s) => s != currentStatusLabel)
      .toList();

  return showModalBottomSheet<String>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        20,
        RLTokens.gutter,
        20,
      ),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(RLTokens.rXl),
          topRight: Radius.circular(RLTokens.rXl),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Change status',
              style: TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: RLTokens.textCardHead,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Currently $currentStatusLabel',
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: RLTokens.textSubtitle,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 10),
            for (var i = 0; i < options.length; i++)
              RLRow(
                title: options[i],
                last: i == options.length - 1,
                leading: RLDot(tone: statusTone(options[i])),
                onTap: () => Navigator.pop(ctx, options[i]),
              ),
          ],
        ),
      ),
    ),
  );
}

/// Collects the mandatory reason when cancelling a maintenance request.
class MaintenanceCancelReasonSheet extends StatefulWidget {
  const MaintenanceCancelReasonSheet({super.key, required this.title});
  final String title;

  @override
  State<MaintenanceCancelReasonSheet> createState() =>
      _MaintenanceCancelReasonSheetState();
}

class _MaintenanceCancelReasonSheetState
    extends State<MaintenanceCancelReasonSheet> {
  final _controller = TextEditingController();
  bool _touched = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = _controller.text.trim().isEmpty;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          20,
          RLTokens.gutter,
          20,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cancel request',
              style: TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: RLTokens.textCardHead,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.title,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: RLTokens.textSubtitle,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              autofocus: true,
              maxLines: 3,
              onChanged: (_) => setState(() => _touched = true),
              decoration: InputDecoration(
                hintText: 'Reason for cancelling',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                errorText: _touched && isEmpty ? 'A reason is required' : null,
              ),
            ),
            const SizedBox(height: 16),
            RLBtn(
              label: 'Confirm cancellation',
              full: true,
              kind: RLBtnKind.danger,
              onPressed: isEmpty
                  ? null
                  : () => Navigator.pop(context, _controller.text),
            ),
          ],
        ),
      ),
    );
  }
}
