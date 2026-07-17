// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TenantLeaseRef _$TenantLeaseRefFromJson(Map<String, dynamic> json) =>
    TenantLeaseRef(
      status: json['status'] as String,
      unit: json['unit'] == null
          ? null
          : UnitModel.fromJson(json['unit'] as Map<String, dynamic>),
      rentFee: (json['rent_fee'] as num).toInt(),
      rentFeeCurrency: json['rent_fee_currency'] as String,
      paymentFrequency: json['payment_frequency'] as String?,
      moveInDate: json['move_in_date'] as String?,
      moveOutDate: json['move_out_date'] as String?,
    );

Map<String, dynamic> _$TenantLeaseRefToJson(TenantLeaseRef instance) =>
    <String, dynamic>{
      'status': instance.status,
      'unit': instance.unit,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'move_in_date': instance.moveInDate,
      'move_out_date': instance.moveOutDate,
    };

TenantModel _$TenantModelFromJson(Map<String, dynamic> json) => TenantModel(
  id: json['id'] as String,
  firstName: json['first_name'] as String,
  lastName: json['last_name'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String,
  profilePhotoUrl: json['profile_photo_url'] as String?,
  recentLease: json['recent_lease'] == null
      ? null
      : TenantLeaseRef.fromJson(json['recent_lease'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TenantModelToJson(TenantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'first_name': instance.firstName,
      'last_name': instance.lastName,
      'email': instance.email,
      'phone': instance.phone,
      'profile_photo_url': instance.profilePhotoUrl,
      'recent_lease': instance.recentLease,
    };
