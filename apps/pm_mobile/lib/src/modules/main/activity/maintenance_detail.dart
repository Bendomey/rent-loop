import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (mirrors root.dart) ─────────────────────────────────────────────

class _MaintData {
  const _MaintData({
    required this.id,
    required this.title,
    required this.unit,
    required this.cat,
    required this.priority,
    required this.status,
    required this.tenant,
    required this.age,
    this.assigned,
  });
  final String  id;
  final String  title;
  final String  unit;
  final String  cat;
  final String  priority;
  final String  status;
  final String  tenant;
  final String  age;
  final String? assigned;
}

const _kMaint = [
  _MaintData(id: 'm1', title: 'Leaking kitchen tap',  unit: 'Unit 4B · Cantonments Court', cat: 'Plumbing',   priority: 'High',   status: 'New',         tenant: 'Kwame Mensah', age: '2h ago',  assigned: null),
  _MaintData(id: 'm2', title: 'AC not cooling',        unit: 'Unit 5A · Cantonments Court', cat: 'HVAC',       priority: 'Medium', status: 'In Progress', tenant: 'Ama Boateng',  age: '1d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm3', title: 'Broken window latch',   unit: 'Unit 7 · Spintex Heights',    cat: 'General',    priority: 'Low',    status: 'In Progress', tenant: 'Efua Sarpong', age: '2d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm4', title: 'Hallway lights out',    unit: 'Block A · Spintex Heights',   cat: 'Electrical', priority: 'High',   status: 'In Review',   tenant: 'Front desk',   age: '3d ago',  assigned: 'Mensah Electric'),
  _MaintData(id: 'm5', title: 'Repaint guest bath',    unit: 'Suite 3 · Labadi Beach',      cat: 'General',    priority: 'Low',    status: 'Resolved',    tenant: 'Housekeeping', age: '5d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm6', title: 'Gate motor jammed',     unit: 'Cantonments Court',           cat: 'General',    priority: 'High',   status: 'New',         tenant: 'Security',     age: '4h ago',  assigned: null),
  _MaintData(id: 'm7', title: 'Water heater fault',    unit: 'Unit 3B · Cantonments Court', cat: 'Plumbing',   priority: 'Medium', status: 'New',         tenant: 'Yaw Asante',   age: '6h ago',  assigned: null),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class MaintenanceDetailScreen extends StatelessWidget {
  const MaintenanceDetailScreen({super.key, required this.id});
  final String id;

  static const _steps = ['New', 'In Progress', 'In Review', 'Resolved'];

  @override
  Widget build(BuildContext context) {
    final m   = _kMaint.firstWhere((x) => x.id == id, orElse: () => _kMaint.first);
    final cur = _steps.indexOf(m.status).clamp(0, _steps.length - 1);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Request · ${m.id.toUpperCase()}',
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
                  // Priority + category pills
                  Row(
                    children: [
                      RLPill('${m.priority} priority', tone: statusTone(m.priority), large: true),
                      const SizedBox(width: 8),
                      RLPill(m.cat, tone: RLTone.neutral, large: true),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Title
                  Text(
                    m.title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 26,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Unit
                  Text(
                    m.unit,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(height: 18),
                  // Stepper card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: RLTokens.surface,
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                      border: Border.all(color: RLTokens.hairline),
                    ),
                    child: _Stepper(steps: _steps, current: cur),
                  ),
                  // Photos
                  RLLabel('Photos from tenant'),
                  _PhotosRow(),
                  // Details
                  RLLabel('Details'),
                  _DetailsCard(m: m),
                  // Discussion
                  RLLabel('Discussion'),
                  _DiscussionCard(m: m),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          _ActionBar(m: m),
        ],
      ),
    );
  }
}

// ── Status stepper ────────────────────────────────────────────────────────────

class _Stepper extends StatelessWidget {
  const _Stepper({required this.steps, required this.current});
  final List<String> steps;
  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: steps.asMap().entries.map((e) {
        final i      = e.key;
        final label  = e.value;
        final done   = i < current;
        final active = i == current;
        final isLast = i == steps.length - 1;

        return Expanded(
          child: Column(
            children: [
              // Circle row with connector lines
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Left connector
                  Expanded(
                    child: Container(
                      height: 2,
                      color: i == 0
                          ? Colors.transparent
                          : (done || active)
                              ? RLTokens.crimson
                              : RLTokens.hairline,
                    ),
                  ),
                  // Circle
                  _StepCircle(done: done, active: active),
                  // Right connector
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isLast
                          ? Colors.transparent
                          : done
                              ? RLTokens.crimson
                              : RLTokens.hairline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              // Label
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 10,
                  fontWeight: active ? RLTokens.bold : RLTokens.medium,
                  color: (done || active) ? RLTokens.ink : RLTokens.mutedSoft,
                  height: 1.2,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _StepCircle extends StatelessWidget {
  const _StepCircle({required this.done, required this.active});
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: done
            ? RLTokens.crimson
            : active
                ? RLTokens.surface
                : RLTokens.fill,
        border: Border.all(
          color: (done || active) ? RLTokens.crimson : RLTokens.hairline,
          width: 2,
        ),
      ),
      child: Center(
        child: done
            ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
            : Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active ? RLTokens.crimson : RLTokens.micro,
                ),
              ),
      ),
    );
  }
}

// ── Photos row ────────────────────────────────────────────────────────────────

class _PhotosRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Photo placeholder 1
        Expanded(child: _PhotoThumb()),
        const SizedBox(width: 10),
        // Photo placeholder 2
        Expanded(child: _PhotoThumb()),
        const SizedBox(width: 10),
        // Add button
        Expanded(
          child: GestureDetector(
            onTap: () async => Haptics.vibrate(HapticsType.selection),
            child: Container(
              height: 96,
              decoration: BoxDecoration(
                border: Border.all(color: RLTokens.hairline, width: 1.5, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt_outlined, size: 20, color: RLTokens.mutedSoft),
                  const SizedBox(height: 4),
                  Text(
                    'Add',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 10,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PhotoThumb extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 96,
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: const Center(
        child: Icon(Icons.image_outlined, size: 22, color: RLTokens.mutedSoft),
      ),
    );
  }
}

// ── Details card ──────────────────────────────────────────────────────────────

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.m});
  final _MaintData m;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          _FieldRow(k: 'Reported by', v: m.tenant),
          _FieldRow(k: 'Reported', v: m.age),
          _FieldRow(k: 'Category', v: m.cat),
          // Assigned row (last — no border)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 11),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Assigned to',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    color: RLTokens.muted,
                  ),
                ),
                Text(
                  m.assigned ?? 'Assign worker →',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: m.assigned != null ? RLTokens.ink : RLTokens.crimson,
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

class _FieldRow extends StatelessWidget {
  const _FieldRow({required this.k, required this.v});
  final String k;
  final String v;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            k,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
            ),
          ),
          Text(
            v,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Discussion card ───────────────────────────────────────────────────────────

class _DiscussionCard extends StatelessWidget {
  const _DiscussionCard({required this.m});
  final _MaintData m;

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
          // Tenant message (left)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RLAvatar(m.tenant, size: 32),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: const BorderRadius.only(
                      topLeft:     Radius.circular(4),
                      topRight:    Radius.circular(14),
                      bottomLeft:  Radius.circular(14),
                      bottomRight: Radius.circular(14),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Water's pooling under the sink, getting worse. Can someone come today?",
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.inkSoft,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        m.age,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 9.5,
                          color: RLTokens.micro,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Manager reply (right)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: RLTokens.crimsonTint,
                    borderRadius: const BorderRadius.only(
                      topLeft:     Radius.circular(14),
                      topRight:    Radius.circular(4),
                      bottomLeft:  Radius.circular(14),
                      bottomRight: Radius.circular(14),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Got it — sending Ben over this afternoon. Please clear under the sink.",
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.inkSoft,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        '1h ago',
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 9.5,
                          color: RLTokens.micro,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              RLAvatar('Akosua Owusu', size: 32, crimsonTone: true),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Bottom action bar ─────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.m});
  final _MaintData m;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: const Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: Row(
        children: [
          RLBtn(
            label: 'Assign',
            kind: RLBtnKind.light,
            icon: Icons.person_outline_rounded,
            onPressed: () async => Haptics.vibrate(HapticsType.selection),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: 'Advance status',
              kind: RLBtnKind.primary,
              icon: Icons.arrow_forward_rounded,
              full: true,
              onPressed: () async => Haptics.vibrate(HapticsType.medium),
            ),
          ),
        ],
      ),
    );
  }
}
