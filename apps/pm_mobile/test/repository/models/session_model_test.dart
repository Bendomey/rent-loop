import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/session_model.dart';

/// [ago] is how long before now the session was signed in. [lastUsed] defaults
/// to right now, standing in for a live session whose token has just refreshed
/// — the case where reading `last_used_at` would be misleading.
SessionModel _session({required Duration ago, DateTime? lastUsed}) {
  final now = DateTime.now().toUtc();
  return SessionModel(
    id: 'session-1',
    isCurrent: true,
    signedInAt: now.subtract(ago).toIso8601String(),
    lastUsedAt: (lastUsed ?? now).toIso8601String(),
    expiresAt: now.add(const Duration(days: 30)).toIso8601String(),
  );
}

void main() {
  group('SessionModel.signedInLabel', () {
    test('describes the sign-in moment, not the last refresh', () {
      // The session began three days ago but refreshed its token seconds ago.
      // Reading last_used_at here would claim "just now" for a three-day-old
      // sign-in, which is the whole bug this label exists to avoid.
      final session = _session(ago: const Duration(days: 3));

      expect(session.signedInLabel, 'Signed in 3 days ago');
    });

    test('scales the unit to the age', () {
      expect(
        _session(ago: const Duration(seconds: 20)).signedInLabel,
        'Signed in just now',
      );
      expect(
        _session(ago: const Duration(minutes: 1)).signedInLabel,
        'Signed in 1 minute ago',
      );
      expect(
        _session(ago: const Duration(minutes: 42)).signedInLabel,
        'Signed in 42 minutes ago',
      );
      expect(
        _session(ago: const Duration(hours: 4)).signedInLabel,
        'Signed in 4 hours ago',
      );
      expect(
        _session(ago: const Duration(days: 1)).signedInLabel,
        'Signed in 1 day ago',
      );
      expect(
        _session(ago: const Duration(days: 14)).signedInLabel,
        'Signed in 2 weeks ago',
      );
      expect(
        _session(ago: const Duration(days: 90)).signedInLabel,
        'Signed in 3 months ago',
      );
      expect(
        _session(ago: const Duration(days: 400)).signedInLabel,
        'Signed in 1 year ago',
      );
    });

    test('a future timestamp reads as just now rather than a negative age', () {
      expect(
        _session(ago: const Duration(days: -2)).signedInLabel,
        'Signed in just now',
      );
    });

    test('an unparseable timestamp renders as nothing', () {
      final session = SessionModel(
        id: 'session-1',
        isCurrent: false,
        signedInAt: 'not-a-date',
        lastUsedAt: '2026-07-31T09:00:00Z',
        expiresAt: '2026-08-30T09:00:00Z',
      );

      expect(session.signedInLabel, '');
    });

    test('parses the wire format the backend actually sends', () {
      final session = SessionModel.fromJson({
        'id': 'session-1',
        'is_current': true,
        'signed_in_at': DateTime.now()
            .toUtc()
            .subtract(const Duration(hours: 5))
            .toIso8601String(),
        'last_used_at': '2026-07-31T09:00:00Z',
        'expires_at': '2026-08-30T09:00:00Z',
      });

      expect(session.signedInLabel, 'Signed in 5 hours ago');
    });
  });
}
