import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/announcement_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/announcements_notifier.dart';

part 'post_announcement_notifier.g.dart';

class PostAnnouncementState extends ApiState {
  PostAnnouncementState({
    super.status,
    super.errorMessage,
    this.draftId,
    this.propertyId,
    this.sent = false,
  });

  final String? draftId;
  final String? propertyId;
  final bool sent;
}

@riverpod
class PostAnnouncementNotifier extends _$PostAnnouncementNotifier {
  @override
  PostAnnouncementState build() => PostAnnouncementState();

  Future<void> post({
    required String propertyId,
    required String title,
    required String content,
    required String type,
    required String priority,
    String? propertyBlockId,
    List<String>? targetUnitIds,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = PostAnnouncementState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
        draftId: state.draftId,
        propertyId: state.propertyId,
      );
      return;
    }

    final api = ref.read(announcementApiProvider);
    var draftId = state.draftId;
    final isRetry = draftId != null;
    if (isRetry) propertyId = state.propertyId ?? propertyId;
    state = PostAnnouncementState(
      status: ApiStatus.pending,
      draftId: draftId,
      propertyId: isRetry ? propertyId : null,
    );

    try {
      if (draftId == null) {
        final created = await api.createAnnouncement(
          clientId: clientId,
          propertyId: propertyId,
          title: title,
          content: content,
          type: type,
          priority: priority,
          propertyBlockId: propertyBlockId,
          targetUnitIds: targetUnitIds,
        );
        draftId = created.id;
        state = PostAnnouncementState(
          status: ApiStatus.pending,
          draftId: draftId,
          propertyId: propertyId,
        );
      }
      await api.publishAnnouncement(
        clientId: clientId,
        propertyId: propertyId,
        announcementId: draftId,
      );
      state = PostAnnouncementState(status: ApiStatus.success, sent: true);
      ref.invalidate(announcementsNotifierProvider);
    } on ApiException catch (e) {
      if (isRetry && e.message == 'AnnouncementNotPublishable') {
        state = PostAnnouncementState(status: ApiStatus.success, sent: true);
        ref.invalidate(announcementsNotifierProvider);
        return;
      }
      state = PostAnnouncementState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
        draftId: draftId,
        propertyId: draftId == null ? null : propertyId,
      );
    } catch (_) {
      state = PostAnnouncementState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
        draftId: draftId,
        propertyId: draftId == null ? null : propertyId,
      );
    }
  }

  void reset() => state = PostAnnouncementState();
}
