import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Status order ──────────────────────────────────────────────────────────────

const _kStatuses = ['New', 'In Progress', 'In Review', 'Resolved', 'Cancelled'];

const _kUnassigned = 'Unassigned';

const _kPriorities = ['Low', 'Medium', 'High', 'Emergency'];

const _kCategories = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Roofing',
  'Pest Control',
  'Landscaping & Grounds',
  'Locks & Security',
  'Painting',
  'Flooring',
  'Windows & Doors',
  'Safety & Fire',
  'Cleaning',
  'Utilities',
  'Other',
];

/// Priority-only tone override — `statusTone()`'s neutral fallback for
/// unmapped strings is deliberate (see docs/implementation.md), so
/// "Emergency" is resolved here instead of editing the shared switch.
RLTone _priorityTone(String priority) =>
    priority == 'Emergency' ? RLTone.danger : statusTone(priority);

// ── Seed data ─────────────────────────────────────────────────────────────────

class _MaintData {
  _MaintData({
    required this.id,
    required this.code,
    required this.title,
    required this.unit,
    required this.cat,
    required this.priority,
    required this.status,
    required this.tenant,
    required this.age,
    this.assignedWorker,
    this.assignedManager,
  });

  final String id;
  final String code;
  final String title;
  final String unit;
  final String cat;
  final String priority;
  String status;
  final String tenant;
  final String age;
  final String? assignedWorker;
  final String? assignedManager;
}

final _kMaint = [
  _MaintData(
    id: 'm1',
    code: 'MR-1001',
    title: 'Leaking kitchen tap',
    unit: 'Unit 4B · Cantonments Court',
    cat: 'Plumbing',
    priority: 'High',
    status: 'New',
    tenant: 'Kwame Mensah',
    age: '2h ago',
  ),
  _MaintData(
    id: 'm2',
    code: 'MR-1002',
    title: 'AC not cooling',
    unit: 'Unit 5A · Cantonments Court',
    cat: 'HVAC',
    priority: 'Medium',
    status: 'In Progress',
    tenant: 'Ama Boateng',
    age: '1d ago',
    assignedWorker: 'Ben (Tech)',
  ),
  _MaintData(
    id: 'm3',
    code: 'MR-1003',
    title: 'Broken window latch',
    unit: 'Unit 7 · Spintex Heights',
    cat: 'Other',
    priority: 'Low',
    status: 'In Progress',
    tenant: 'Efua Sarpong',
    age: '2d ago',
    assignedWorker: 'Ben (Tech)',
    assignedManager: 'Efua Mensah',
  ),
  _MaintData(
    id: 'm4',
    code: 'MR-1004',
    title: 'Hallway lights out',
    unit: 'Block A · Spintex Heights',
    cat: 'Electrical',
    priority: 'High',
    status: 'In Review',
    tenant: 'Front desk',
    age: '3d ago',
    assignedWorker: 'Mensah Electric',
    assignedManager: 'Kwabena Owusu',
  ),
  _MaintData(
    id: 'm5',
    code: 'MR-1005',
    title: 'Repaint guest bath',
    unit: 'Suite 3 · Labadi Beach',
    cat: 'Other',
    priority: 'Low',
    status: 'Resolved',
    tenant: 'Housekeeping',
    age: '5d ago',
    assignedManager: 'Efua Mensah',
  ),
  _MaintData(
    id: 'm6',
    code: 'MR-1006',
    title: 'Gate motor jammed',
    unit: 'Cantonments Court',
    cat: 'Other',
    priority: 'High',
    status: 'New',
    tenant: 'Security',
    age: '4h ago',
  ),
  _MaintData(
    id: 'm7',
    code: 'MR-1007',
    title: 'Water heater fault',
    unit: 'Unit 3B · Cantonments Court',
    cat: 'Plumbing',
    priority: 'Medium',
    status: 'New',
    tenant: 'Yaw Asante',
    age: '6h ago',
  ),
  _MaintData(
    id: 'm8',
    code: 'MR-1008',
    title: 'Fire alarm false-triggering',
    unit: 'Block A · Spintex Heights',
    cat: 'Safety & Fire',
    priority: 'Emergency',
    status: 'New',
    tenant: 'Front desk',
    age: '20m ago',
    assignedWorker: 'Mensah Electric',
  ),
  _MaintData(
    id: 'm9',
    code: 'MR-1009',
    title: 'Squeaky door hinge',
    unit: 'Suite 5 · Labadi Beach',
    cat: 'Other',
    priority: 'Low',
    status: 'Cancelled',
    tenant: 'Housekeeping',
    age: '6d ago',
    assignedManager: 'Kwabena Owusu',
  ),
];

// ── Card ──────────────────────────────────────────────────────────────────────

class _MaintCard extends StatelessWidget {
  const _MaintCard({
    required this.m,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final _MaintData m;
  final void Function(Offset globalPosition) onDragUpdate;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final card = _CardBody(m: m);
    return LongPressDraggable<_MaintData>(
      data: m,
      onDragStarted: () => Haptics.vibrate(HapticsType.selection),
      onDragUpdate: (details) => onDragUpdate(details.globalPosition),
      onDragEnd: (_) => onDragEnd(),
      onDraggableCanceled: (_, _) => onDragEnd(),
      feedback: Material(
        color: Colors.transparent,
        child: SizedBox(
          width: MediaQuery.of(context).size.width - RLTokens.gutter * 2,
          child: Transform.scale(
            scale: 1.03,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(RLTokens.rLg),
                boxShadow: RLTokens.elevFab,
              ),
              child: card,
            ),
          ),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: card),
      child: GestureDetector(
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) context.push('/activity/maintenances/${m.id}');
        },
        child: card,
      ),
    );
  }
}

class _CardBody extends StatelessWidget {
  const _CardBody({required this.m});
  final _MaintData m;

  @override
  Widget build(BuildContext context) {
    final priTone = _priorityTone(m.priority);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RLDot(tone: priTone, size: 8),
              const SizedBox(width: 6),
              Text(
                m.priority,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 11,
                  fontWeight: RLTokens.semibold,
                  color: priTone.fg,
                ),
              ),
              const Spacer(),
              Text(
                m.age,
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 10.5,
                  color: RLTokens.micro,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '#${m.code}',
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            m.title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 17,
              color: RLTokens.ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            m.unit,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 11),
          Container(height: 1, color: RLTokens.hairlineSoft),
          const SizedBox(height: 11),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RLPill(m.cat, tone: RLTone.neutral),
              if (m.assignedWorker != null || m.assignedManager != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (m.assignedWorker != null)
                      _AssigneeAvatar(
                        name: m.assignedWorker!,
                        bg: RLTokens.fill,
                        fg: RLTokens.crimson,
                      ),
                    if (m.assignedWorker != null && m.assignedManager != null)
                      const SizedBox(width: 4),
                    if (m.assignedManager != null)
                      _AssigneeAvatar(
                        name: m.assignedManager!,
                        bg: RLTokens.infoBg,
                        fg: RLTokens.info,
                      ),
                  ],
                )
              else
                const Text(
                  'Unassigned',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    fontWeight: RLTokens.medium,
                    color: RLTokens.crimson,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AssigneeAvatar extends StatelessWidget {
  const _AssigneeAvatar({
    required this.name,
    required this.bg,
    required this.fg,
  });

  final String name;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0].toUpperCase())
        .join();
    return Tooltip(
      message: name,
      child: Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bg,
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Center(
          child: Text(
            initials,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 9,
              fontWeight: RLTokens.semibold,
              color: fg,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Filter chips ─────────────────────────────────────────────────────────────

class _FilterChipsRow extends StatelessWidget {
  const _FilterChipsRow({
    required this.priority,
    required this.category,
    required this.worker,
    required this.manager,
    required this.onTapPriority,
    required this.onTapCategory,
    required this.onTapWorker,
    required this.onTapManager,
  });

  final String? priority;
  final String? category;
  final String? worker;
  final String? manager;
  final VoidCallback onTapPriority;
  final VoidCallback onTapCategory;
  final VoidCallback onTapWorker;
  final VoidCallback onTapManager;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: RLTokens.gutter,
          vertical: 8,
        ),
        child: Row(
          children: [
            _FilterTriggerChip(
              label: 'Priority',
              value: priority,
              onTap: onTapPriority,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Category',
              value: category,
              onTap: onTapCategory,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Assigned Worker',
              value: worker,
              onTap: onTapWorker,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Assigned Manager',
              value: manager,
              onTap: onTapManager,
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterTriggerChip extends StatelessWidget {
  const _FilterTriggerChip({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = value != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? RLTokens.crimsonTint : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rPill),
          border: Border.all(
            color: active ? RLTokens.crimson : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value ?? label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: active ? RLTokens.semibold : RLTokens.medium,
                color: active ? RLTokens.crimson : RLTokens.muted,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: active ? RLTokens.crimson : RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter sheet ──────────────────────────────────────────────────────────────

class _FilterPickResult {
  const _FilterPickResult.select(this.value) : isClear = false;
  const _FilterPickResult.clear() : value = null, isClear = true;

  final String? value;
  final bool isClear;
}

class _FilterSheet extends StatelessWidget {
  const _FilterSheet({
    required this.title,
    required this.options,
    required this.selected,
  });

  final String title;
  final List<String> options;
  final String? selected;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.space4,
                RLTokens.space4,
                RLTokens.space4,
                8,
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 22,
                      color: RLTokens.inkSoft,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Filter by $title',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textBarTitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () =>
                        Navigator.pop(context, const _FilterPickResult.clear()),
                    child: const Text(
                      'Clear',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textSubtitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(
                  horizontal: RLTokens.space4,
                ),
                itemCount: options.length,
                separatorBuilder: (_, _) =>
                    Container(height: 1, color: RLTokens.hairlineSoft),
                itemBuilder: (_, i) {
                  final option = options[i];
                  final isSelected = option == selected;
                  return GestureDetector(
                    onTap: () => Navigator.pop(
                      context,
                      _FilterPickResult.select(option),
                    ),
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              option,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: RLTokens.textBody,
                                color: RLTokens.ink,
                              ),
                            ),
                          ),
                          Icon(
                            isSelected
                                ? Icons.radio_button_checked_rounded
                                : Icons.radio_button_unchecked_rounded,
                            size: 20,
                            color: isSelected
                                ? RLTokens.crimson
                                : RLTokens.hairline,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
          ],
        ),
      ),
    );
  }
}

// ── Status column page ────────────────────────────────────────────────────────

class _StatusColumnPage extends StatelessWidget {
  const _StatusColumnPage({
    required this.status,
    required this.items,
    required this.onAccept,
    required this.onCardDragUpdate,
    required this.onCardDragEnd,
  });

  final String status;
  final List<_MaintData> items;
  final ValueChanged<_MaintData> onAccept;
  final void Function(Offset globalPosition) onCardDragUpdate;
  final VoidCallback onCardDragEnd;

  @override
  Widget build(BuildContext context) {
    final tone = statusTone(status);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: DragTarget<_MaintData>(
        onAcceptWithDetails: (details) => onAccept(details.data),
        builder: (context, candidates, rejects) {
          return Column(
            children: [
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: tone.bg,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      status,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.bold,
                        color: tone.fg,
                      ),
                    ),
                    Text(
                      '${items.length}',
                      style: TextStyle(
                        fontFamily: RLTokens.fontMono,
                        fontSize: 13,
                        fontWeight: RLTokens.bold,
                        color: tone.fg,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: items.isEmpty
                    ? Center(
                        child: Text(
                          'No requests here',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13,
                            color: RLTokens.mutedSoft,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(2, 12, 2, 40),
                        itemCount: items.length,
                        itemBuilder: (_, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _MaintCard(
                            m: items[i],
                            onDragUpdate: onCardDragUpdate,
                            onDragEnd: onCardDragEnd,
                          ),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ── Page dots ─────────────────────────────────────────────────────────────────

class _PageDots extends StatelessWidget {
  const _PageDots({
    required this.count,
    required this.current,
    required this.onTap,
  });

  final int count;
  final int current;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(count, (i) {
          final active = i == current;
          return GestureDetector(
            key: ValueKey('page-dot-$i'),
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? RLTokens.crimson : RLTokens.hairline,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ── Cancel reason sheet ────────────────────────────────────────────────────────

class _CancelReasonSheet extends StatefulWidget {
  const _CancelReasonSheet({required this.title});
  final String title;

  @override
  State<_CancelReasonSheet> createState() => _CancelReasonSheetState();
}

class _CancelReasonSheetState extends State<_CancelReasonSheet> {
  final _controller = TextEditingController();
  bool _touched = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = _controller.text.trim().isEmpty;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          20,
          RLTokens.gutter,
          20,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cancel request',
              style: TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: RLTokens.textCardHead,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.title,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: RLTokens.textSubtitle,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              autofocus: true,
              maxLines: 3,
              onChanged: (_) => setState(() => _touched = true),
              decoration: InputDecoration(
                hintText: 'Reason for cancelling',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                errorText: _touched && isEmpty ? 'A reason is required' : null,
              ),
            ),
            const SizedBox(height: 16),
            RLBtn(
              label: 'Confirm cancellation',
              full: true,
              kind: RLBtnKind.danger,
              onPressed: isEmpty
                  ? null
                  : () => Navigator.pop(context, _controller.text),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Board ─────────────────────────────────────────────────────────────────────

class MaintenanceBoard extends StatefulWidget {
  const MaintenanceBoard({super.key});

  @override
  State<MaintenanceBoard> createState() => _MaintenanceBoardState();
}

class _MaintenanceBoardState extends State<MaintenanceBoard> {
  late final PageController _pageController;
  int _currentPage = 0;
  DateTime? _lastEdgePageTurn;

  String? _priorityFilter;
  String? _categoryFilter;
  String? _workerFilter;
  String? _managerFilter;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.92);
    _pageController.addListener(() {
      final page = _pageController.page;
      if (page == null) return;
      final rounded = page.round();
      if (rounded != _currentPage && mounted) {
        setState(() => _currentPage = rounded);
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<String> get _workerOptions => [
    _kUnassigned,
    ..._kMaint.map((m) => m.assignedWorker).whereType<String>().toSet(),
  ];

  List<String> get _managerOptions => [
    _kUnassigned,
    ..._kMaint.map((m) => m.assignedManager).whereType<String>().toSet(),
  ];

  bool _matchesFilters(_MaintData m) {
    if (_priorityFilter != null && m.priority != _priorityFilter) {
      return false;
    }
    if (_categoryFilter != null && m.cat != _categoryFilter) return false;
    if (_workerFilter != null) {
      final matches = _workerFilter == _kUnassigned
          ? m.assignedWorker == null
          : m.assignedWorker == _workerFilter;
      if (!matches) return false;
    }
    if (_managerFilter != null) {
      final matches = _managerFilter == _kUnassigned
          ? m.assignedManager == null
          : m.assignedManager == _managerFilter;
      if (!matches) return false;
    }
    return true;
  }

  List<_MaintData> _forStatus(String status) =>
      _kMaint.where((m) => m.status == status && _matchesFilters(m)).toList();

  Future<void> _pickFilter({
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onChanged,
  }) async {
    final result = await showModalBottomSheet<_FilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          _FilterSheet(title: title, options: options, selected: selected),
    );
    if (result == null) return;
    setState(() => onChanged(result.isClear ? null : result.value));
  }

  void _handleCardDragUpdate(Offset globalPosition) {
    if (!_pageController.hasClients || _pageController.page == null) return;
    final now = DateTime.now();
    if (_lastEdgePageTurn != null &&
        now.difference(_lastEdgePageTurn!) <
            const Duration(milliseconds: 700)) {
      return;
    }
    final width = MediaQuery.of(context).size.width;
    const edgeZone = 48.0;
    final current = _pageController.page!.round();
    if (globalPosition.dx < edgeZone && current > 0) {
      _lastEdgePageTurn = now;
      _pageController.animateToPage(
        current - 1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else if (globalPosition.dx > width - edgeZone &&
        current < _kStatuses.length - 1) {
      _lastEdgePageTurn = now;
      _pageController.animateToPage(
        current + 1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleCardDragEnd() {
    _lastEdgePageTurn = null;
  }

  void _handleDrop(_MaintData item, String status) {
    if (item.status == status) return;
    if (status == 'Resolved') {
      _confirmResolve(item, status);
    } else if (status == 'Cancelled') {
      _confirmCancel(item, status);
    } else {
      _applyMove(item, status);
    }
  }

  void _applyMove(_MaintData item, String status) {
    Haptics.vibrate(HapticsType.light);
    setState(() => item.status = status);
    _pageController.animateToPage(
      _kStatuses.indexOf(status),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _confirmResolve(_MaintData item, String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Resolved?'),
        content: Text('"${item.title}" will be moved to Resolved.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (confirmed == true) _applyMove(item, status);
  }

  Future<void> _confirmCancel(_MaintData item, String status) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CancelReasonSheet(title: item.title),
    );
    if (!mounted) return;
    if (reason != null && reason.trim().isNotEmpty) {
      _applyMove(item, status);
    }
  }

  void _goToPage(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _FilterChipsRow(
          priority: _priorityFilter,
          category: _categoryFilter,
          worker: _workerFilter,
          manager: _managerFilter,
          onTapPriority: () => _pickFilter(
            title: 'Priority',
            options: _kPriorities,
            selected: _priorityFilter,
            onChanged: (v) => _priorityFilter = v,
          ),
          onTapCategory: () => _pickFilter(
            title: 'Category',
            options: _kCategories,
            selected: _categoryFilter,
            onChanged: (v) => _categoryFilter = v,
          ),
          onTapWorker: () => _pickFilter(
            title: 'Assigned Worker',
            options: _workerOptions,
            selected: _workerFilter,
            onChanged: (v) => _workerFilter = v,
          ),
          onTapManager: () => _pickFilter(
            title: 'Assigned Manager',
            options: _managerOptions,
            selected: _managerFilter,
            onChanged: (v) => _managerFilter = v,
          ),
        ),
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            itemCount: _kStatuses.length,
            itemBuilder: (_, i) {
              final status = _kStatuses[i];
              return _StatusColumnPage(
                status: status,
                items: _forStatus(status),
                onAccept: (item) => _handleDrop(item, status),
                onCardDragUpdate: _handleCardDragUpdate,
                onCardDragEnd: _handleCardDragEnd,
              );
            },
          ),
        ),
        _PageDots(
          count: _kStatuses.length,
          current: _currentPage,
          onTap: _goToPage,
        ),
      ],
    );
  }
}
