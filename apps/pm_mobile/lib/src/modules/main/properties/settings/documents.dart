import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kDocs = [
  _Doc(
    name: 'Basic Lease Agreement',
    file: 'basic-lease-agreement.docx',
    chars: 3517,
    owner: 'Benjamin Domey',
    updated: '21 Mar 2026',
  ),
  _Doc(
    name: 'Tenancy Renewal Notice',
    file: 'renewal-notice.docx',
    chars: 1280,
    owner: 'Akosua Owusu',
    updated: '14 Apr 2026',
  ),
  _Doc(
    name: 'Move-in Checklist',
    file: 'move-in-checklist.docx',
    chars: 920,
    owner: 'Akosua Owusu',
    updated: '2 May 2026',
  ),
];

class _Doc {
  const _Doc({
    required this.name,
    required this.file,
    required this.chars,
    required this.owner,
    required this.updated,
  });
  final String name, file, owner, updated;
  final int chars;
}

String _formatChars(int n) {
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(n % 1000 == 0 ? 0 : 1)}k';
  return '$n';
}

class PropertyDocumentsScreen extends StatelessWidget {
  const PropertyDocumentsScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: RLFAB(
        label: 'Add document',
        icon: Icons.add_rounded,
        onPressed: () => Haptics.vibrate(HapticsType.medium),
      ),
      body: Column(
        children: [
          RLBackHeader(
            title: 'Documents',
            trailing: IconButton(
              icon: const Icon(
                Icons.add_rounded,
                size: 22,
                color: RLTokens.ink,
              ),
              onPressed: () => Haptics.vibrate(HapticsType.selection),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                6,
                RLTokens.gutter,
                120,
              ),
              children: [
                const Text(
                  'Manage documents',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 24,
                    color: RLTokens.ink,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Your lease & agreement templates, in one place.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 14),

                // Search + Import row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 11,
                        ),
                        decoration: BoxDecoration(
                          color: RLTokens.fill,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: RLTokens.hairline),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.search_rounded,
                              size: 18,
                              color: RLTokens.mutedSoft,
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Search',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 14,
                                color: RLTokens.mutedSoft,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => Haptics.vibrate(HapticsType.selection),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 11,
                        ),
                        decoration: BoxDecoration(
                          color: RLTokens.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: RLTokens.hairline),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.upload_outlined,
                              size: 16,
                              color: RLTokens.ink,
                            ),
                            SizedBox(width: 6),
                            Text(
                              'Import',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13.5,
                                fontWeight: RLTokens.semibold,
                                color: RLTokens.ink,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Section label
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 18, 0, 10),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Templates',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.muted,
                          ),
                        ),
                      ),
                      Text(
                        '${_kDocs.length} files',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.crimson,
                        ),
                      ),
                    ],
                  ),
                ),

                ...List.generate(_kDocs.length, (i) {
                  final d = _kDocs[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: RLTokens.surface,
                        borderRadius: BorderRadius.circular(RLTokens.rLg),
                        border: Border.all(color: RLTokens.hairline),
                      ),
                      child: Row(
                        children: [
                          // DOCX icon tile
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: RLTokens.infoBg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.description_outlined,
                                  size: 18,
                                  color: RLTokens.info,
                                ),
                                const SizedBox(height: 1),
                                const Text(
                                  'DOCX',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 6.5,
                                    fontWeight: RLTokens.bold,
                                    color: RLTokens.info,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  d.name,
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 14.5,
                                    fontWeight: RLTokens.semibold,
                                    color: RLTokens.ink,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '${_formatChars(d.chars)} chars · ${d.owner}',
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 12,
                                    color: RLTokens.muted,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Updated ${d.updated}',
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 10.5,
                                    color: RLTokens.micro,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => Haptics.vibrate(HapticsType.selection),
                            child: const Padding(
                              padding: EdgeInsets.all(4),
                              child: Icon(
                                Icons.more_vert_rounded,
                                size: 20,
                                color: RLTokens.mutedSoft,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
