import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

enum AnnouncementType { general, payment, maintenance, urgent }

class AnnouncementItem {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final AnnouncementType type;

  const AnnouncementItem({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    this.type = AnnouncementType.general,
  });
}

class AnnouncementCard extends StatelessWidget {
  final AnnouncementItem announcement;

  const AnnouncementCard({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    final (bgColor, accentColor, icon) = _typeStyle(announcement.type);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Colored top bar + icon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: accentColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    announcement.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: accentColor,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _typeLabel(announcement.type),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: accentColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  announcement.body,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade700,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  DateFormat(
                    'MMM d, yyyy · h:mm a',
                  ).format(announcement.createdAt.toLocal()),
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade400),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, IconData) _typeStyle(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.payment:
        return (
          Colors.green.shade50,
          Colors.green.shade700,
          Icons.payments_outlined,
        );
      case AnnouncementType.maintenance:
        return (
          Colors.blue.shade50,
          Colors.blue.shade700,
          Icons.build_outlined,
        );
      case AnnouncementType.urgent:
        return (
          Colors.red.shade50,
          Colors.red.shade700,
          Icons.warning_amber_outlined,
        );
      case AnnouncementType.general:
        return (
          Colors.orange.shade50,
          Colors.orange.shade700,
          Icons.campaign_outlined,
        );
    }
  }

  String _typeLabel(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.payment:
        return 'Payment';
      case AnnouncementType.maintenance:
        return 'Maintenance';
      case AnnouncementType.urgent:
        return 'Urgent';
      case AnnouncementType.general:
        return 'General';
    }
  }
}
