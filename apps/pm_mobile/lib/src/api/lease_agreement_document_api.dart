import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/lease_agreement_document_model.dart';

part 'lease_agreement_document_api.g.dart';

/// A lease has at most one agreement document — `GET .../agreement-documents`
/// 404s (`LeaseAgreementDocumentNotFound`) when none exists yet, which
/// [getDocument] translates to `null` rather than throwing, so callers can
/// treat "no document" as ordinary empty state.
class LeaseAgreementDocumentApi extends AbstractApi {
  LeaseAgreementDocumentApi({required super.tokenManager});

  Future<LeaseAgreementDocumentModel?> getDocument({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    try {
      final response = await execute(
        method: 'GET',
        path:
            '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId/agreement-documents',
      );
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return LeaseAgreementDocumentModel.fromJson(
        json['data'] as Map<String, dynamic>,
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  /// `DELETE .../agreement-documents`, no body, 204. Backend allows this in
  /// any status while the final signed PDF hasn't been saved to the lease
  /// yet (`lease.lease_agreement_document_url` still unset).
  Future<void> deleteDocument({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    await execute(
      method: 'DELETE',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/leases/$leaseId/agreement-documents',
    );
  }
}

@riverpod
LeaseAgreementDocumentApi leaseAgreementDocumentApi(
  LeaseAgreementDocumentApiRef ref,
) => LeaseAgreementDocumentApi(tokenManager: ref.watch(tokenManagerProvider));
