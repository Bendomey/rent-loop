// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'client_user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClientUserModel _$ClientUserModelFromJson(Map<String, dynamic> json) =>
    ClientUserModel(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      client: json['client'] == null
          ? null
          : ClientModel.fromJson(json['client'] as Map<String, dynamic>),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$ClientUserModelToJson(ClientUserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'client_id': instance.clientId,
      'role': instance.role,
      'status': instance.status,
      'client': instance.client,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
