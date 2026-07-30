import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/placeholder_data.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sheets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Sessions — every signed-in device, revoke one or all others.
///
/// UI only: revoking drops the row from local state, nothing is sent.
class AccountSessionsPage extends StatefulWidget {
  const AccountSessionsPage({super.key});

  @override
  State<AccountSessionsPage> createState() => _AccountSessionsPageState();
}

class _AccountSessionsPageState extends State<AccountSessionsPage> {
  List<AccountSession> _sessions = List.of(kPlaceholderSessions);

  int get _others => _sessions.where((s) => !s.current).length;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        RLCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const RLIconTile(
                    icon: Icons.lock_outline_rounded,
                    tone: RLTone.neutral,
                    size: 40,
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_sessions.length} active '
                          '${_sessions.length == 1 ? 'session' : 'sessions'}',
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.bold,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Everywhere you’re signed in. If you don’t recognise '
                          'something, sign it out and change your password.',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (_others > 0) ...[
                const SizedBox(height: 14),
                RLBtn(
                  label: 'Sign out all others ($_others)',
                  kind: RLBtnKind.danger,
                  full: true,
                  icon: Icons.warning_amber_rounded,
                  onPressed: () => showSignOutOthersSheet(
                    context,
                    count: _others,
                    onConfirm: () => setState(
                      () => _sessions = _sessions
                          .where((s) => s.current)
                          .toList(),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        const RLLabel('Signed-in devices'),
        RLCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          child: Column(
            children: [
              for (var i = 0; i < _sessions.length; i++)
                _SessionRow(
                  session: _sessions[i],
                  last: i == _sessions.length - 1,
                  onSignOut: () => showSignOutDeviceSheet(
                    context,
                    session: _sessions[i],
                    onConfirm: () => setState(
                      () => _sessions = _sessions
                          .where((s) => s.id != _sessions[i].id)
                          .toList(),
                    ),
                  ),
                ),
            ],
          ),
        ),

        if (_others == 0)
          const Padding(
            padding: EdgeInsets.fromLTRB(0, 18, 0, 4),
            child: Center(
              child: Text(
                'All other sessions have been signed out.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: RLTokens.muted,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _SessionRow extends StatelessWidget {
  const _SessionRow({
    required this.session,
    required this.last,
    required this.onSignOut,
  });

  final AccountSession session;
  final bool last;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLIconTile(
            icon: deviceIcon(session.kind),
            tone: session.current ? RLTone.success : RLTone.neutral,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.device,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${session.os} · ${session.where}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${session.ip} · ${session.last}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    color: RLTokens.micro,
                  ),
                ),
                const SizedBox(height: 9),
                if (session.current)
                  const RLPill('This device', tone: RLTone.success)
                else
                  RLBtn(
                    label: 'Sign out',
                    kind: RLBtnKind.danger,
                    large: false,
                    icon: Icons.logout_rounded,
                    onPressed: onSignOut,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
