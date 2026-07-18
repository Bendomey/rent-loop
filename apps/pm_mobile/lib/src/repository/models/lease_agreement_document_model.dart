import 'package:json_annotation/json_annotation.dart';

part 'lease_agreement_document_model.g.dart';

/// A signature already collected on a document. `signatureUrl` is a drawn
/// PNG image (uploaded via the same R2 proxy `UImagePicker` uses) — there is
/// no typed-name-only or checkbox-only signing mode on the backend.
@JsonSerializable()
class DocumentSignatureModel {
  final String id;
  final String role; // PROPERTY_MANAGER | TENANT | PM_WITNESS | TENANT_WITNESS
  @JsonKey(name: 'signature_url')
  final String signatureUrl;
  @JsonKey(name: 'signed_by_name')
  final String? signedByName;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  DocumentSignatureModel({
    required this.id,
    required this.role,
    required this.signatureUrl,
    this.signedByName,
    this.createdAt,
  });

  factory DocumentSignatureModel.fromJson(Map<String, dynamic> json) =>
      _$DocumentSignatureModelFromJson(json);

  Map<String, dynamic> toJson() => _$DocumentSignatureModelToJson(this);
}

/// A lease's document pipeline record — at most one per lease
/// (`GET .../agreement-documents` 404s when none exists yet, which
/// `LeaseAgreementDocumentApi.getDocument()` translates to `null`).
///
/// `mode`: `MANUAL` (a PDF/Word file uploaded on web, treated as already
/// signed — no in-app signing at all) or `ONLINE` (built from a template,
/// goes through the full editor + e-sign pipeline). Only fields the mobile
/// read/sign/request-signature flow needs are modeled — the nested `document`
/// (Lexical JSON content) is deliberately excluded since mobile never
/// renders it.
@JsonSerializable()
class LeaseAgreementDocumentModel {
  final String id;
  @JsonKey(name: 'lease_id')
  final String leaseId;
  final String mode; // MANUAL | ONLINE
  @JsonKey(name: 'document_id')
  final String? documentId;
  @JsonKey(name: 'document_url')
  final String? documentUrl;
  final String status; // DRAFT | FINALIZED | SIGNING | SIGNED
  final List<DocumentSignatureModel> signatures;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  LeaseAgreementDocumentModel({
    required this.id,
    required this.leaseId,
    required this.mode,
    this.documentId,
    this.documentUrl,
    required this.status,
    this.signatures = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory LeaseAgreementDocumentModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseAgreementDocumentModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseAgreementDocumentModelToJson(this);

  DocumentSignatureModel? signatureFor(String role) {
    for (final s in signatures) {
      if (s.role == role) return s;
    }
    return null;
  }
}
