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

  /// Everything the checklist reads. Preloading all four keeps each card's
  /// progress bar computable from the list response alone — no per-row fetch.
  static const _populate =
      'DesiredUnit,ApplicationPaymentInvoice,LeaseAgreementDocument,'
      'LeaseAgreementDocumentSignatures';

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
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      'populate': _populate,
      'order': 'desc',
      'order_by': 'created_at',
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
