import 'package:rentloop_go/src/api/announcement.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/announcement_model.dart';

part 'announcements_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<AnnouncementModel>> announcements(
  AnnouncementsRef ref,
  AnnouncementQuery query,
) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return [];
  final result = await ref
      .read(announcementApiProvider)
      .getAnnouncements(leaseId: activeLease.id, query: query);
  return result.rows;
}

/// Fetches limit:1 for the home card and caches the meta total for the badge.
@Riverpod(keepAlive: true)
Future<AnnouncementModel?> latestAnnouncement(LatestAnnouncementRef ref) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return null;
  final result = await ref
      .read(announcementApiProvider)
      .getAnnouncements(
        leaseId: activeLease.id,
        query: const AnnouncementQuery(limit: 1, isUnread: true),
      );
  // Persist the total so the badge can read it without an extra API call.
  ref.read(announcementTotalNotifierProvider.notifier).set(result.meta.total);
  return result.rows.isEmpty ? null : result.rows.first;
}

/// Holds the total announcement count from the last meta response.
@Riverpod(keepAlive: true)
class AnnouncementTotalNotifier extends _$AnnouncementTotalNotifier {
  @override
  int build() => 0;

  void set(int total) => state = total;
}
