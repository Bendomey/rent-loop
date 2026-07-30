/// Placeholder data for the parts of My Account that have no API yet:
/// sessions, the email-verified badge and the password last-changed date.
/// Replace each of these with real data when the corresponding endpoints
/// land — nothing here is wired to the backend.
///
/// Three actions are deliberately not built yet — two-factor auth, email
/// updates and account deletion. Their controls stay visible and show a
/// "coming soon" toast instead of opening anything, matching the web
/// portal (apps/property-manager Settings › My Account).
library;

enum SessionKind { laptop, phone, tablet }

class AccountSession {
  const AccountSession({
    required this.id,
    required this.device,
    required this.os,
    required this.where,
    required this.ip,
    required this.last,
    required this.kind,
    this.current = false,
  });

  final String id;
  final String device;
  final String os;
  final String where;
  final String ip;
  final String last;
  final SessionKind kind;
  final bool current;
}

const List<AccountSession> kPlaceholderSessions = [
  AccountSession(
    id: 's1',
    device: 'MacBook Pro · Chrome',
    os: 'macOS 15.3',
    where: 'Accra, Ghana',
    ip: '154.160.22.14',
    last: 'Active now',
    kind: SessionKind.laptop,
    current: true,
  ),
  AccountSession(
    id: 's2',
    device: 'iPhone 16 Pro Max · Rentloop app',
    os: 'iOS 19.1',
    where: 'Accra, Ghana',
    ip: '41.66.208.7',
    last: '2 hours ago',
    kind: SessionKind.phone,
  ),
  AccountSession(
    id: 's3',
    device: 'iPad Air · Safari',
    os: 'iPadOS 19',
    where: 'Tema, Ghana',
    ip: '41.66.190.55',
    last: 'Yesterday, 18:22',
    kind: SessionKind.tablet,
  ),
  AccountSession(
    id: 's4',
    device: 'Windows PC · Edge',
    os: 'Windows 11',
    where: 'Kumasi, Ghana',
    ip: '102.176.14.90',
    last: '12 Jul 2026',
    kind: SessionKind.laptop,
  ),
];

const bool kPlaceholderEmailVerified = true;
const String kPlaceholderPasswordChanged = '4 Mar 2026';
