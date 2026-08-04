import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/modules/main/leases/signature_capture_screen.dart';
import 'package:rentloop_manager/src/repository/models/lease_agreement_document_model.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/signing_token_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/delete_lease_agreement_document_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/generate_signing_token_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/link_document_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/resend_signing_token_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_agreement_document_provider.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/leases/signing_tokens_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// The lease Documents tab. Mirrors the web's document pipeline
/// (`LeaseAgreementDocumentSetup`/`SigningSection`) except for two actions
/// mobile deliberately doesn't build a native flow for — starting a new
/// document (upload or template-library pick) and editing one in the
/// Lexical editor — both surfaced as an alert with a link to continue on
/// web instead. Requesting signatures and the property manager's own
/// signing are real.
///
/// **Known, deliberate gap**: witness signers (`PM_WITNESS`/`TENANT_WITNESS`)
/// aren't surfaced here — the web derives them by parsing signature nodes
/// out of the document's Lexical content, which mobile never renders. Only
/// the two fixed roles (Property Manager, Tenant) are shown.
List<Widget> buildDocumentsTab(String propertyId, LeaseModel lease) {
  return [
    _DocumentSection(propertyId: propertyId, lease: lease),
    if (lease.terminationAgreementDocumentUrl != null) ...[
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Heading('Termination Agreement'),
            _LinkRow(
              url: lease.terminationAgreementDocumentUrl!,
              label: 'View Document',
            ),
          ],
        ),
      ),
    ],
  ];
}

Future<void> _openUrl(Uri uri) async {
  if (await canLaunchUrl(uri))
    await launchUrl(uri, mode: LaunchMode.externalApplication);
}

/// Shared by "Add Document" (no document yet) and "Edit Document" (ONLINE +
/// DRAFT) — both actions mobile can't do natively.
Future<void> _showUseWebAlert(
  BuildContext context, {
  required String title,
  required String body,
  required Uri url,
}) async {
  await Haptics.vibrate(HapticsType.selection);
  if (!context.mounted) return;
  await showDialog<void>(
    context: context,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    builder: (ctx) => AlertDialog(
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
            title,
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
            body,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (ctx.mounted) Navigator.of(ctx).pop();
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
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  await _openUrl(url);
                  if (ctx.mounted) Navigator.of(ctx).pop();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.crimson,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: Text(
                      'Continue on Web',
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
    ),
  );
}

// ── Document section ─────────────────────────────────────────────────────────

class _DocumentSection extends ConsumerWidget {
  const _DocumentSection({required this.propertyId, required this.lease});
  final String propertyId;
  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final docAsync = ref.watch(
      leaseAgreementDocumentProvider(propertyId, lease.id),
    );

    if (!docAsync.hasValue && docAsync.isLoading) {
      return Shimmer.fromColors(
        baseColor: RLTokens.fill,
        highlightColor: RLTokens.paper,
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
          ),
        ),
      );
    }
    if (docAsync.hasError && !docAsync.hasValue) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: RLSectionError(
          compact: true,
          onRetry: () => ref.invalidate(
            leaseAgreementDocumentProvider(propertyId, lease.id),
          ),
        ),
      );
    }

    final doc = docAsync.value;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: doc == null
          ? _NoDocumentCard(propertyId: propertyId, leaseId: lease.id)
          : _DocumentCard(propertyId: propertyId, lease: lease, doc: doc),
    );
  }
}

class _NoDocumentCard extends StatelessWidget {
  const _NoDocumentCard({required this.propertyId, required this.leaseId});
  final String propertyId;
  final String leaseId;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _Heading('Lease Agreement'),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            border: Border.all(
              color: RLTokens.hairline,
              style: BorderStyle.solid,
            ),
            borderRadius: BorderRadius.circular(RLTokens.rMd),
          ),
          child: Column(
            children: [
              const Icon(
                Icons.note_add_outlined,
                size: 26,
                color: RLTokens.mutedSoft,
              ),
              const SizedBox(height: 8),
              Text(
                'No document yet.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: RLTokens.muted,
                ),
              ),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () => _showUseWebAlert(
                  context,
                  title: 'Start a new document on the web',
                  body:
                      "Uploading a file or picking from your template library "
                      "isn't available on mobile yet. Continue on the web to "
                      'get started — you can come back here to request '
                      'signatures and sign once a document is ready.',
                  url: leaseOccupancyUrl(
                    propertyId,
                    leaseId,
                    campaign: 'lease_documents',
                    content: 'add_document',
                  ),
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 9,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: RLTokens.hairline),
                    borderRadius: BorderRadius.circular(RLTokens.rPill),
                  ),
                  child: Text(
                    'Add Document',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DocumentCard extends ConsumerWidget {
  const _DocumentCard({
    required this.propertyId,
    required this.lease,
    required this.doc,
  });
  final String propertyId;
  final LeaseModel lease;
  final LeaseAgreementDocumentModel doc;

  Future<void> _remove(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.warning);
    if (!context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RLTokens.rXl),
        ),
        title: Text(
          'Remove this document?',
          style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20),
        ),
        content: Text(
          'The linked document, any uploaded file, and all recorded '
          'signatures and signing progress will be lost.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                color: RLTokens.muted,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Remove',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.danger,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    await ref
        .read(deleteLeaseAgreementDocumentNotifierProvider.notifier)
        .submit(propertyId: propertyId, leaseId: lease.id);
    if (!context.mounted) return;
    if (ref
        .read(deleteLeaseAgreementDocumentNotifierProvider)
        .status
        .isSuccess()) {
      ref.invalidate(leaseAgreementDocumentProvider(propertyId, lease.id));
      showRLToast(ref, tone: RLToastTone.success, title: 'Document deleted');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Heading('Lease Agreement'),
        const SizedBox(height: 12),
        if (doc.mode == 'MANUAL')
          _ManualDocumentBody(propertyId: propertyId, lease: lease, doc: doc)
        else if (doc.status == 'DRAFT')
          _OnlineDraftBody(propertyId: propertyId, lease: lease, doc: doc)
        else
          _SigningSection(propertyId: propertyId, lease: lease, doc: doc),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerRight,
          child: GestureDetector(
            onTap: () => _remove(context, ref),
            child: Text(
              'Remove Document',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12,
                fontWeight: RLTokens.semibold,
                color: RLTokens.danger,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ManualDocumentBody extends ConsumerWidget {
  const _ManualDocumentBody({
    required this.propertyId,
    required this.lease,
    required this.doc,
  });
  final String propertyId;
  final LeaseModel lease;
  final LeaseAgreementDocumentModel doc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final linkState = ref.watch(linkDocumentNotifierProvider);
    final needsLinking =
        lease.leaseAgreementDocumentUrl == null && doc.documentUrl != null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.successBg,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.success.withAlpha(60)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.check_circle_rounded,
                size: 18,
                color: RLTokens.success,
              ),
              const SizedBox(width: 8),
              Text(
                'Document ready',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Uploaded files are treated as already signed — no in-app '
            'signing needed.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.inkSoft,
              height: 1.4,
            ),
          ),
          if (doc.documentUrl != null) ...[
            const SizedBox(height: 8),
            _LinkRow(url: doc.documentUrl!, label: 'View document'),
          ],
          if (needsLinking) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: linkState.status.isLoading()
                  ? null
                  : () async {
                      await Haptics.vibrate(HapticsType.selection);
                      await ref
                          .read(linkDocumentNotifierProvider.notifier)
                          .submit(
                            propertyId: propertyId,
                            leaseId: lease.id,
                            documentUrl: doc.documentUrl!,
                          );
                      if (ref
                          .read(linkDocumentNotifierProvider)
                          .status
                          .isSuccess()) {
                        ref.invalidate(
                          leaseDetailProvider(propertyId, lease.id),
                        );
                        showRLToast(
                          ref,
                          tone: RLToastTone.success,
                          title: 'Document linked',
                        );
                      }
                    },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: RLTokens.success,
                  borderRadius: BorderRadius.circular(RLTokens.rPill),
                ),
                child: Text(
                  linkState.status.isLoading() ? 'Saving…' : 'Done',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    fontWeight: RLTokens.semibold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _OnlineDraftBody extends StatelessWidget {
  const _OnlineDraftBody({
    required this.propertyId,
    required this.lease,
    required this.doc,
  });
  final String propertyId;
  final LeaseModel lease;
  final LeaseAgreementDocumentModel doc;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.warningBg,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.warning.withAlpha(60)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.edit_note_rounded,
                size: 18,
                color: RLTokens.warning,
              ),
              const SizedBox(width: 8),
              Text(
                'Document needs editing',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Fill in the template on the web, then come back here to '
            'request signatures.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.inkSoft,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => _showUseWebAlert(
              context,
              title: 'Edit this document on the web',
              body:
                  "Filling in the template requires the full document editor, "
                  "which isn't available on mobile yet. Continue on the web "
                  'to finish it — you can come back here to request '
                  'signatures and sign once it is ready.',
              url: doc.documentId == null
                  ? leaseOccupancyUrl(
                      propertyId,
                      lease.id,
                      campaign: 'lease_documents',
                      content: 'edit_document',
                    )
                  : leaseDocumentEditorUrl(
                      propertyId,
                      doc.documentId!,
                      lease.id,
                      campaign: 'lease_documents',
                      content: 'edit_document',
                    ),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: RLTokens.warning),
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
              child: Text(
                'Edit Document',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.warning,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Signing section (FINALIZED / SIGNING / SIGNED) ───────────────────────────

class _SigningSection extends ConsumerWidget {
  const _SigningSection({
    required this.propertyId,
    required this.lease,
    required this.doc,
  });
  final String propertyId;
  final LeaseModel lease;
  final LeaseAgreementDocumentModel doc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pmSignature = doc.signatureFor('PROPERTY_MANAGER');
    final fullySigned = doc.status == 'SIGNED';
    final needsPdfGeneration = fullySigned && doc.documentUrl == null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (doc.status == 'FINALIZED' && doc.signatures.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: () => _showUseWebAlert(
                context,
                title: 'Need to make changes?',
                body:
                    'Open the editor on the web to revert this document to '
                    'draft so it can be edited again.',
                url: doc.documentId == null
                    ? leaseOccupancyUrl(
                        propertyId,
                        lease.id,
                        campaign: 'lease_documents',
                        content: 'revert_draft',
                      )
                    : leaseDocumentEditorUrl(
                        propertyId,
                        doc.documentId!,
                        lease.id,
                        campaign: 'lease_documents',
                        content: 'revert_draft',
                      ),
              ),
              child: Text(
                'Need to make changes? Open the editor on web.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  color: RLTokens.info,
                ),
              ),
            ),
          ),
        if (fullySigned && !needsPdfGeneration) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: RLTokens.successBg,
              borderRadius: BorderRadius.circular(RLTokens.rMd),
              border: Border.all(color: RLTokens.success.withAlpha(60)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.verified_rounded,
                  size: 18,
                  color: RLTokens.success,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Fully signed',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.success,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _LinkRow(url: doc.documentUrl!, label: 'View signed document'),
          const SizedBox(height: 12),
        ] else ...[
          _SignerRow(
            label: 'Property Manager',
            signature: pmSignature,
            trailing: pmSignature != null
                ? null
                : GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (!context.mounted) return;
                      final signed = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(
                          builder: (_) => SignatureCaptureScreen(
                            propertyId: propertyId,
                            leaseId: lease.id,
                            documentId: doc.id,
                          ),
                        ),
                      );
                      if (signed == true) {
                        ref.invalidate(
                          leaseAgreementDocumentProvider(propertyId, lease.id),
                        );
                      }
                    },
                    child: _ActionPill(label: 'Sign Document'),
                  ),
          ),
          const SizedBox(height: 8),
          _TenantSignerRow(propertyId: propertyId, lease: lease, doc: doc),
          const SizedBox(height: 12),
        ],
        if (needsPdfGeneration)
          GestureDetector(
            onTap: () => _showUseWebAlert(
              context,
              title: 'Ready to finish on the web',
              body:
                  'Every required signature is in. Generating the final '
                  "signed PDF needs the web app — it isn't available on "
                  'mobile yet.',
              url: leaseDocumentSigningUrl(
                propertyId,
                doc.id,
                lease.id,
                campaign: 'lease_documents',
                content: 'generate_pdf',
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: RLTokens.infoBg,
                borderRadius: BorderRadius.circular(RLTokens.rMd),
                border: Border.all(color: RLTokens.info.withAlpha(60)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    size: 16,
                    color: RLTokens.info,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'All signatures are in. Finish on web to generate the '
                      'signed PDF.',
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
          ),
      ],
    );
  }
}

class _TenantSignerRow extends ConsumerWidget {
  const _TenantSignerRow({
    required this.propertyId,
    required this.lease,
    required this.doc,
  });
  final String propertyId;
  final LeaseModel lease;
  final LeaseAgreementDocumentModel doc;

  Future<void> _requestSignature(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.selection);
    final tenant = lease.tenant;
    final contact = tenant?.email ?? tenant?.phone ?? 'the tenant';
    if (!context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RLTokens.rXl),
        ),
        title: Text(
          'Request signature?',
          style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20),
        ),
        content: Text(
          'A signing link will be sent to $contact.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                color: RLTokens.muted,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Send',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.crimson,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    await ref
        .read(generateSigningTokenNotifierProvider.notifier)
        .submit(
          propertyId: propertyId,
          documentId: doc.id,
          leaseId: lease.id,
          role: 'TENANT',
          signerName: tenant?.fullName,
          signerEmail: tenant?.email,
          signerPhone: tenant?.phone,
        );
    if (!context.mounted) return;
    if (ref.read(generateSigningTokenNotifierProvider).status.isSuccess()) {
      ref.invalidate(signingTokensProvider(propertyId, doc.id, lease.id));
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: 'Signing link created',
      );
    }
  }

  Future<void> _resend(
    BuildContext context,
    WidgetRef ref,
    String tokenId,
  ) async {
    await Haptics.vibrate(HapticsType.selection);
    await ref
        .read(resendSigningTokenNotifierProvider.notifier)
        .submit(propertyId: propertyId, tokenId: tokenId);
    if (!context.mounted) return;
    if (ref.read(resendSigningTokenNotifierProvider).status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(signingTokensProvider(propertyId, doc.id, lease.id));
      showRLToast(ref, tone: RLToastTone.success, title: 'Signing link resent');
    }
  }

  Future<void> _copyLink(BuildContext context, String token) async {
    await Haptics.vibrate(HapticsType.selection);
    final url = Uri.https(kPmHost, '/sign/$token').toString();
    await Clipboard.setData(ClipboardData(text: url));
    if (!context.mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Signing link copied')));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tenantSignature = doc.signatureFor('TENANT');
    if (tenantSignature != null) {
      return _SignerRow(label: 'Tenant', signature: tenantSignature);
    }

    final tokensAsync = ref.watch(
      signingTokensProvider(propertyId, doc.id, lease.id),
    );
    SigningTokenModel? token;
    for (final t in tokensAsync.valueOrNull ?? const <SigningTokenModel>[]) {
      if (t.role == 'TENANT') {
        token = t;
        break;
      }
    }

    if (token == null) {
      return _SignerRow(
        label: 'Tenant',
        signature: null,
        trailing: GestureDetector(
          onTap: () => _requestSignature(context, ref),
          child: _ActionPill(label: 'Request Signature'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SignerRow(
          label: 'Tenant',
          signature: null,
          subtitle: 'Pending signature',
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: () => _resend(context, ref, token!.id),
                child: _ActionPill(label: 'Resend'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () => _copyLink(context, token!.token),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.copy_rounded, size: 13, color: RLTokens.info),
              const SizedBox(width: 5),
              Text(
                'Copy Link to Sign',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.info,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SignerRow extends StatelessWidget {
  const _SignerRow({
    required this.label,
    required this.signature,
    this.subtitle,
    this.trailing,
  });
  final String label;
  final DocumentSignatureModel? signature;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final signed = signature != null;
    return Row(
      children: [
        Icon(
          signed ? Icons.check_circle_rounded : Icons.circle_outlined,
          size: 18,
          color: signed ? RLTokens.success : RLTokens.mutedSoft,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.medium,
                  color: RLTokens.ink,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _ActionPill extends StatelessWidget {
  const _ActionPill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        border: Border.all(color: RLTokens.hairline),
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12,
          fontWeight: RLTokens.semibold,
          color: RLTokens.ink,
        ),
      ),
    );
  }
}

// ── Shared small widgets ─────────────────────────────────────────────────────

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: TextStyle(
        fontFamily: RLTokens.fontMono,
        fontSize: 10.5,
        fontWeight: RLTokens.semibold,
        letterSpacing: 0.6,
        color: RLTokens.muted,
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.url, required this.label});
  final String url;
  final String label;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        await _openUrl(Uri.parse(url));
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.open_in_new_rounded, size: 14, color: RLTokens.info),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.info,
            ),
          ),
        ],
      ),
    );
  }
}
