import 'package:json_annotation/json_annotation.dart';

part 'signing_token_model.g.dart';

/// A signature request sent to a non-manager signer (tenant, or a witness —
/// witnesses aren't surfaced on mobile, see `documents_tab.dart`). The
/// property manager signs directly instead (`SigningApi.signAsManager()`),
/// never through a token.
@JsonSerializable()
class SigningTokenModel {
  final String id;
  final String token;
  final String role; // TENANT | PM_WITNESS | TENANT_WITNESS
  @JsonKey(name: 'signer_name')
  final String? signerName;
  @JsonKey(name: 'signer_email')
  final String? signerEmail;
  @JsonKey(name: 'signer_phone')
  final String? signerPhone;
  @JsonKey(name: 'signed_at')
  final String? signedAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  SigningTokenModel({
    required this.id,
    required this.token,
    required this.role,
    this.signerName,
    this.signerEmail,
    this.signerPhone,
    this.signedAt,
    this.createdAt,
  });

  bool get isSigned => signedAt != null;

  factory SigningTokenModel.fromJson(Map<String, dynamic> json) =>
      _$SigningTokenModelFromJson(json);

  Map<String, dynamic> toJson() => _$SigningTokenModelToJson(this);
}
