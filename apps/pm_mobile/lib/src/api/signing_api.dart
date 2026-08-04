import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/signing_token_model.dart';

part 'signing_api.g.dart';

/// Signature requests + the property manager's own direct sign. Note the
/// live routes diverge from their swagger godoc comments in
/// `services/main` (confirmed against `internal/router/client-user.go`):
/// token generation is `POST .../signing-tokens` (not `.../signing` as its
/// docstring says) and the PM's direct sign is `POST .../signing` (not
/// `.../signing/direct`) — the two paths are swapped in the docs.
class SigningApi extends AbstractApi {
  SigningApi({required super.tokenManager});

  String _base({required String clientId, required String propertyId}) =>
      '/api/v1/admin/clients/$clientId/properties/$propertyId';

  /// `POST .../signing-tokens` — [role] is `TENANT` on mobile (witness roles
  /// aren't surfaced here, see `documents_tab.dart`'s known-gaps note).
  Future<SigningTokenModel> generateToken({
    required String clientId,
    required String propertyId,
    required String documentId,
    required String role,
    required String leaseId,
    String? signerName,
    String? signerEmail,
    String? signerPhone,
  }) async {
    final response = await execute(
      method: 'POST',
      path:
          '${_base(clientId: clientId, propertyId: propertyId)}/signing-tokens',
      body: {
        'document_id': documentId,
        'role': role,
        'lease_id': leaseId,
        if (signerName != null && signerName.isNotEmpty)
          'signer_name': signerName,
        if (signerEmail != null && signerEmail.isNotEmpty)
          'signer_email': signerEmail,
        if (signerPhone != null && signerPhone.isNotEmpty)
          'signer_phone': signerPhone,
      },
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return SigningTokenModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<SigningTokenModel> resendToken({
    required String clientId,
    required String propertyId,
    required String tokenId,
  }) async {
    final response = await execute(
      method: 'POST',
      path:
          '${_base(clientId: clientId, propertyId: propertyId)}/signing-tokens/$tokenId/resend',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return SigningTokenModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<List<SigningTokenModel>> listTokens({
    required String clientId,
    required String propertyId,
    required String documentId,
    required String leaseId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '${_base(clientId: clientId, propertyId: propertyId)}/signing-tokens'
          '?document_id=$documentId&lease_id=$leaseId',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return (data['rows'] as List<dynamic>)
        .map((e) => SigningTokenModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// `POST .../signing` — the property manager's own signature, no token
  /// involved. Backend rejects (400 `PMSignatureAlreadyExists`) if the
  /// manager has already signed this document.
  Future<void> signAsManager({
    required String clientId,
    required String propertyId,
    required String documentId,
    required String signatureUrl,
    required String leaseId,
  }) async {
    await execute(
      method: 'POST',
      path: '${_base(clientId: clientId, propertyId: propertyId)}/signing',
      body: {
        'document_id': documentId,
        'signature_url': signatureUrl,
        'lease_id': leaseId,
      },
    );
  }
}

@riverpod
SigningApi signingApi(SigningApiRef ref) =>
    SigningApi(tokenManager: ref.watch(tokenManagerProvider));
