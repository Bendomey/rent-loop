import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (mirrors root.dart) ─────────────────────────────────────────────

class _AppData {
  const _AppData({
    required this.id,
    required this.name,
    required this.unit,
    required this.status,
    required this.rent,
    required this.stage,
    required this.phone,
  });
  final String id;
  final String name;
  final String unit;
  final String status;
  final int rent;
  final int stage;
  final String phone;
}

const _kApps = [
  _AppData(
    id: 'a1',
    name: 'Adjoa Frimpong',
    unit: 'Unit 1C · Cantonments Court',
    status: 'New',
    rent: 3000,
    stage: 1,
    phone: '+233 26 118 5540',
  ),
  _AppData(
    id: 'a2',
    name: 'Daniel Ofori',
    unit: 'Unit 12 · Spintex Heights',
    status: 'In Progress',
    rent: 3500,
    stage: 3,
    phone: '+233 24 330 7781',
  ),
  _AppData(
    id: 'a3',
    name: 'Naa Adjeley',
    unit: 'Shop 5 · Osu Retail Block',
    status: 'In Progress',
    rent: 6000,
    stage: 2,
    phone: '+233 20 555 9921',
  ),
  _AppData(
    id: 'a4',
    name: 'Selorm Kudjo',
    unit: 'Unit 9 · Spintex Heights',
    status: 'New',
    rent: 3500,
    stage: 1,
    phone: '+233 55 712 0034',
  ),
];

// ── Onboarding steps ──────────────────────────────────────────────────────────

class _SetupStep {
  const _SetupStep({
    required this.label,
    required this.sub,
    required this.icon,
    required this.done,
  });
  final String label;
  final String sub;
  final IconData icon;
  final bool done;
}

List<_SetupStep> _buildSetup(_AppData a) => [
  _SetupStep(
    label: 'Lease documents',
    sub: 'Standard Tenancy Agreement',
    icon: Icons.description_outlined,
    done: a.stage > 1,
  ),
  _SetupStep(
    label: 'Financials',
    sub: 'App fee + GH₵ ${_fmt(a.rent)}/mo',
    icon: Icons.account_balance_wallet_outlined,
    done: a.stage > 2,
  ),
  _SetupStep(
    label: 'Move-in setup',
    sub: 'Date + checklist',
    icon: Icons.location_on_outlined,
    done: a.stage > 3,
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class ApplicationDetailScreen extends StatelessWidget {
  const ApplicationDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final a = _kApps.firstWhere((x) => x.id == id, orElse: () => _kApps.first);
    final setup = _buildSetup(a);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Application',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async => Haptics.vibrate(HapticsType.selection),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.more_horiz, size: 22, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),

                  // Applicant card
                  _ApplicantCard(a: a),

                  // Onboarding steps
                  RLLabel('Onboarding setup'),
                  _SetupCard(steps: setup),

                  // Lease preview
                  RLLabel('Lease document preview'),
                  _LeasePreview(a: a),

                  // Approval info banner
                  const SizedBox(height: 18),
                  _InfoBanner(a: a),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          _ActionBar(),
        ],
      ),
    );
  }
}

// ── Applicant card ────────────────────────────────────────────────────────────

class _ApplicantCard extends StatelessWidget {
  const _ApplicantCard({required this.a});
  final _AppData a;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          Row(
            children: [
              RLAvatar(a.name, size: 50),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a.name,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 20,
                        color: RLTokens.ink,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      a.unit,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              RLPill(a.status, tone: statusTone(a.status)),
            ],
          ),
          const SizedBox(height: 14),
          // Call + phone number row
          Row(
            children: [
              RLBtn(
                label: 'Call',
                kind: RLBtnKind.light,
                icon: Icons.phone_outlined,
                large: false,
                onPressed: () async => Haptics.vibrate(HapticsType.selection),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: RLBtn(
                  label: a.phone,
                  kind: RLBtnKind.ghost,
                  large: false,
                  full: true,
                  onPressed: () async => Haptics.vibrate(HapticsType.selection),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Setup / onboarding card ───────────────────────────────────────────────────

class _SetupCard extends StatelessWidget {
  const _SetupCard({required this.steps});
  final List<_SetupStep> steps;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: List.generate(steps.length, (i) {
          final s = steps[i];
          final isLast = i == steps.length - 1;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
            decoration: BoxDecoration(
              border: isLast
                  ? null
                  : const Border(
                      bottom: BorderSide(color: RLTokens.hairlineSoft),
                    ),
            ),
            child: Row(
              children: [
                // Icon box
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: s.done ? RLTokens.successBg : RLTokens.fill,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(
                    s.done ? Icons.check_rounded : s.icon,
                    size: 18,
                    color: s.done ? RLTokens.success : RLTokens.muted,
                  ),
                ),
                const SizedBox(width: 13),
                // Label + sub
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.label,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        s.sub,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Done pill or chevron
                if (s.done)
                  RLPill('Done', tone: RLTone.success)
                else
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 17,
                    color: RLTokens.mutedSoft,
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ── Lease document preview ────────────────────────────────────────────────────

class _LeasePreview extends StatelessWidget {
  const _LeasePreview({required this.a});
  final _AppData a;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 150,
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.description_rounded, size: 32, color: RLTokens.mutedSoft),
          const SizedBox(height: 8),
          const Text(
            'Tenancy Agreement',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'generated from template · ready to e-sign',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Info banner ───────────────────────────────────────────────────────────────

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.a});
  final _AppData a;

  @override
  Widget build(BuildContext context) {
    final unitLabel = a.unit.split(' · ').first;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1),
            child: Icon(Icons.bolt_rounded, size: 18, color: RLTokens.crimson),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.inkSoft,
                  height: 1.5,
                ),
                children: [
                  const TextSpan(text: 'Approving creates a '),
                  const TextSpan(
                    text: 'Pending lease',
                    style: TextStyle(
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  TextSpan(
                    text:
                        ' for $unitLabel. It starts billing once you activate it.',
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

// ── Bottom action bar ─────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: const Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: Row(
        children: [
          RLBtn(
            label: 'Reject',
            kind: RLBtnKind.danger,
            onPressed: () async => Haptics.vibrate(HapticsType.medium),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: 'Approve & create lease',
              kind: RLBtnKind.primary,
              icon: Icons.check_rounded,
              full: true,
              onPressed: () async => Haptics.vibrate(HapticsType.medium),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

String _fmt(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
