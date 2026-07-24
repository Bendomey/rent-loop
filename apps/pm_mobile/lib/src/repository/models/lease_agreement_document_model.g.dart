// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_agreement_document_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DocumentSignatureModel _$DocumentSignatureModelFromJson(
  Map<String, dynamic> json,
) => DocumentSignatureModel(
  id: json['id'] as String,
  role: json['role'] as String,
  signatureUrl: json['signature_url'] as String,
  signedByName: json['signed_by_name'] as String?,
  createdAt: json['created_at'] as String?,
);

Map<String, dynamic> _$DocumentSignatureModelToJson(
  DocumentSignatureModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'role': instance.role,
  'signature_url': instance.signatureUrl,
  'signed_by_name': instance.signedByName,
  'created_at': instance.createdAt,
};

LeaseAgreementDocumentModel _$LeaseAgreementDocumentModelFromJson(
  Map<String, dynamic> json,
) => LeaseAgreementDocumentModel(
  id: json['id'] as String,
  leaseId: json['lease_id'] as String,
  mode: json['mode'] as String,
  documentId: json['document_id'] as String?,
  documentUrl: json['document_url'] as String?,
  status: json['status'] as String,
  signatures:
      (json['signatures'] as List<dynamic>?)
          ?.map(
            (e) => DocumentSignatureModel.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
  createdAt: json['created_at'] as String?,
  updatedAt: json['updated_at'] as String?,
);

Map<String, dynamic> _$LeaseAgreementDocumentModelToJson(
  LeaseAgreementDocumentModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'lease_id': instance.leaseId,
  'mode': instance.mode,
  'document_id': instance.documentId,
  'document_url': instance.documentUrl,
  'status': instance.status,
  'signatures': instance.signatures,
  'created_at': instance.createdAt,
  'updated_at': instance.updatedAt,
};
