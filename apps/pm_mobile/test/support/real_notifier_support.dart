import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

class NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

TokenManager fakeTokenManager() => TokenManager(NoStorage());

class SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

class RecordingToast extends RLToastNotifier {
  final shown = <RLToastData>[];

  @override
  void show(
    RLToastData data, {
    Duration duration = const Duration(seconds: 4),
  }) {
    shown.add(data);
  }
}

Future<void> pumpFrames(WidgetTester tester, {int frames = 10}) async {
  for (var i = 0; i < frames; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  await tester.pumpAndSettle();
}

PaginationMetaModel emptyMeta() => PaginationMetaModel(
  total: 0,
  page: 1,
  pageSize: 10,
  hasNextPage: false,
  hasPreviousPage: false,
);
