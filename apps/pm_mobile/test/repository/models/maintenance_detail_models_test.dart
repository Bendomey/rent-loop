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
        'property_id': 'p1',
        'assets': [
          {
            'id': 'a1',
            'asset_type': 'UNIT',
            'unit_id': 'u1',
            'unit': {'id': 'u1', 'name': 'A1', 'slug': 'a1'},
          },
        ],
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
      expect(model.propertyId, 'p1');
      expect(model.unitAssets, hasLength(1));
      expect(model.unitAssets.first.label, 'A1');
      expect(model.blockAssets, isEmpty);
      expect(model.assetSummary, 'A1');
    });

    test('parses a request covering several units and a block', () {
      final model = MaintenanceRequestModel.fromJson({
        'id': 'mr2',
        'code': 'MULTI',
        'title': 'Riser serving A1-A2 plus the stairwell',
        'category': 'PLUMBING',
        'priority': 'HIGH',
        'status': 'NEW',
        'property_id': 'p1',
        'assets': [
          {
            'id': 'a1',
            'asset_type': 'UNIT',
            'unit_id': 'u1',
            'unit': {'id': 'u1', 'name': 'A1', 'slug': 'a1'},
          },
          {
            'id': 'a2',
            'asset_type': 'UNIT',
            'unit_id': 'u2',
            'unit': {'id': 'u2', 'name': 'A2', 'slug': 'a2'},
          },
          {
            'id': 'a3',
            'asset_type': 'BLOCK',
            'property_block_id': 'b1',
            'property_block': {'id': 'b1', 'name': 'Block A'},
          },
        ],
      });

      expect(model.unitAssets, hasLength(2));
      expect(model.blockAssets, hasLength(1));
      expect(model.blockAssets.first.label, 'Block A');
      expect(model.assetSummary, 'A1 +2');
    });

    test('falls back to the asset type when a relation is not populated', () {
      // The API returns the association even when the relation was not asked
      // for, so a card must never render a blank label.
      final model = MaintenanceRequestModel.fromJson({
        'id': 'mr3',
        'code': 'BARE',
        'title': 'Unpopulated',
        'category': 'OTHER',
        'priority': 'LOW',
        'status': 'NEW',
        'property_id': 'p1',
        'assets': [
          {'id': 'a1', 'asset_type': 'BLOCK', 'property_block_id': 'b1'},
        ],
      });

      expect(model.blockAssets.first.label, 'Block');
      expect(model.assetSummary, 'Block');
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
        'property_id': 'p1',
      });

      expect(model.attachments, isEmpty);
      expect(model.visibility, 'TENANT_VISIBLE');
      // No assets key at all must not throw, and must not render blank.
      expect(model.unitAssets, isEmpty);
      expect(model.blockAssets, isEmpty);
      expect(model.assetSummary, '—');
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
