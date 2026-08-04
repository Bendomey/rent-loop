import 'dart:async';

/// Fired by [AbstractApi] whenever an authenticated request comes back 401,
/// so a single listener can force a logout no matter which screen/notifier
/// made the call. Kept outside Riverpod's `Ref` system because plumbing a
/// `Ref` into every one of the API subclasses just to reach one provider
/// isn't worth the churn — this is the same kind of app-wide side channel
/// as the `appRouter` global in navigation/routes.dart.
class AuthEventBus {
  AuthEventBus._();

  static final AuthEventBus instance = AuthEventBus._();

  final _controller = StreamController<void>.broadcast();

  Stream<void> get onUnauthorized => _controller.stream;

  void notifyUnauthorized() => _controller.add(null);
}
