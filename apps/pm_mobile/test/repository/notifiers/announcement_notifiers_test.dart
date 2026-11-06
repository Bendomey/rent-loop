import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/announcement_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/announcements_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/post_announcement_notifier.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

AnnouncementModel _ann(String id) => AnnouncementModel(
  id: id,
  title: 't',
  content: 'c',
  type: 'COMMUNITY',
  priority: 'NORMAL',
  status: 'PUBLISHED',
  createdAt: '2024-06-14T00:00:00Z',
);

class _FakeApi extends AnnouncementApi {
  _FakeApi() : super(tokenManager: TokenManager(_NoStorage()));

  int creates = 0;
  int publishes = 0;
  int lists = 0;
  ApiException? createError;
  ApiException? publishError;
  String? lastPublishedId;
  String? lastPublishedPropertyId;

  @override
  Future<AnnouncementsPage> listAnnouncements({
    required String clientId,
    String? propertyId,
    int page = 1,
    int pageSize = 20,
  }) async {
    lists++;
    return AnnouncementsPage(
      rows: [_ann('p$page')],
      meta: PaginationMetaModel(
        total: 2,
        page: page,
        pageSize: pageSize,
        hasNextPage: page == 1,
        hasPreviousPage: page > 1,
      ),
    );
  }

  @override
  Future<AnnouncementModel> createAnnouncement({
    required String clientId,
    required String propertyId,
    required String title,
    required String content,
    required String type,
    required String priority,
    String? propertyBlockId,
    List<String>? targetUnitIds,
  }) async {
    creates++;
    if (createError != null) throw createError!;
    return _ann('draft1');
  }

  @override
  Future<void> publishAnnouncement({
    required String clientId,
    required String propertyId,
    required String announcementId,
  }) async {
    publishes++;
    lastPublishedId = announcementId;
    lastPublishedPropertyId = propertyId;
    if (publishError != null) {
      final e = publishError!;
      publishError = null;
      throw e;
    }
  }
}

class _SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

void main() {
  late _FakeApi api;
  late ProviderContainer container;

  setUp(() {
    api = _FakeApi();
    container = ProviderContainer(
      overrides: [
        announcementApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
      ],
    );
    addTearDown(container.dispose);
  });

  Future<void> settle() => Future<void>.delayed(Duration.zero);

  Future<void> post() => container
      .read(postAnnouncementNotifierProvider.notifier)
      .post(
        propertyId: 'p1',
        title: 't',
        content: 'c',
        type: 'COMMUNITY',
        priority: 'NORMAL',
      );

  test(
    'AnnouncementsNotifier loads, pages, and reloads on invalidate',
    () async {
      final provider = announcementsNotifierProvider(null);
      container.listen(provider, (_, __) {});
      await settle();
      expect(container.read(provider).hasLoaded, isTrue);
      expect(container.read(provider).items, hasLength(1));

      await container.read(provider.notifier).loadNextPage();
      expect(container.read(provider).items, hasLength(2));

      container.invalidate(announcementsNotifierProvider);
      await settle();
      expect(container.read(provider).items, hasLength(1));
    },
  );

  test('post creates then publishes and ends sent', () async {
    container.listen(postAnnouncementNotifierProvider, (_, __) {});
    final list = announcementsNotifierProvider(null);
    container.listen(list, (_, __) {});
    await settle();
    final before = api.lists;

    await post();
    final state = container.read(postAnnouncementNotifierProvider);
    expect(state.sent, isTrue);
    expect(state.status, ApiStatus.success);
    expect(state.draftId, isNull);
    expect(api.creates, 1);
    expect(api.publishes, 1);
    await settle();
    expect(api.lists, greaterThan(before));
  });

  test(
    'publish failure keeps draftId; retry publishes without creating again',
    () async {
      container.listen(postAnnouncementNotifierProvider, (_, __) {});
      api.publishError = ApiException(500, '{"message":"boom"}');

      await post();
      var state = container.read(postAnnouncementNotifierProvider);
      expect(state.status, ApiStatus.failed);
      expect(state.errorMessage, isNotNull);
      expect(state.draftId, 'draft1');
      expect(state.sent, isFalse);

      await post();
      state = container.read(postAnnouncementNotifierProvider);
      expect(api.creates, 1);
      expect(api.publishes, 2);
      expect(api.lastPublishedId, 'draft1');
      expect(state.sent, isTrue);
      expect(state.draftId, isNull);
    },
  );

  test('create failure leaves no draftId', () async {
    container.listen(postAnnouncementNotifierProvider, (_, __) {});
    api.createError = ApiException(422, '{"message":"bad"}');

    await post();
    final state = container.read(postAnnouncementNotifierProvider);
    expect(state.status, ApiStatus.failed);
    expect(state.draftId, isNull);
    expect(state.sent, isFalse);
    expect(api.publishes, 0);
  });

  test('a retry that hits AnnouncementNotPublishable counts as sent', () async {
    container.listen(postAnnouncementNotifierProvider, (_, __) {});
    api.publishError = ApiException(500, '{"errors":{"message":"boom"}}');
    await post();
    expect(container.read(postAnnouncementNotifierProvider).draftId, 'draft1');

    api.publishError = ApiException(
      400,
      '{"errors":{"message":"AnnouncementNotPublishable"}}',
    );
    await post();
    final state = container.read(postAnnouncementNotifierProvider);
    expect(state.sent, isTrue);
    expect(state.status, ApiStatus.success);
    expect(state.draftId, isNull);
    expect(api.creates, 1);
  });

  test(
    'AnnouncementNotPublishable on a first publish is still a failure',
    () async {
      container.listen(postAnnouncementNotifierProvider, (_, __) {});
      api.publishError = ApiException(
        400,
        '{"errors":{"message":"AnnouncementNotPublishable"}}',
      );
      await post();
      final state = container.read(postAnnouncementNotifierProvider);
      expect(state.sent, isFalse);
      expect(state.status, ApiStatus.failed);
      expect(state.draftId, 'draft1');
    },
  );

  test(
    'a retry publishes against the property the draft was made under',
    () async {
      container.listen(postAnnouncementNotifierProvider, (_, __) {});
      api.publishError = ApiException(500, '{"errors":{"message":"boom"}}');
      await post();
      expect(container.read(postAnnouncementNotifierProvider).propertyId, 'p1');

      await container
          .read(postAnnouncementNotifierProvider.notifier)
          .post(
            propertyId: 'other',
            title: 't',
            content: 'c',
            type: 'COMMUNITY',
            priority: 'NORMAL',
          );
      expect(api.lastPublishedPropertyId, 'p1');
    },
  );
}
