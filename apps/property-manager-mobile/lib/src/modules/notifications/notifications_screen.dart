import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _items = <_NotificationItem>[
    _NotificationItem(
      icon: Icons.payments_rounded,
      iconBg: Color(0xFFE1F5E8),
      iconColor: Color(0xFF2A9D5C),
      title: 'Payment received',
      subtitle: 'Kwame Mensah paid GH₵ 4,200 — Unit 4B',
      time: '12m',
      unread: true,
    ),
    _NotificationItem(
      icon: Icons.build_rounded,
      iconBg: AppColors.pinkTintStrong,
      iconColor: AppColors.primary,
      title: 'New maintenance request',
      subtitle: 'Leaking kitchen tap — Unit 4B. High priority',
      time: '2h',
      unread: true,
    ),
    _NotificationItem(
      icon: Icons.assignment_rounded,
      iconBg: Color(0xFFE3F0FF),
      iconColor: Color(0xFF3B7DD8),
      title: 'New application',
      subtitle: 'Adjoa Frimpong applied for Unit 1C',
      time: '5h',
      unread: true,
    ),
    _NotificationItem(
      icon: Icons.event_available_rounded,
      iconBg: Color(0xFFE3F0FF),
      iconColor: Color(0xFF3B7DD8),
      title: 'Booking confirmed',
      subtitle: 'Sarah Addae · Suite 4 · Jun 8–11',
      time: '1d',
    ),
    _NotificationItem(
      icon: Icons.notifications_active_rounded,
      iconBg: AppColors.dangerBg,
      iconColor: AppColors.danger,
      title: 'Invoice overdue',
      subtitle: 'INV-2041 · Ama Boateng · GH₵ 4,200',
      time: '1d',
    ),
    _NotificationItem(
      icon: Icons.check_circle_rounded,
      iconBg: Color(0xFFE1F5E8),
      iconColor: Color(0xFF2A9D5C),
      title: 'Lease activated',
      subtitle: 'Selorm Kudo · Unit 9 · Spintex Heights',
      time: '2d',
    ),
  ];

  late final Set<int> _unreadIndices = {
    for (var i = 0; i < _items.length; i++)
      if (_items[i].unread) i,
  };

  void _markAllRead() {
    setState(() => _unreadIndices.clear());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Notifications'),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _unreadIndices.isEmpty ? null : _markAllRead,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              textStyle: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            child: const Text('Read all'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (int i = 0; i < _items.length; i++) ...[
                    if (_unreadIndices.contains(i))
                      _UnreadCard(item: _items[i])
                    else
                      _ReadRow(item: _items[i]),
                    if (i < _items.length - 1) ...[
                      if (_unreadIndices.contains(i) ||
                          _unreadIndices.contains(i + 1))
                        const SizedBox(height: 8)
                      else
                        const SizedBox(height: 4),
                    ],
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationItem {
  const _NotificationItem({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.time,
    this.unread = false,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String time;
  final bool unread;
}

class _NotificationContent extends StatelessWidget {
  const _NotificationContent({required this.item, required this.showDot});

  final _NotificationItem item;
  final bool showDot;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: item.iconBg,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: Icon(item.icon, color: item.iconColor, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    item.time,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (showDot) ...[
                    const SizedBox(width: 6),
                    const _UnreadDot(),
                  ],
                ],
              ),
              const SizedBox(height: 2),
              Text(
                item.subtitle,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _UnreadCard extends StatelessWidget {
  const _UnreadCard({required this.item});
  final _NotificationItem item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pinkTint,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {},
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(14),
          ),
          child: _NotificationContent(item: item, showDot: true),
        ),
      ),
    );
  }
}

class _ReadRow extends StatelessWidget {
  const _ReadRow({required this.item});
  final _NotificationItem item;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        child: _NotificationContent(item: item, showDot: false),
      ),
    );
  }
}

class _UnreadDot extends StatelessWidget {
  const _UnreadDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      margin: const EdgeInsets.only(top: 6),
      decoration: const BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
      ),
    );
  }
}
