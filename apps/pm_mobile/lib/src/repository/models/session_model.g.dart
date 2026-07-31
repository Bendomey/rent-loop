// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'session_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SessionModel _$SessionModelFromJson(Map<String, dynamic> json) => SessionModel(
  id: json['id'] as String,
  isCurrent: json['is_current'] as bool? ?? false,
  signedInAt: json['signed_in_at'] as String,
  lastUsedAt: json['last_used_at'] as String,
  expiresAt: json['expires_at'] as String,
  deviceName: json['device_name'] as String?,
  deviceKind: json['device_kind'] as String?,
  os: json['os'] as String?,
  osVersion: json['os_version'] as String?,
  clientName: json['client_name'] as String?,
  clientVersion: json['client_version'] as String?,
  ipAddress: json['ip_address'] as String?,
  timezone: json['timezone'] as String?,
  locationCity: json['location_city'] as String?,
  locationCountry: json['location_country'] as String?,
  locationSource: json['location_source'] as String?,
);

Map<String, dynamic> _$SessionModelToJson(SessionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'is_current': instance.isCurrent,
      'device_name': instance.deviceName,
      'device_kind': instance.deviceKind,
      'os': instance.os,
      'os_version': instance.osVersion,
      'client_name': instance.clientName,
      'client_version': instance.clientVersion,
      'ip_address': instance.ipAddress,
      'timezone': instance.timezone,
      'location_city': instance.locationCity,
      'location_country': instance.locationCountry,
      'location_source': instance.locationSource,
      'signed_in_at': instance.signedInAt,
      'last_used_at': instance.lastUsedAt,
      'expires_at': instance.expiresAt,
    };
