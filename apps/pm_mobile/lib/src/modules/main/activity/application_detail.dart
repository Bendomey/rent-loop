// Application Info — hub screen.
//
// Redesign of the old single long scroll: the hub carries the hero and the
// "Complete application info" checklist, and each checklist row opens its own
// section page (see application_detail_pages.dart). Progress is derived from
// the data rather than stored, so editing a section moves the bar.

import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_edit_sheets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class ApplicationDetailScreen extends StatefulWidget {
  const ApplicationDetailScreen({
    super.key,
    required this.id,
    this.application,
  });

  final String id;

  /// The row the applications list was showing when it was tapped. This screen
  /// is otherwise still seed-backed (there is no detail fetch yet), so without
  /// this a real application id would fall through to the first fixture and
  /// every card would open the same record.
  final TenantApplicationModel? application;

  @override
  State<ApplicationDetailScreen> createState() =>
      _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  late ApplicationDetailData _d = widget.application != null
      ? ApplicationDetailData.fromApplicationModel(widget.application!)
      : ApplicationDetailData.forId(widget.id);

  void _update(ApplicationDetailData next) => setState(() => _d = next);

  Future<void> _openSection(String key) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;

    Widget page(ApplicationDetailData d) => switch (key) {
      'unit' => ApplicationUnitPage(data: d, onChanged: _update),
      'tenant' => ApplicationTenantPage(data: d, onChanged: _update),
      'movein' => ApplicationMoveInPage(data: d, onChanged: _update),
      'financial' => ApplicationFinancialPage(data: d, onChanged: _update),
      'docs' => ApplicationDocsPage(data: d, onChanged: _update),
      _ => ApplicationTenantPage(data: d, onChanged: _update),
    };

    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => page(_d)));
  }

  Future<void> _approve() async {
    if (!_d.canApprove) {
      await Haptics.vibrate(HapticsType.warning);
      if (!mounted) return;
      final pending = _d.checklist
          .where((s) => s.items.isNotEmpty && !s.complete)
          .map((s) => s.label.toLowerCase())
          .join(', ');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Still to complete: $pending')));
      return;
    }

    await Haptics.vibrate(HapticsType.medium);
    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        title: const Text(
          'Approve application?',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 20,
            color: RLTokens.ink,
          ),
        ),
        content: Text(
          'This creates a lease for ${_d.applicant.fullName}. The application '
          'can no longer be edited afterwards.',
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                color: RLTokens.muted,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text(
              'Approve',
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

    if (confirmed != true || !mounted) return;
    setState(() => _d = _d.copyWith(approved: true));
    await showWhatsNextSheet(context, _d.applicant.fullName);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: '#${_d.code}',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) await showAddDocumentSheet(context);
              },
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.more_horiz, size: 22, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                4,
                RLTokens.gutter,
                24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_d.approved) ...[
                    const SizedBox(height: 8),
                    const _LeaseCreatedBanner(),
                  ],
                  const SizedBox(height: 8),
                  _HeroCard(data: _d),
                  if (_d.approved && _d.desiredUnit != null) ...[
                    const SizedBox(height: 10),
                    _UnitCard(unit: _d.desiredUnit!, data: _d),
                  ],
                  const SizedBox(height: 8),
                  _ChecklistCard(data: _d, onOpen: _openSection),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          _ActionBar(
            approved: _d.approved,
            onApprove: _approve,
            onCancel: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            onWhatsNext: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) {
                await showWhatsNextSheet(context, _d.applicant.fullName);
              }
            },
          ),
        ],
      ),
    );
  }
}

// ── Lease created banner (approved state) ────────────────────────────────────

class _LeaseCreatedBanner extends StatelessWidget {
  const _LeaseCreatedBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.successBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(27, 158, 92, 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_rounded, size: 20, color: RLTokens.success),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Lease is created',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.success,
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'This application is approved and can no longer be edited '
                  'here. Head to the tenants page to make changes.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.success,
                    height: 1.5,
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

// ── Hero ─────────────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.data});
  final ApplicationDetailData data;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '#${data.code}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 12,
                  color: RLTokens.muted,
                ),
              ),
              const Spacer(),
              RLPill(
                data.displayStatus,
                tone: data.approved ? RLTone.success : statusTone(data.status),
                large: true,
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Application Info',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 21,
              color: RLTokens.ink,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Submitted ${data.submittedOn} · by ${data.submittedBy}',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Unit card (approved state) ───────────────────────────────────────────────

class _UnitCard extends StatelessWidget {
  const _UnitCard({required this.unit, required this.data});
  final ApplicationUnit unit;
  final ApplicationDetailData data;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(RLTokens.rSm),
            ),
            child: const Icon(
              Icons.apartment_rounded,
              size: 22,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unit.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${unitTypeLabel(unit.type)} · '
                  '${formatPesewas(data.financial.rentFee)}',
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
          RLPill('Occupied', tone: statusTone('Occupied')),
        ],
      ),
    );
  }
}

// ── Checklist ────────────────────────────────────────────────────────────────

class _ChecklistCard extends StatelessWidget {
  const _ChecklistCard({required this.data, required this.onOpen});
  final ApplicationDetailData data;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final sections = data.checklist;
    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Complete application info',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 19,
              color: RLTokens.ink,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Fill out the lease application — tap a step to open it.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 16, 0, 4),
            child: Row(
              children: [
                Text(
                  '${data.progress.round()}%',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 26,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: RLBar(percent: data.progress)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < sections.length; i++)
            _ChecklistRow(
              section: sections[i],
              first: i == 0,
              onTap: () => onOpen(sections[i].key),
            ),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({
    required this.section,
    required this.first,
    required this.onTap,
  });

  final ApplicationChecklistSection section;
  final bool first;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final done = section.complete;
    final hasItems = section.items.isNotEmpty;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          border: first
              ? null
              : const Border(top: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: done ? RLTokens.crimson : RLTokens.surface,
                borderRadius: BorderRadius.circular(7),
                border: done
                    ? null
                    : Border.all(color: RLTokens.hairline, width: 1.5),
              ),
              child: done
                  ? const Icon(
                      Icons.check_rounded,
                      size: 15,
                      color: Colors.white,
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                section.label,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  fontWeight: RLTokens.medium,
                  color: RLTokens.ink,
                ),
              ),
            ),
            if (hasItems) ...[
              _CountBadge(
                text: '${section.doneCount}/${section.items.length}',
                done: done,
              ),
              const SizedBox(width: 8),
            ],
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: RLTokens.micro,
            ),
          ],
        ),
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.text, required this.done});
  final String text;
  final bool done;

  @override
  Widget build(BuildContext context) {
    final tone = done ? RLTone.success : RLTone.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 11,
          fontWeight: RLTokens.bold,
          color: tone.fg,
        ),
      ),
    );
  }
}

// ── Sticky action bar ────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.approved,
    required this.onApprove,
    required this.onCancel,
    required this.onWhatsNext,
  });

  final bool approved;
  final VoidCallback onApprove;
  final VoidCallback onCancel;
  final VoidCallback onWhatsNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        RLTokens.gutter,
        12,
        RLTokens.gutter,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: approved
          ? RLBtn(
              label: "What's next?",
              kind: RLBtnKind.primary,
              icon: Icons.bolt_rounded,
              full: true,
              onPressed: onWhatsNext,
            )
          : Row(
              children: [
                RLBtn(
                  label: 'Cancel',
                  kind: RLBtnKind.light,
                  onPressed: onCancel,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RLBtn(
                    label: 'Approve',
                    kind: RLBtnKind.primary,
                    icon: Icons.check_rounded,
                    full: true,
                    onPressed: onApprove,
                  ),
                ),
              ],
            ),
    );
  }
}
