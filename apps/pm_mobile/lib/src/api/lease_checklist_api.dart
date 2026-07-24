import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';

part 'lease_checklist_api.g.dart';

/// Inspection reports (Move-In/Move-Out/Routine) — list + full CRUD on the
/// checklist and its items, mirroring `apps/property-manager`'s
/// lease-checklists API. Acknowledging/disputing a submitted report is a
/// tenant-side (`apps/go`) action, never called from here.
class LeaseChecklistApi extends AbstractApi {
  LeaseChecklistApi({required super.tokenManager});

  String _base({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) =>
      '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId/checklists';

  Future<List<LeaseChecklistModel>> getChecklists({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '${_base(clientId: clientId, propertyId: propertyId, leaseId: leaseId)}'
          '?populate=Items,Acknowledgments',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return (data['rows'] as List<dynamic>)
        .map((e) => LeaseChecklistModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// `POST .../checklists` with an empty `checklist_items` array — the
  /// backend auto-populates items server-side depending on [type] (CHECK_IN
  /// seeds a template's items, CHECK_OUT copies the lease's CHECK_IN items,
  /// ROUTINE starts empty), so the returned checklist may already be
  /// non-empty. Caller should re-fetch the list (`getChecklists`) rather
  /// than trust this response to have `items` populated.
  Future<LeaseChecklistModel> createChecklist({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String type,
  }) async {
    final response = await execute(
      method: 'POST',
      path: _base(clientId: clientId, propertyId: propertyId, leaseId: leaseId),
      body: {'type': type, 'checklist_items': []},
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LeaseChecklistModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  /// `POST .../checklists/{id}/submit`, no body, 204. Backend rejects
  /// (400 `ChecklistCannotBeSubmitted`) unless DRAFT/DISPUTED, and (400
  /// `ChecklistItemsNotFilled`) if any item is still PENDING.
  Future<void> submitChecklist({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String checklistId,
  }) async {
    await execute(
      method: 'POST',
      path:
          '${_base(clientId: clientId, propertyId: propertyId, leaseId: leaseId)}/$checklistId/submit',
    );
  }

  Future<LeaseChecklistItemModel> createItem({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String description,
    required String status,
    String? notes,
  }) async {
    final response = await execute(
      method: 'POST',
      path:
          '${_base(clientId: clientId, propertyId: propertyId, leaseId: leaseId)}/$checklistId/items',
      body: {
        'description': description,
        'status': status,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LeaseChecklistItemModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  /// `PATCH .../checklists/{id}/items/{itemId}` — every param optional and
  /// only sent when non-null, same convention as `UnitApi.updateUnit()`.
  Future<LeaseChecklistItemModel> updateItem({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String itemId,
    String? description,
    String? status,
    String? notes,
  }) async {
    final response = await execute(
      method: 'PATCH',
      path:
          '${_base(clientId: clientId, propertyId: propertyId, leaseId: leaseId)}/$checklistId/items/$itemId',
      body: {
        if (description != null) 'description': description,
        if (status != null) 'status': status,
        if (notes != null) 'notes': notes,
      },
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LeaseChecklistItemModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  Future<void> deleteItem({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String itemId,
  }) async {
    await execute(
      method: 'DELETE',
      path:
          '${_base(clientId: clientId, propertyId: propertyId, leaseId: leaseId)}/$checklistId/items/$itemId',
    );
  }
}

@riverpod
LeaseChecklistApi leaseChecklistApi(LeaseChecklistApiRef ref) =>
    LeaseChecklistApi(tokenManager: ref.watch(tokenManagerProvider));
