import 'package:json_annotation/json_annotation.dart';

part 'client_model.g.dart';

@JsonSerializable()
class ClientModel {
  final String id;
  final String name;
  final String? type;
  @JsonKey(name: 'sub_type')
  final String? subType;
  final String? address;
  final String? city;
  final String? region;
  final String? country;
  final String? description;
  @JsonKey(name: 'registration_number')
  final String? registrationNumber;
  @JsonKey(name: 'support_email')
  final String? supportEmail;
  @JsonKey(name: 'support_phone')
  final String? supportPhone;
  @JsonKey(name: 'website_url')
  final String? websiteUrl;
  @JsonKey(name: 'id_type')
  final String? idType;
  @JsonKey(name: 'id_number')
  final String? idNumber;
  @JsonKey(name: 'id_expiry')
  final String? idExpiry;
  @JsonKey(name: 'id_document_url')
  final String? idDocumentUrl;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  ClientModel({
    required this.id,
    required this.name,
    this.type,
    this.subType,
    this.address,
    this.city,
    this.region,
    this.country,
    this.description,
    this.registrationNumber,
    this.supportEmail,
    this.supportPhone,
    this.websiteUrl,
    this.idType,
    this.idNumber,
    this.idExpiry,
    this.idDocumentUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) =>
      _$ClientModelFromJson(json);

  Map<String, dynamic> toJson() => _$ClientModelToJson(this);
}
