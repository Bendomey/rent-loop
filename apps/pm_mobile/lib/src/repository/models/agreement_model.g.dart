// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AgreementModel _$AgreementModelFromJson(Map<String, dynamic> json) =>
    AgreementModel(
      id: json['id'] as String,
      name: json['name'] as String,
      userHasAccepted: json['user_has_accepted'] as bool,
    );

Map<String, dynamic> _$AgreementModelToJson(AgreementModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'user_has_accepted': instance.userHasAccepted,
    };
