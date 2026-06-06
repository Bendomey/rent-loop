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
      iconBg: AppColors.pinkTint,
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
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: _items.length,
          separatorBuilder: (_, __) =>
              const Divider(height: 1, indent: 76, endIndent: 20),
          itemBuilder: (context, index) {
            final item = _items[index];
            final unread = _unreadIndices.contains(index);
            return _NotificationTile(item: item, unread: unread);
          },
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

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item, required this.unread});

  final _NotificationItem item;
  final bool unread;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
        child: Row(
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
                      if (unread) ...[
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
        ),
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
