// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  phoneNumber: json['phone_number'] as String?,
  clientUsers:
      (json['client_users'] as List<dynamic>?)
          ?.map((e) => ClientUserModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      [],
  createdAt: json['created_at'] as String?,
  updatedAt: json['updated_at'] as String?,
);

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'phone_number': instance.phoneNumber,
  'client_users': instance.clientUsers,
  'created_at': instance.createdAt,
  'updated_at': instance.updatedAt,
};
