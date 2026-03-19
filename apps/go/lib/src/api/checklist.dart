import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/checklist_model.dart';

part 'checklist.g.dart';

class ChecklistApi extends AbstractApi {
  ChecklistApi({required super.tokenManager});

  Future<List<LeaseChecklistModel>> getChecklists({
    required String leaseId,
    String? status,
  }) async {
    final query = status != null ? '?status=$status' : '';
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/checklists$query',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = (data['rows'] as List<dynamic>)
        .map((e) => LeaseChecklistModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return rows;
  }

  Future<LeaseChecklistModel> getChecklist({
    required String leaseId,
    required String checklistId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/leases/$leaseId/checklists/$checklistId?populate=Items,Acknowledgments',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LeaseChecklistModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> acknowledgeChecklist({
    required String leaseId,
    required String checklistId,
    required String action,
    String? comment,
  }) async {
    await execute(
      method: 'POST',
      path: '/api/v1/leases/$leaseId/checklists/$checklistId/acknowledge',
      body: {
        'action': action,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
    );
  }
}

@riverpod
ChecklistApi checklistApi(ChecklistApiRef ref) {
  return ChecklistApi(tokenManager: ref.watch(tokenManagerProvider));
}
