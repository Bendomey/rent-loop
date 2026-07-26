import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_activity_log_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_comment_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_expense_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

void main() {
  group('MaintenanceRequestModel detail fields', () {
    test('parses attachments, visibility, lease and reviewed_at', () {
      final model = MaintenanceRequestModel.fromJson({
        'id': 'mr1',
        'code': '260359RZMG',
        'title': 'Leaking kitchen tap',
        'category': 'PLUMBING',
        'priority': 'HIGH',
        'status': 'IN_REVIEW',
        'unit_id': 'u1',
        'lease_id': 'l1',
        'attachments': ['https://cdn.test/a.jpg', 'https://cdn.test/b.pdf'],
        'visibility': 'INTERNAL_ONLY',
        'reviewed_at': '2026-03-16T11:52:00Z',
      });

      expect(model.attachments, hasLength(2));
      expect(model.attachments.first, 'https://cdn.test/a.jpg');
      expect(model.visibility, 'INTERNAL_ONLY');
      expect(model.leaseId, 'l1');
      expect(model.reviewedAt, '2026-03-16T11:52:00Z');
    });

    test('defaults attachments and visibility when the API omits them', () {
      // The list endpoint drops empty arrays and older payloads predate the
      // visibility column — neither may produce a null the UI has to guard.
      final model = MaintenanceRequestModel.fromJson({
        'id': 'mr1',
        'code': 'ABC',
        'title': 'No extras',
        'category': 'OTHER',
        'priority': 'LOW',
        'status': 'NEW',
        'unit_id': 'u1',
      });

      expect(model.attachments, isEmpty);
      expect(model.visibility, 'TENANT_VISIBLE');
      expect(model.leaseId, isNull);
    });
  });

  group('MaintenanceActivityLogModel', () {
    test('parses the performer from the nested client-user shape', () {
      final log = MaintenanceActivityLogModel.fromJson({
        'id': 'log1',
        'maintenance_request_id': 'mr1',
        'action': 'STATUS_CHANGED',
        'description': 'Changed from In Review to Resolved',
        'performed_by_client_user': {
          'id': 'cu1',
          'user': {'name': 'Benjamin Domey'},
        },
        'metadata': {'from': 'IN_REVIEW', 'to': 'RESOLVED'},
        'created_at': '2026-03-16T12:08:00Z',
      });

      expect(log.action, 'STATUS_CHANGED');
      expect(log.performedByClientUser?.name, 'Benjamin Domey');
      expect(log.metadata?['to'], 'RESOLVED');
    });

    test('tolerates a system entry with no performer and no description', () {
      final log = MaintenanceActivityLogModel.fromJson({
        'id': 'log2',
        'maintenance_request_id': 'mr1',
        'action': 'CREATED',
      });

      expect(log.performedByClientUser, isNull);
      expect(log.description, isNull);
      expect(log.metadata, isNull);
    });
  });

  group('MaintenanceCommentModel', () {
    test('parses content and the nested author', () {
      final comment = MaintenanceCommentModel.fromJson({
        'id': 'c1',
        'maintenance_request_id': 'mr1',
        'content': 'Sending Ben over this afternoon.',
        'created_by_client_user_id': 'cu1',
        'created_by_client_user': {
          'id': 'cu1',
          'user': {'name': 'Akosua Owusu'},
        },
        'created_at': '2026-03-23T11:03:00Z',
      });

      expect(comment.content, 'Sending Ben over this afternoon.');
      expect(comment.createdByClientUser?.name, 'Akosua Owusu');
    });
  });

  group('MaintenanceExpenseModel', () {
    test('parses a major-unit amount with its currency', () {
      final expense = MaintenanceExpenseModel.fromJson({
        'id': 'e1',
        'code': 'EXP-2603-000001',
        'description': 'Labour and materials',
        'amount': 250.75,
        'currency': 'GHS',
        'created_at': '2026-03-16T12:00:00Z',
      });

      expect(expense.amount, 250.75);
      expect(expense.currency, 'GHS');
      expect(expense.code, 'EXP-2603-000001');
    });
  });
}
