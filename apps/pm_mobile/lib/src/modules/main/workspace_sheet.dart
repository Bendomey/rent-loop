import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:url_launcher/url_launcher.dart';

// Static data — mirrors the design spec.
const _kWorkspaces = [
  _WsData(id: 'ws1', name: 'Owusu Estates',            initial: 'OE', role: 'Manager', units: 64),
  _WsData(id: 'ws2', name: 'Cantonments Property Co.', initial: 'CP', role: 'Staff',   units: 24),
  _WsData(id: 'ws3', name: 'Labadi Hospitality Group', initial: 'LH', role: 'Manager', units: 18),
];

class _WsData {
  const _WsData({required this.id, required this.name, required this.initial, required this.role, required this.units});
  final String id;
  final String name;
  final String initial;
  final String role;
  final int units;
}

// Call this from the home screen's workspace eyebrow button.
Future<void> showWorkspaceSheet(BuildContext context, {required String activeId}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => _WorkspaceSheet(activeId: activeId),
  );
}

class _WorkspaceSheet extends StatefulWidget {
  const _WorkspaceSheet({required this.activeId});
  final String activeId;

  @override
  State<_WorkspaceSheet> createState() => _WorkspaceSheetState();
}

class _WorkspaceSheetState extends State<_WorkspaceSheet> {
  late String _activeId;

  @override
  void initState() {
    super.initState();
    _activeId = widget.activeId;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  Text(
                    'Switch workspace',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      letterSpacing: -0.3,
                      color: RLTokens.ink,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: RLTokens.fill,
                        borderRadius: BorderRadius.circular(RLTokens.rSm),
                      ),
                      child: const Icon(Icons.close, size: 17, color: RLTokens.inkSoft),
                    ),
                  ),
                ],
              ),
            ),

            // Workspace list
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
              child: Column(
                children: _kWorkspaces.asMap().entries.map((e) {
                  final ws   = e.value;
                  final last = e.key == _kWorkspaces.length - 1;
                  final on   = ws.id == _activeId;
                  return GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      setState(() => _activeId = ws.id);
                      await Future.delayed(const Duration(milliseconds: 180));
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                      decoration: BoxDecoration(
                        border: last ? null : Border(
                          bottom: BorderSide(color: RLTokens.hairlineSoft),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Workspace tile (default 46px)
                          _WsTile(initial: ws.initial),
                          const SizedBox(width: 13),
                          // Name and role
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ws.name,
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 15.5,
                                    fontWeight: RLTokens.semibold,
                                    color: RLTokens.ink,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${ws.role} · ${ws.units} units',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 12.5,
                                    color: RLTokens.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Active indicator
                          on
                              ? Container(
                                  width: 24,
                                  height: 24,
                                  decoration: const BoxDecoration(
                                    color: RLTokens.crimson,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.check, size: 14, color: Colors.white),
                                )
                              : Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: RLTokens.hairline, width: 1.5),
                                  ),
                                ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            // Create workspace button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  final url = applyUrl(campaign: 'workspace_sheet', content: 'create_workspace');
                  if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add, size: 18, color: RLTokens.ink),
                      const SizedBox(width: 8),
                      Text(
                        'Create a new workspace',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Workspace initials tile ───────────────────────────────────────────────────

class _WsTile extends StatelessWidget {
  const _WsTile({required this.initial});
  final String initial;
  static const double size = 46;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: RLTokens.crimsonTint2),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: size * 0.36,
            color: RLTokens.crimson,
            letterSpacing: 0.3,
            height: 1,
          ),
        ),
      ),
    );
  }
}
