import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/approve_application_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const kOnlineDocumentWebNote =
    'The lease document was written on the web. Approve this tenant on the '
    'web so it can be turned into a PDF.';

bool needsWebPdf(TenantApplicationModel a) =>
    a.leaseAgreementDocumentMode == 'ONLINE' &&
    (a.leaseAgreementDocumentUrl ?? '').isEmpty;

/// Null when Approve is allowed; otherwise the line to show under the button.
String? approveBlocker(TenantApplicationModel a, ApplicationChecklist c) {
  if (needsWebPdf(a)) return kOnlineDocumentWebNote;
  if (c.canApprove) return null;
  final missing = [
    for (final s in c.steps)
      if (s.hasItems && !s.allItemsDone) s.section.label,
  ];
  return 'Still to finish: ${missing.join(', ')}';
}

/// Resolves to the new lease once the tenant has moved in.
Future<ApprovedLeaseModel?> showApproveSheet(
  BuildContext context, {
  required String propertyId,
  required String id,
  required String tenantName,
  required String? unitName,
  required bool noDocument,
}) => showModalBottomSheet<ApprovedLeaseModel>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: Colors.transparent,
  builder: (ctx) => _ApproveSheet(
    propertyId: propertyId,
    id: id,
    tenantName: tenantName,
    unitName: unitName,
    noDocument: noDocument,
    onClose: ([lease]) => Navigator.of(ctx).pop(lease),
  ),
);

class _ApproveSheet extends ConsumerStatefulWidget {
  const _ApproveSheet({
    required this.propertyId,
    required this.id,
    required this.tenantName,
    required this.unitName,
    required this.noDocument,
    required this.onClose,
  });

  final String propertyId;
  final String id;
  final String tenantName;
  final String? unitName;
  final bool noDocument;
  final void Function([ApprovedLeaseModel? lease]) onClose;

  @override
  ConsumerState<_ApproveSheet> createState() => _ApproveSheetState();
}

class _ApproveSheetState extends ConsumerState<_ApproveSheet> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(approveApplicationNotifierProvider.notifier).reset(),
    );
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(approveApplicationNotifierProvider.notifier);
    await notifier.submit(propertyId: widget.propertyId, id: widget.id);
    if (!mounted) return;
    final state = ref.read(approveApplicationNotifierProvider);
    if (state.status.isSuccess() && state.lease != null) {
      widget.onClose(state.lease);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(approveApplicationNotifierProvider);
    final pending = state.status.isLoading();
    final unit = widget.unitName ?? 'this unit';

    return RLSheet(
      title: 'Approve & move in ${widget.tenantName}?',
      desc:
          "This creates the lease for $unit. You won't be able to edit this "
          'tenant setup afterwards.',
      onClose: widget.onClose,
      dismissible: !pending,
      footer: Row(
        children: [
          Expanded(
            child: RLBtn(
              label: 'Go back',
              kind: RLBtnKind.light,
              full: true,
              onPressed: pending ? null : widget.onClose,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: 'Approve & move in',
              kind: RLBtnKind.primary,
              full: true,
              onPressed: pending ? null : _submit,
            ),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.noDocument)
            const RLSheetNote(
              text:
                  'No lease document is attached. You can add one on the web.',
              tone: RLTone.warning,
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
