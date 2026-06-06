import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Design data ───────────────────────────────────────────────────────────────

class _Notif {
  const _Notif({
    required this.id,
    required this.icon,
    required this.tone,
    required this.title,
    required this.body,
    required this.age,
    required this.unread,
  });
  final String  id;
  final IconData icon;
  final _NotifTone tone;
  final String  title;
  final String  body;
  final String  age;
  final bool    unread;
}

enum _NotifTone { green, crimson, blue, orange }

extension _NotifToneColors on _NotifTone {
  Color get bg => switch (this) {
    _NotifTone.green   => RLTokens.successBg,
    _NotifTone.crimson => RLTokens.dangerBg,
    _NotifTone.blue    => RLTokens.infoBg,
    _NotifTone.orange  => RLTokens.warningBg,
  };
  Color get fg => switch (this) {
    _NotifTone.green   => RLTokens.success,
    _NotifTone.crimson => RLTokens.crimson,
    _NotifTone.blue    => RLTokens.info,
    _NotifTone.orange  => RLTokens.warning,
  };
}

const _kNotifications = [
  _Notif(
    id: 'n1',
    icon: Icons.credit_card_outlined,
    tone: _NotifTone.green,
    title: 'Payment received',
    body: 'Kwame Mensah paid GH₵ 4,200 — Unit 4B',
    age: '12m',
    unread: true,
  ),
  _Notif(
    id: 'n2',
    icon: Icons.build_outlined,
    tone: _NotifTone.crimson,
    title: 'New maintenance request',
    body: 'Leaking kitchen tap — Unit 4B, High priority',
    age: '2h',
    unread: true,
  ),
  _Notif(
    id: 'n3',
    icon: Icons.description_outlined,
    tone: _NotifTone.blue,
    title: 'New application',
    body: 'Adjoa Frimpong applied for Unit 1C',
    age: '5h',
    unread: true,
  ),
  _Notif(
    id: 'n4',
    icon: Icons.calendar_today_outlined,
    tone: _NotifTone.blue,
    title: 'Booking confirmed',
    body: 'Sarah Addai · Suite 4 · Jun 8–11',
    age: '1d',
    unread: false,
  ),
  _Notif(
    id: 'n5',
    icon: Icons.notifications_outlined,
    tone: _NotifTone.orange,
    title: 'Invoice overdue',
    body: 'INV-2041 · Ama Boateng · GH₵ 4,200',
    age: '1d',
    unread: false,
  ),
  _Notif(
    id: 'n6',
    icon: Icons.check_circle_outline,
    tone: _NotifTone.green,
    title: 'Lease activated',
    body: 'Selorm Kudjo · Unit 9 · Spintex Heights',
    age: '2d',
    unread: false,
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final List<_Notif> _items;
  late List<bool> _read;

  @override
  void initState() {
    super.initState();
    _items = List.of(_kNotifications);
    _read  = _items.map((n) => !n.unread).toList();
  }

  void _markAllRead() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _read = List.filled(_items.length, true));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          RLBackHeader(
            title: 'Notifications',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: _markAllRead,
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: Text(
                  'Read all',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.crimson,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                      border: Border.all(color: RLTokens.hairline),
                    ),
                    child: Column(
                      children: _items.asMap().entries.map((e) {
                        final i    = e.key;
                        final n    = e.value;
                        final last = i == _items.length - 1;
                        final isRead = _read[i];
                        return _NotifRow(
                          notif: n,
                          unread: !isRead,
                          last: last,
                          onTap: () async {
                            await Haptics.vibrate(HapticsType.selection);
                            setState(() => _read[i] = true);
                          },
                        );
                      }).toList(),
                    ),
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

// ── Notification row ──────────────────────────────────────────────────────────

class _NotifRow extends StatelessWidget {
  const _NotifRow({
    required this.notif,
    required this.unread,
    required this.last,
    required this.onTap,
  });

  final _Notif notif;
  final bool   unread;
  final bool   last;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
        decoration: BoxDecoration(
          color: unread ? RLTokens.crimsonTint : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: last
              ? null
              : Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tone icon tile (38×38, borderRadius 11)
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: notif.tone.bg,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(notif.icon, size: 18, color: notif.tone.fg),
            ),
            const SizedBox(width: 13),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Expanded(
                        child: Text(
                          notif.title,
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        notif.age,
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 10.5,
                          color: RLTokens.micro,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    notif.body,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            // Unread dot
            if (unread) ...[
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: RLTokens.crimson,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
