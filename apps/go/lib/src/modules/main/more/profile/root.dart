import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(currentUserNotifierProvider);
    final tenant = account?.tenant;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: tenant == null
          ? const Center(child: Text('No profile found.'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Avatar + name header
                Center(
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.grey.shade100,
                        backgroundImage: tenant.profilePhotoUrl != null
                            ? NetworkImage(tenant.profilePhotoUrl!)
                            : null,
                        child: tenant.profilePhotoUrl == null
                            ? Text(
                                '${tenant.firstName[0]}${tenant.lastName[0]}',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${tenant.firstName} ${tenant.otherNames != null ? '${tenant.otherNames} ' : ''}${tenant.lastName}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (account?.phoneNumber != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          account!.phoneNumber,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                _SectionCard(
                  title: 'Personal',
                  children: [
                    if (tenant.email != null)
                      _DetailRow(
                        icon: Icons.email_outlined,
                        label: 'Email',
                        value: tenant.email!,
                      ),
                    if (tenant.dateOfBirth != null)
                      _DetailRow(
                        icon: Icons.cake_outlined,
                        label: 'Date of Birth',
                        value: _formatDate(tenant.dateOfBirth!),
                      ),
                    if (tenant.gender != null)
                      _DetailRow(
                        icon: Icons.person_outline,
                        label: 'Gender',
                        value: _capitalize(tenant.gender!),
                      ),
                    if (tenant.nationality != null)
                      _DetailRow(
                        icon: Icons.flag_outlined,
                        label: 'Nationality',
                        value: tenant.nationality!,
                      ),
                    if (tenant.maritalStatus != null)
                      _DetailRow(
                        icon: Icons.favorite_border,
                        label: 'Marital Status',
                        value: _capitalize(tenant.maritalStatus!),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                _SectionCard(
                  title: 'Employment',
                  children: [
                    if (tenant.occupation != null)
                      _DetailRow(
                        icon: Icons.work_outline,
                        label: 'Occupation',
                        value: tenant.occupation!,
                      ),
                    if (tenant.employer != null)
                      _DetailRow(
                        icon: Icons.business_outlined,
                        label: 'Employer',
                        value: tenant.employer!,
                      ),
                    if (tenant.occupationAddress != null)
                      _DetailRow(
                        icon: Icons.location_on_outlined,
                        label: 'Work Address',
                        value: tenant.occupationAddress!,
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                _SectionCard(
                  title: 'Identification',
                  children: [
                    if (tenant.idType != null)
                      _DetailRow(
                        icon: Icons.badge_outlined,
                        label: 'ID Type',
                        value: _formatIdType(tenant.idType!),
                      ),
                    if (tenant.idNumber != null)
                      _DetailRow(
                        icon: Icons.numbers,
                        label: 'ID Number',
                        value: tenant.idNumber!,
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                _SectionCard(
                  title: 'Emergency Contact',
                  children: [
                    if (tenant.emergencyContactName != null)
                      _DetailRow(
                        icon: Icons.person_outline,
                        label: 'Name',
                        value: tenant.emergencyContactName!,
                      ),
                    if (tenant.emergencyContactPhone != null)
                      _DetailRow(
                        icon: Icons.phone_outlined,
                        label: 'Phone',
                        value: tenant.emergencyContactPhone!,
                      ),
                    if (tenant.relationshipToEmergencyContact != null)
                      _DetailRow(
                        icon: Icons.people_outline,
                        label: 'Relationship',
                        value: _capitalize(
                          tenant.relationshipToEmergencyContact!,
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}';
  }

  String _formatIdType(String type) {
    return type.replaceAll('_', ' ').split(' ').map(_capitalize).join(' ');
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    final visible = children.where((c) => c is! SizedBox).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            itemCount: children.length,
            separatorBuilder: (_, __) =>
                Divider(height: 0, color: Colors.grey.shade100),
            itemBuilder: (_, i) => children[i],
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade500),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
          ),
          const SizedBox(width: 16),
          _FadingScrollValue(
            value: value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _FadingScrollValue extends StatefulWidget {
  final String value;
  final TextStyle? style;

  const _FadingScrollValue({required this.value, this.style});

  @override
  State<_FadingScrollValue> createState() => _FadingScrollValueState();
}

class _FadingScrollValueState extends State<_FadingScrollValue> {
  late final ScrollController _ctrl;
  bool _fadeLeft = false;
  bool _fadeRight = false;

  @override
  void initState() {
    super.initState();
    _ctrl = ScrollController();
    _ctrl.addListener(_update);
    WidgetsBinding.instance.addPostFrameCallback((_) => _update());
  }

  void _update() {
    if (!_ctrl.hasClients) return;
    final max = _ctrl.position.maxScrollExtent;
    final pos = _ctrl.offset;
    setState(() {
      // reverse: true — offset 0 = right end of content
      _fadeLeft = pos < max; // overflow to the left
      _fadeRight = pos > 0; // user scrolled, content to the right
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 180),
      child: Stack(
        children: [
          SingleChildScrollView(
            controller: _ctrl,
            scrollDirection: Axis.horizontal,
            reverse: true,
            child: Text(widget.value, maxLines: 1, style: widget.style),
          ),
          if (_fadeLeft)
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: IgnorePointer(
                child: Container(
                  width: 24,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      colors: [Colors.white.withValues(alpha: 0), Colors.white],
                    ),
                  ),
                ),
              ),
            ),
          if (_fadeRight)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: IgnorePointer(
                child: Container(
                  width: 24,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [Colors.white.withValues(alpha: 0), Colors.white],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
