import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_form_widgets.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/sign_as_manager_notifier.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// A standalone signature pad — not embedded in a full document render like
/// the web signing page (which parses the Lexical content and places
/// signature nodes inline, a rendering-engine-scale sub-system out of scope
/// for mobile). Functionally equivalent: draws a signature, uploads it, and
/// submits it to the same `POST .../signing` endpoint the web page's PM
/// "Sign Document" button hits. Pops `true` on a successful sign.
class SignatureCaptureScreen extends ConsumerStatefulWidget {
  const SignatureCaptureScreen({
    super.key,
    required this.propertyId,
    required this.leaseId,
    required this.documentId,
  });
  final String propertyId;
  final String leaseId;
  final String documentId;

  @override
  ConsumerState<SignatureCaptureScreen> createState() =>
      _SignatureCaptureScreenState();
}

class _SignatureCaptureScreenState
    extends ConsumerState<SignatureCaptureScreen> {
  final _boundaryKey = GlobalKey();
  final List<Offset?> _points = [];

  bool get _hasDrawing => _points.any((p) => p != null);

  void _clear() {
    setState(() => _points.clear());
  }

  void _onPanStart(DragStartDetails details) {
    final box = _boundaryKey.currentContext!.findRenderObject() as RenderBox;
    setState(() => _points.add(box.globalToLocal(details.globalPosition)));
  }

  void _onPanUpdate(DragUpdateDetails details) {
    final box = _boundaryKey.currentContext!.findRenderObject() as RenderBox;
    setState(() => _points.add(box.globalToLocal(details.globalPosition)));
  }

  void _onPanEnd(DragEndDetails details) {
    setState(() => _points.add(null));
  }

  Future<void> _reviewOnWeb() async {
    await Haptics.vibrate(HapticsType.selection);
    final uri = leaseDocumentSigningUrl(
      widget.propertyId,
      widget.documentId,
      widget.leaseId,
      campaign: 'lease_documents',
      content: 'review_before_sign',
    );
    if (await canLaunchUrl(uri))
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _submit() async {
    await Haptics.vibrate(HapticsType.selection);
    final boundary =
        _boundaryKey.currentContext!.findRenderObject()
            as RenderRepaintBoundary;
    final image = await boundary.toImage(pixelRatio: 3);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null || !mounted) return;

    await ref
        .read(signAsManagerNotifierProvider.notifier)
        .submit(
          propertyId: widget.propertyId,
          leaseId: widget.leaseId,
          documentId: widget.documentId,
          signaturePngBytes: byteData.buffer.asUint8List(),
        );
    if (!mounted) return;
    final state = ref.read(signAsManagerNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      if (mounted) {
        showRLToast(ref, tone: RLToastTone.success, title: 'Document signed');
        Navigator.of(context).pop(true);
      }
    } else {
      await Haptics.vibrate(HapticsType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(signAsManagerNotifierProvider);
    final isPending = state.status.isLoading();

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Sign Document',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "You're signing this document as the property manager. "
                    'This creates a binding electronic signature.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _reviewOnWeb,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.open_in_new_rounded,
                          size: 13,
                          color: RLTokens.info,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Review the full document on web',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.info,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      UFieldLabel('Draw your signature below'),
                      GestureDetector(
                        onTap: _hasDrawing ? _clear : null,
                        child: Text(
                          'Clear',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            fontWeight: RLTokens.semibold,
                            color: _hasDrawing
                                ? RLTokens.crimson
                                : RLTokens.mutedSoft,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  RepaintBoundary(
                    key: _boundaryKey,
                    child: Container(
                      height: 220,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(
                          color: RLTokens.hairline,
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(RLTokens.rMd),
                      ),
                      child: GestureDetector(
                        onPanStart: _onPanStart,
                        onPanUpdate: _onPanUpdate,
                        onPanEnd: _onPanEnd,
                        child: CustomPaint(
                          painter: _SignaturePainter(_points),
                          size: Size.infinite,
                        ),
                      ),
                    ),
                  ),
                  if (!_hasDrawing) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Sign with your finger or stylus above.',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.mutedSoft,
                      ),
                    ),
                  ],
                  if (state.status.isFailed()) ...[
                    const SizedBox(height: 16),
                    RLInlineBanner(
                      tone: RLBannerTone.danger,
                      title: 'Could not submit signature',
                      body: state.errorMessage,
                    ),
                  ],
                  const SizedBox(height: 24),
                  RLBtn(
                    label: isPending ? 'Submitting…' : 'Submit Signature',
                    full: true,
                    onPressed: (!_hasDrawing || isPending) ? null : _submit,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points);
  final List<Offset?> points;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = RLTokens.ink
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3;

    for (var i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      if (p1 != null && p2 != null) canvas.drawLine(p1, p2, paint);
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) =>
      // `points` is the same mutated-in-place List every rebuild (see
      // `_SignatureCaptureScreenState`), so a reference/deep comparison here
      // would always read as "unchanged" and the canvas would never
      // actually redraw even as points get added — always repaint instead.
      true;
}
