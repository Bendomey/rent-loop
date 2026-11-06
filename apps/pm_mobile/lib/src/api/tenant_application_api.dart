import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

part 'tenant_application_api.g.dart';

class TenantApplicationsPage {
  TenantApplicationsPage({required this.rows, required this.meta});

  final List<TenantApplicationModel> rows;
  final PaginationMetaModel meta;
}

class TenantApplicationApi extends AbstractApi {
  TenantApplicationApi({required super.tokenManager});

  /// Everything the checklist reads. Preloading all three keeps each card's
  /// progress bar computable from the list response alone — no per-row fetch.
  static const _populate =
      'DesiredUnit,LeaseAgreementDocument,LeaseAgreementDocumentSignatures';

  static const _detailPopulate =
      'DesiredUnit,CreatedBy,CreatedBy.User,CompletedBy,CancelledBy,'
      'LeaseAgreementDocument,LeaseAgreementDocumentSignatures';

  static String _base(String clientId, String propertyId) =>
      '/api/v1/admin/clients/$clientId/properties/$propertyId'
      '/tenant-applications';

  TenantApplicationModel _parseApplication(String body) =>
      TenantApplicationModel.fromJson(
        (jsonDecode(body) as Map<String, dynamic>)['data']
            as Map<String, dynamic>,
      );

  Future<TenantApplicationModel> getApplication({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '${_base(clientId, propertyId)}/$id'
          '?${Uri(queryParameters: {'populate': _detailPopulate}).query}',
    );
    return _parseApplication(response.body);
  }

  Future<TenantApplicationModel> createApplication({
    required String clientId,
    required String propertyId,
    required CreateTenantApplicationInput input,
  }) async {
    final response = await execute(
      method: 'POST',
      path: _base(clientId, propertyId),
      body: input.toJson(),
    );
    return _parseApplication(response.body);
  }

  /// [patch] goes out verbatim: an explicit `null` is how the backend's
  /// optional fields are cleared, so nothing here may strip them.
  Future<TenantApplicationModel> updateApplication({
    required String clientId,
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
  }) async {
    final response = await execute(
      method: 'PATCH',
      path: '${_base(clientId, propertyId)}/$id',
      body: patch,
    );
    return _parseApplication(response.body);
  }

  Future<void> cancelApplication({
    required String clientId,
    required String propertyId,
    required String id,
    required String reason,
  }) async {
    await execute(
      method: 'PATCH',
      path: '${_base(clientId, propertyId)}/$id/cancel',
      body: {'reason': reason},
    );
  }

  Future<void> inviteTenant({
    required String clientId,
    required String propertyId,
    required String unitId,
    String? email,
    String? phone,
  }) async {
    await execute(
      method: 'POST',
      path: '${_base(clientId, propertyId)}/invite',
      body: {
        'unit_id': unitId,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
      },
    );
  }

  /// Unauthenticated endpoint; a 404 just means no tenant has that number.
  Future<TenantLookupModel?> lookupTenantByPhone(String e164) async {
    try {
      final response = await execute(
        method: 'GET',
        path: '/api/v1/tenants/phone/${Uri.encodeComponent(e164)}',
        authRequired: false,
      );
      return TenantLookupModel.fromJson(
        (jsonDecode(response.body) as Map<String, dynamic>)['data']
            as Map<String, dynamic>,
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  /// `GET .../tenant-applications` — the cross-property "mobile" route
  /// (`ListTenantApplicationsAcrossProperties`), for the Activity tab, which is
  /// not scoped to one property. [statusLabel] is a display label (e.g. "In
  /// Progress"), converted to the API enum internally.
  ///
  /// Note the sort params are `order`/`order_by`: that is what
  /// `lib.GenerateQuery` reads, not the `sort`/`sort_by` of the web's
  /// client-side sorter object. [search] must be sent together with
  /// `search_fields` — the backend ignores either without the other.
  Future<TenantApplicationsPage> getTenantApplications({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? statusLabel,
    String? gender,
    String? maritalStatus,
    List<String> propertyIds = const [],
    List<String> desiredUnitIds = const [],
    String? search,
    String orderBy = 'created_at',
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      'populate': _populate,
      'order': 'desc',
      'order_by': orderBy,
    };
    if (statusLabel != null) {
      query['status'] = applicationStatusApiValue(statusLabel);
    }
    if (gender != null) {
      query['gender'] = applicationGenderApiValue(gender);
    }
    if (maritalStatus != null) {
      query['marital_status'] = applicationMaritalStatusApiValue(maritalStatus);
    }
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'first_name,last_name,email,phone';
    }

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (propertyIds.isNotEmpty) 'property_id': propertyIds,
        if (desiredUnitIds.isNotEmpty) 'desired_unit_id': desiredUnitIds,
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/tenant-applications?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return TenantApplicationsPage(
      rows: (data['rows'] as List<dynamic>)
          .map(
            (e) => TenantApplicationModel.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }
}

@riverpod
TenantApplicationApi tenantApplicationApi(TenantApplicationApiRef ref) =>
    TenantApplicationApi(tokenManager: ref.watch(tokenManagerProvider));
