import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ─── Checklist data (static — will be driven by API) ─────────────────────────

class _ChecklistItem {
  final String title;
  final String desc;
  final bool done;
  final String route;

  const _ChecklistItem({
    required this.title,
    required this.desc,
    required this.done,
    required this.route,
  });
}

const _kChecklist = <_ChecklistItem>[
  _ChecklistItem(
    title: 'Accept Agreements',
    desc:
        'Review and accept the Terms of Service and other legal agreements required to use Rentloop.',
    done: false,
    route: '/more/agreement',
  ),
  _ChecklistItem(
    title: 'Complete Profile',
    desc:
        'Your profile tells us a bit about you and your business so we can better tailor the experience to your needs.',
    done: true,
    route: '/more/settings',
  ),
  _ChecklistItem(
    title: 'Add your identity details',
    desc:
        'Provide your ID type and number to verify your identity as a property owner.',
    done: true,
    route: '/more/settings',
  ),
  _ChecklistItem(
    title: 'Add a property',
    desc: 'Add your first property to start managing your rentals and tenants.',
    done: false,
    route: '/properties/add',
  ),
  _ChecklistItem(
    title: 'Add your payment accounts',
    desc:
        'Connect your account details to start accepting payments online.',
    done: true,
    route: '/more/payment-accounts',
  ),
];

// ─── Shared colors (design spec exact values) ─────────────────────────────────

const _kOrangeBg     = Color.fromRGBO(233, 123, 42, 0.10);
const _kOrangeBorder = Color.fromRGBO(233, 123, 42, 0.30);
const _kOrangeTitle  = Color(0xFF9A4A12);
const _kDoneGreenBg  = Color.fromRGBO(27, 158, 92, 0.07);
const _kDoneGreenBd  = Color.fromRGBO(27, 158, 92, 0.28);
const _kPendingBg    = Color.fromRGBO(233, 123, 42, 0.08);
const _kPendingBd    = Color.fromRGBO(233, 123, 42, 0.30);

// ─── Banner (placed in HomeScreen above the revenue card) ─────────────────────

class ChecklistBanner extends StatelessWidget {
  const ChecklistBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final done = _kChecklist.where((c) => c.done).length;
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) await showChecklistSheet(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
        decoration: BoxDecoration(
          color: _kOrangeBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _kOrangeBorder),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              size: 22,
              color: RLTokens.warning,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Complete your checklist',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.bold,
                      color: _kOrangeTitle,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$done/${_kChecklist.length} steps complete',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Progress dots — gap: 3 between items (no margin before first)
            Row(
              children: _kChecklist
                  .asMap()
                  .entries
                  .map(
                    (e) => Container(
                      width: 16,
                      height: 4,
                      margin: EdgeInsets.only(left: e.key > 0 ? 3 : 0),
                      decoration: BoxDecoration(
                        color: e.value.done ? RLTokens.success : _kOrangeBorder,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Show helper ──────────────────────────────────────────────────────────────

Future<void> showChecklistSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.38),
    isScrollControlled: true,
    builder: (_) => _ChecklistSheet(
      onNavigate: (route) {
        Navigator.of(context).pop();
        context.push(route);
      },
    ),
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

class _ChecklistSheet extends StatelessWidget {
  final void Function(String route) onNavigate;

  const _ChecklistSheet({required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final done = _kChecklist.where((c) => c.done).length;
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
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Complete your profile',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSerif,
                            fontSize: 23,
                            letterSpacing: -0.4,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          "You're almost there! Complete the following steps to get all set up.",
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13,
                            height: 1.45,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
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
                      child: const Icon(
                        Icons.close,
                        size: 17,
                        color: RLTokens.inkSoft,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Progress bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Row(
                children: [
                  Expanded(
                    child: RLBar(
                      percent: (done / _kChecklist.length) * 100,
                      height: 7,
                      color: RLTokens.success,
                      trackColor: RLTokens.successBg,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '$done/${_kChecklist.length}',
                    style: TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 11,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),

            // Step cards
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                child: Column(
                  children: [
                    for (int i = 0; i < _kChecklist.length; i++) ...[
                      if (i > 0) const SizedBox(height: 10),
                      _StepCard(item: _kChecklist[i], onNavigate: onNavigate),
                    ],
                  ],
                ),
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 30),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  RLBtn(
                    label: 'Close',
                    kind: RLBtnKind.light,
                    large: false,
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) Navigator.of(context).pop();
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Step card ────────────────────────────────────────────────────────────────

class _StepCard extends StatelessWidget {
  final _ChecklistItem item;
  final void Function(String route) onNavigate;

  const _StepCard({required this.item, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final tappable  = !item.done;
    final bg        = item.done ? _kDoneGreenBg  : _kPendingBg;
    final bd        = item.done ? _kDoneGreenBd  : _kPendingBd;
    final iconColor = item.done ? RLTokens.success : RLTokens.warning;
    final titleClr  = item.done ? RLTokens.success : _kOrangeTitle;

    return GestureDetector(
      onTap: tappable
          ? () async {
              await Haptics.vibrate(HapticsType.selection);
              onNavigate(item.route);
            }
          : null,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: bd),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              item.done
                  ? Icons.task_alt_rounded
                  : Icons.warning_amber_rounded,
              size: 20,
              color: iconColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 15,
                            fontWeight: RLTokens.bold,
                            color: titleClr,
                          ),
                        ),
                      ),
                      if (tappable) ...[
                        const SizedBox(width: 8),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 16,
                          color: iconColor,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.desc,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      height: 1.45,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
