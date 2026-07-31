import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/session_api.dart';
import 'package:rentloop_manager/src/repository/models/session_model.dart';

part 'sessions_provider.g.dart';

/// Every device currently signed in as the caller, most recently used first.
///
/// Not kept alive: the list goes stale the moment another device signs in or
/// out, so it is re-read whenever the Sessions page is opened rather than
/// cached across visits.
@riverpod
Future<List<SessionModel>> sessions(SessionsRef ref) async {
  return ref.read(sessionApiProvider).getSessions();
}
