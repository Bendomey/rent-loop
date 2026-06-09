import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Data ──────────────────────────────────────────────────────────────────────

class _Member {
  const _Member({
    required this.name,
    required this.role,
    required this.email,
    required this.status,
  });
  final String name;
  final String role;
  final String email;
  final String status;
}

const _kMembers = [
  _Member(name: 'Delppy123',       role: 'Admin', email: 'business@delppy123.com',         status: 'Active'),
  _Member(name: 'Jane Doe',         role: 'Admin', email: 'rentloopapp@gmail.com',           status: 'Active'),
  _Member(name: 'test',             role: 'Admin', email: 'test@gmail.com',                  status: 'Inactive'),
  _Member(name: 'Gideon Bempong',   role: 'Admin', email: 'gideonbempong533+1@gmail.com',   status: 'Active'),
  _Member(name: 'Emmanuel Baidoo',  role: 'Staff', email: 'ebaidoo79@gmail.com',             status: 'Active'),
  _Member(name: 'Edward Adjei',     role: 'Staff', email: 'edd.net49@gmail.com',             status: 'Active'),
  _Member(name: 'Ned Kelly',        role: 'Admin', email: 'nedkelly205@gmail.com',           status: 'Active'),
  _Member(name: 'Delali',           role: 'Staff', email: 'michaelsavior5@gmail.com',        status: 'Active'),
];

const _kFilters = ['All', 'Admin', 'Staff', 'Active', 'Inactive'];

// ── Screen ────────────────────────────────────────────────────────────────────

class MembersScreen extends StatefulWidget {
  const MembersScreen({super.key});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  String _filter = 'All';

  List<_Member> get _filtered {
    if (_filter == 'All') return _kMembers;
    if (_filter == 'Admin' || _filter == 'Staff') {
      return _kMembers.where((m) => m.role == _filter).toList();
    }
    return _kMembers.where((m) => m.status == _filter).toList();
  }

  void _goAdd() {
    Haptics.vibrate(HapticsType.selection);
    context.push('/more/members/add');
  }

  @override
  Widget build(BuildContext context) {
    final members = _filtered;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'Members',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
                trailing: GestureDetector(
                  onTap: _goAdd,
                  child: const Padding(
                    padding: EdgeInsets.all(9),
                    child: Icon(Icons.add_rounded,
                        size: 22, color: RLTokens.ink),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Manage members',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 25,
                          color: RLTokens.ink,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'These members have access to your workspace.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Search bar
                      RLSearchBar(hint: 'Search members…'),
                      const SizedBox(height: 12),
                      // Filter chips
                      RLFilterChips(
                        options: _kFilters,
                        selected: _filter,
                        onSelect: (f) {
                          Haptics.vibrate(HapticsType.selection);
                          setState(() => _filter = f);
                        },
                      ),
                      // Members list
                      RLLabel('${members.length} member${members.length == 1 ? '' : 's'}'),
                      if (members.isEmpty)
                        _EmptyState()
                      else
                        RLCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            children: members
                                .asMap()
                                .entries
                                .map((e) => _MemberRow(
                                      member: e.value,
                                      isLast: e.key == members.length - 1,
                                    ))
                                .toList(),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // FAB
          Positioned(
            left: 20,
            right: 20,
            bottom: 30,
            child: RLFAB(
              label: 'Add member',
              icon: Icons.add_rounded,
              onPressed: _goAdd,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Member row ────────────────────────────────────────────────────────────────

class _MemberRow extends StatelessWidget {
  const _MemberRow({required this.member, required this.isLast});
  final _Member member;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final isActive = member.status == 'Active';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        children: [
          RLAvatar(member.name),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        member.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        border: Border.all(color: RLTokens.hairline),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        member.role.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 9,
                          fontWeight: RLTokens.bold,
                          letterSpacing: 0.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  member.email,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            children: [
              RLDot(
                tone: isActive ? RLTone.success : RLTone.danger,
                size: 7,
              ),
              const SizedBox(width: 5),
              Text(
                member.status,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  fontWeight: RLTokens.semibold,
                  color: isActive ? RLTokens.success : RLTokens.crimson,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(Icons.group_outlined,
                size: 26, color: RLTokens.mutedSoft),
          ),
          const SizedBox(height: 12),
          const Text(
            'No members found',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 16,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 5),
          const Text(
            'Try a different filter or add your first member.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
