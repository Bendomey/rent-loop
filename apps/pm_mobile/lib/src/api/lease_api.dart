import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

part 'lease_api.g.dart';

class LeasesPage {
  LeasesPage({required this.rows, required this.meta});

  final List<LeaseModel> rows;
  final PaginationMetaModel meta;
}

class LeaseApi extends AbstractApi {
  LeaseApi({required super.tokenManager});

  /// Lists leases across every property the caller can access — not
  /// property-scoped in the URL (`GET .../clients/{client_id}/leases`), same
  /// cross-property shape as `TenantApi.getTenants()`. [propertyId] narrows
  /// results to one property via the backend's repeatable `property_id`
  /// param (sent as a one-element list). `populate=Unit,Tenant` is always
  /// sent so each row has its nested unit/tenant, matching the web leases
  /// table's `populate: ['Tenant', 'Unit']` call.
  Future<LeasesPage> getLeases({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status, // full dotted Lease.Status.* value, or null for "all"
    String? search,
    String? propertyId,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      'populate': 'Unit,Tenant',
    };
    if (status != null) query['status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'code';
    }

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (propertyId != null) 'property_id': [propertyId],
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/leases?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return LeasesPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => LeaseModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  /// Single-lease fetch — property-scoped in the URL (unlike `getLeases()`),
  /// since `GET .../leases/{lease_id}` needs a `property_id` path segment.
  /// `populate` mirrors the web lease detail page's loader exactly
  /// (`apps/property-manager/app/api/leases/server.ts`) so every field the
  /// detail screen shows (tenant/unit, and the tenant application the
  /// Financial Terms card reads rent/deposit figures and the invoice link
  /// from) is present in one request.
  Future<LeaseModel> getLease({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId'
          '?populate=Tenant,Unit,TenantApplication,TenantApplication.ApplicationPaymentInvoice',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LeaseModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  /// `PATCH .../leases/{lease_id}` — every param optional and only sent when
  /// non-null (same convention as `UnitApi.updateUnit()`), since the backend
  /// distinguishes "field omitted" from "field explicitly cleared" via
  /// `lib.Optional[T]`. Used by the Start Lease flow to set
  /// `utility_transfers_date` before activating, and by the Documents tab's
  /// MANUAL-mode "Done" step to copy the uploaded file's URL onto the lease
  /// record (`leaseAgreementDocumentUrl`).
  Future<void> updateLease({
    required String clientId,
    required String propertyId,
    required String leaseId,
    DateTime? utilityTransfersDate,
    String? leaseAgreementDocumentUrl,
  }) async {
    final body = <String, dynamic>{
      if (utilityTransfersDate != null)
        'utility_transfers_date': utilityTransfersDate.toIso8601String(),
      if (leaseAgreementDocumentUrl != null)
        'lease_agreement_document_url': leaseAgreementDocumentUrl,
    };
    await execute(
      method: 'PATCH',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId',
      body: body,
    );
  }

  /// `PATCH .../leases/{lease_id}/status:active`, no body, 204 — moves a
  /// Pending lease to Active. Only valid once `utility_transfers_date` has
  /// been set (the Start Lease sheet enforces this client-side, mirroring
  /// the web `StartLeaseDialog`).
  Future<void> activateLease({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    await execute(
      method: 'PATCH',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId/status:active',
    );
  }
}

@riverpod
LeaseApi leaseApi(LeaseApiRef ref) =>
    LeaseApi(tokenManager: ref.watch(tokenManagerProvider));
