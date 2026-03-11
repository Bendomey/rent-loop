import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'announcement_card.dart';

// Placeholder data — replace with API-fetched list when endpoint is available.
final _placeholderAnnouncements = [
  AnnouncementItem(
    id: '1',
    title: 'Rent Due Reminder',
    body:
        'Your rent for June is due in 5 days. Please ensure timely payment to avoid late fees.',
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    type: AnnouncementType.payment,
  ),
  AnnouncementItem(
    id: '2',
    title: 'Water Maintenance',
    body:
        'Scheduled water maintenance will be carried out on Saturday, 10 AM – 2 PM. Please store enough water in advance.',
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
    type: AnnouncementType.maintenance,
  ),
  AnnouncementItem(
    id: '3',
    title: 'Gate Access Update',
    body:
        'The main gate access code has been updated. Please visit the office to collect your new code.',
    createdAt: DateTime.now().subtract(const Duration(days: 3)),
    type: AnnouncementType.urgent,
  ),
  AnnouncementItem(
    id: '4',
    title: 'Welcome to Rentloop',
    body:
        'Welcome to your new home! Feel free to reach out to management for any questions or concerns.',
    createdAt: DateTime.now().subtract(const Duration(days: 14)),
    type: AnnouncementType.general,
  ),
];

class AnnouncementsScreen extends StatelessWidget {
  const AnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final announcements = _placeholderAnnouncements;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: announcements.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.notifications_none_outlined,
                      size: 72,
                      color: Colors.grey.shade300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No announcements yet',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your property manager\'s announcements will appear here.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade500,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: announcements.length,
              itemBuilder: (context, index) =>
                  AnnouncementCard(announcement: announcements[index]),
            ),
    );
  }
}
