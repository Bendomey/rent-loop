import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class _Doc {
  const _Doc({required this.id, required this.name, required this.type, required this.size, required this.date, this.signed = false});
  final String id, name, type, size, date;
  final bool   signed;
}

const _kDocs = [
  _Doc(id: 'd1', name: 'Standard Tenancy Agreement', type: 'PDF',  size: '248 KB', date: 'Jan 12, 2025', signed: true),
  _Doc(id: 'd2', name: 'Building Insurance Policy',  type: 'PDF',  size: '1.2 MB', date: 'Mar 5, 2025',  signed: false),
  _Doc(id: 'd3', name: 'Property Certificate',       type: 'PDF',  size: '380 KB', date: 'Feb 20, 2024', signed: false),
  _Doc(id: 'd4', name: 'Utility Agreement',          type: 'DOCX', size: '86 KB',  date: 'Apr 1, 2025',  signed: false),
];

IconData _typeIcon(String type) => switch (type) {
  'PDF'  => Icons.picture_as_pdf_outlined,
  'DOCX' => Icons.description_outlined,
  'IMG'  => Icons.image_outlined,
  _      => Icons.attach_file_rounded,
};

Color _typeColor(String type) => switch (type) {
  'PDF'  => RLTokens.danger,
  'DOCX' => RLTokens.info,
  _      => RLTokens.muted,
};

class PropertyDocumentsScreen extends ConsumerWidget {
  const PropertyDocumentsScreen({super.key, required this.id});
  final String id;

  void _showWebOnlyToast(WidgetRef ref) {
    showRLToast(
      ref,
      tone: RLToastTone.info,
      title: 'Not available on mobile yet',
      body: 'Use the web app to upload and manage documents.',
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: RLFAB(
        label: 'Upload',
        icon: Icons.upload_rounded,
        onPressed: () async {
          await Haptics.vibrate(HapticsType.medium);
          _showWebOnlyToast(ref);
        },
      ),
      body: Column(
        children: [
          const RLBackHeader(title: 'Documents'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 100),
              children: [
                // Upload card
                GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    _showWebOnlyToast(ref);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: RLTokens.fill,
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                      border: Border.all(color: RLTokens.hairline, width: 1.5, strokeAlign: BorderSide.strokeAlignInside),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: RLTokens.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: RLTokens.hairline),
                          ),
                          child: const Icon(Icons.upload_rounded, size: 22, color: RLTokens.crimson),
                        ),
                        const SizedBox(height: 12),
                        const Text('Upload document', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                        const SizedBox(height: 4),
                        const Text('PDF, DOCX, JPG — max 20 MB', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Section label
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${_kDocs.length} DOCUMENTS',
                          style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 10.5, letterSpacing: 0.8, color: RLTokens.muted),
                        ),
                      ),
                    ],
                  ),
                ),

                // Document list
                Container(
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Column(
                    children: List.generate(_kDocs.length, (i) {
                      final doc    = _kDocs[i];
                      final isLast = i == _kDocs.length - 1;
                      return GestureDetector(
                        onTap: () async => Haptics.vibrate(HapticsType.selection),
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            border: isLast ? null : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 42,
                                height: 42,
                                decoration: BoxDecoration(
                                  color: _typeColor(doc.type).withAlpha(18),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(_typeIcon(doc.type), size: 20, color: _typeColor(doc.type)),
                              ),
                              const SizedBox(width: 13),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(doc.name, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                                    const SizedBox(height: 3),
                                    Row(
                                      children: [
                                        Text(doc.type, style: TextStyle(fontFamily: RLTokens.fontMono, fontSize: 10.5, color: _typeColor(doc.type))),
                                        const SizedBox(width: 6),
                                        Container(width: 3, height: 3, decoration: const BoxDecoration(color: RLTokens.mutedSoft, shape: BoxShape.circle)),
                                        const SizedBox(width: 6),
                                        Text(doc.size, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
                                        const SizedBox(width: 6),
                                        Container(width: 3, height: 3, decoration: const BoxDecoration(color: RLTokens.mutedSoft, shape: BoxShape.circle)),
                                        const SizedBox(width: 6),
                                        Text(doc.date, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              GestureDetector(
                                onTap: () async {
                                  await Haptics.vibrate(HapticsType.selection);
                                  if (context.mounted) _showDocMenu(context, doc);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(4),
                                  child: const Icon(Icons.more_vert_rounded, size: 18, color: RLTokens.micro),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showDocMenu(BuildContext context, _Doc doc) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: RLTokens.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(doc.name, style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20, color: RLTokens.ink)),
              const SizedBox(height: 4),
              Text('${doc.type} · ${doc.size}', style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, color: RLTokens.muted)),
              const SizedBox(height: 20),
              _DocAction(icon: Icons.open_in_new_rounded, label: 'Open',     onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 4),
              _DocAction(icon: Icons.download_outlined,   label: 'Download', onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 4),
              _DocAction(icon: Icons.share_outlined,      label: 'Share',    onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 4),
              _DocAction(icon: Icons.delete_outline_rounded, label: 'Delete', danger: true, onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocAction extends StatelessWidget {
  const _DocAction({required this.icon, required this.label, required this.onTap, this.danger = false});
  final IconData icon;
  final String   label;
  final bool     danger;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = danger ? RLTokens.danger : RLTokens.ink;
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 14),
            Text(label, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.medium, color: color)),
          ],
        ),
      ),
    );
  }
}
