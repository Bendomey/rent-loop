import 'package:json_annotation/json_annotation.dart';

part 'agreement_model.g.dart';

@JsonSerializable()
class AgreementModel {
  final String id;
  final String name;
  @JsonKey(name: 'user_has_accepted')
  final bool userHasAccepted;

  AgreementModel({
    required this.id,
    required this.name,
    required this.userHasAccepted,
  });

  factory AgreementModel.fromJson(Map<String, dynamic> json) =>
      _$AgreementModelFromJson(json);

  Map<String, dynamic> toJson() => _$AgreementModelToJson(this);
}
