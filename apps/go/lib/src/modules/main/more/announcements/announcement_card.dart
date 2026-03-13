import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:rentloop_go/src/repository/models/announcement_model.dart';

class AnnouncementCard extends StatelessWidget {
  final AnnouncementModel announcement;

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
                _PriorityBadge(priority: announcement.priority),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  announcement.content,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade700,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _TypeChip(type: announcement.type, color: accentColor),
                    const Spacer(),
                    Text(
                      _relativeTime(
                        announcement.publishedAt ?? announcement.createdAt,
                      ),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade400,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, IconData) _typeStyle(String type) {
    switch (type.toUpperCase()) {
      case 'MAINTENANCE':
        return (
          Colors.blue.shade50,
          Colors.blue.shade700,
          Icons.build_outlined,
        );
      case 'COMMUNITY':
        return (
          Colors.green.shade50,
          Colors.green.shade700,
          Icons.people_outlined,
        );
      case 'POLICY_CHANGE':
        return (
          Colors.orange.shade50,
          Colors.orange.shade700,
          Icons.policy_outlined,
        );
      case 'EMERGENCY':
        return (
          Colors.red.shade50,
          Colors.red.shade700,
          Icons.warning_amber_outlined,
        );
      default:
        return (
          Colors.orange.shade50,
          Colors.orange.shade700,
          Icons.campaign_outlined,
        );
    }
  }

  String _relativeTime(String? isoDate) {
    if (isoDate == null) return '';
    final date = DateTime.tryParse(isoDate)?.toLocal();
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d, yyyy').format(date);
  }
}

class _PriorityBadge extends StatelessWidget {
  final String priority;
  const _PriorityBadge({required this.priority});

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (priority.toUpperCase()) {
      'URGENT' => (Colors.red, 'URGENT'),
      'IMPORTANT' => (Colors.amber.shade700, 'IMPORTANT'),
      _ => (Colors.grey.shade500, 'NORMAL'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String type;
  final Color color;
  const _TypeChip({required this.type, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        type.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
