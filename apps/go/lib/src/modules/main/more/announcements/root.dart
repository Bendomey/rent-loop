import 'package:flutter/material.dart';
import 'package:rentloop_go/src/api/announcement.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/announcement_model.dart';
import 'package:rentloop_go/src/repository/providers/announcements_provider.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'announcement_card.dart';

class AnnouncementsScreen extends ConsumerStatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  ConsumerState<AnnouncementsScreen> createState() =>
      _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends ConsumerState<AnnouncementsScreen> {
  final Set<String> _readIds = {};
  static const _query = AnnouncementQuery();

  void _markAsReadIfNeeded(AnnouncementModel announcement) {
    if (_readIds.contains(announcement.id)) return;
    _readIds.add(announcement.id);
    ref
        .read(announcementApiProvider)
        .markAsRead(announcement.id)
        .catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final announcementsAsync = ref.watch(announcementsProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: announcementsAsync.when(
        loading: () => _buildShimmer(),
        error: (_, __) => _buildError(),
        data: (announcements) => announcements.isEmpty
            ? _buildEmpty(context)
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: announcements.length,
                itemBuilder: (context, index) {
                  final announcement = announcements[index];
                  return VisibilityDetector(
                    key: Key('announcement-${announcement.id}'),
                    onVisibilityChanged: (info) {
                      if (info.visibleFraction >= 0.5) {
                        _markAsReadIfNeeded(announcement);
                      }
                    },
                    child: AnnouncementCard(announcement: announcement),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 130,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off_outlined,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load announcements',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => ref.invalidate(announcementsProvider(_query)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
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
              "Your property manager's announcements will appear here.",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade500,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
