import 'package:firebase_messaging/firebase_messaging.dart';

/// Holds the notification that cold-started the app (terminated state).
/// Consumed once by the GoRouter redirect after auth completes.
RemoteMessage? pendingNotificationMessage;

/// Returns the deep-link path for a notification message, or null if unhandled.
String? notificationMessageToPath(RemoteMessage message) {
  final type = message.data['type'] as String?;
  switch (type) {
    case 'ANNOUNCEMENT':
      return '/more/announcements';
    case 'MAINTENANCE':
      final mrId = message.data['maintenance_request_id'] as String?;
      return mrId != null ? '/maintenance/$mrId' : '/maintenance';
    case 'INVOICE':
      final invoiceId = message.data['invoice_id'] as String?;
      return invoiceId != null ? '/payments/$invoiceId' : '/payments';
    case 'LEASE':
      return '/more/lease-details';
    case 'CHECKLIST_SUBMITTED':
      final checklistId = message.data['checklist_id'] as String?;
      return checklistId != null
          ? '/unit-condition-reports/$checklistId'
          : '/more/lease-details';
    default:
      return null;
  }
}
