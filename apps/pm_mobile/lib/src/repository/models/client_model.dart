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
  @JsonKey(name: 'support_email')
  final String? supportEmail;
  @JsonKey(name: 'support_phone')
  final String? supportPhone;
  @JsonKey(name: 'website_url')
  final String? websiteUrl;
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
    this.supportEmail,
    this.supportPhone,
    this.websiteUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) =>
      _$ClientModelFromJson(json);

  Map<String, dynamic> toJson() => _$ClientModelToJson(this);
}
