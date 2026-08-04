// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'signing_token_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SigningTokenModel _$SigningTokenModelFromJson(Map<String, dynamic> json) =>
    SigningTokenModel(
      id: json['id'] as String,
      token: json['token'] as String,
      role: json['role'] as String,
      signerName: json['signer_name'] as String?,
      signerEmail: json['signer_email'] as String?,
      signerPhone: json['signer_phone'] as String?,
      signedAt: json['signed_at'] as String?,
      createdAt: json['created_at'] as String?,
    );

Map<String, dynamic> _$SigningTokenModelToJson(SigningTokenModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'token': instance.token,
      'role': instance.role,
      'signer_name': instance.signerName,
      'signer_email': instance.signerEmail,
      'signer_phone': instance.signerPhone,
      'signed_at': instance.signedAt,
      'created_at': instance.createdAt,
    };
