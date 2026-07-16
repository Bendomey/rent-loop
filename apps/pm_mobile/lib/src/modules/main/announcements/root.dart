import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data ─────────────────────────────────────────────────────────────────

class _AnnData {
  const _AnnData({
    required this.id,
    required this.title,
    required this.audience,
    required this.status,
    required this.date,
  });
  final String id;
  final String title;
  final String audience;
  final String status;
  final String date;
}

const _kAnn = [
  _AnnData(
    id: 'an1',
    title: 'Water supply maintenance Sat',
    audience: 'Cantonments Court',
    status: 'Active',
    date: 'Jun 4',
  ),
  _AnnData(
    id: 'an2',
    title: 'New security gate hours',
    audience: 'All properties',
    status: 'Active',
    date: 'May 30',
  ),
  _AnnData(
    id: 'an3',
    title: 'June rent reminder',
    audience: 'All tenants',
    status: 'Scheduled',
    date: 'Jun 1',
  ),
  _AnnData(
    id: 'an4',
    title: 'Pool closed for cleaning',
    audience: 'Labadi Beach Suites',
    status: 'Expired',
    date: 'May 20',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class AnnouncementsScreen extends StatelessWidget {
  const AnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Announcements',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) context.push('/more/announcements/add');
              },
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.add_rounded, size: 22, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                0,
                RLTokens.gutter,
                40,
              ),
              children: [
                const SizedBox(height: 10),

                // Compose CTA card
                _ComposeCard(),

                // Count label
                RLLabel('${_kAnn.length} announcements'),

                // Announcement cards
                ..._kAnn.map(
                  (an) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _AnnCard(an: an),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Compose CTA card ──────────────────────────────────────────────────────────

class _ComposeCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.medium);
        if (context.mounted) context.push('/more/announcements/add');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.ink,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
        ),
        child: Row(
          children: [
            const Icon(Icons.campaign_rounded, size: 26, color: Colors.white),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Post an announcement',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 18,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Target the workspace, a property, or units.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: Color(0x99FFFFFF),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            const Icon(Icons.add_rounded, size: 22, color: Colors.white),
          ],
        ),
      ),
    );
  }
}

// ── Announcement card ─────────────────────────────────────────────────────────

class _AnnCard extends StatelessWidget {
  const _AnnCard({required this.an});
  final _AnnData an;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async => Haptics.vibrate(HapticsType.selection),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    an.title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 17,
                      color: RLTokens.ink,
                      height: 1.2,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                RLPill(an.status, tone: statusTone(an.status)),
              ],
            ),
            const SizedBox(height: 9),
            Row(
              children: [
                const Icon(
                  Icons.people_outline_rounded,
                  size: 13,
                  color: RLTokens.mutedSoft,
                ),
                const SizedBox(width: 6),
                Text(
                  an.audience,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(width: 6),
                const Text('·', style: TextStyle(color: RLTokens.micro)),
                const SizedBox(width: 6),
                Text(
                  an.date,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
