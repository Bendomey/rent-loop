import 'package:json_annotation/json_annotation.dart';

part 'property_model.g.dart';

/// Deliberately minimal — only what the onboarding checklist needs right
/// now. A future properties-module integration pass extends this class
/// with the rest of the property fields, not a new class.
@JsonSerializable()
class PropertyModel {
  final String id;

  PropertyModel({required this.id});

  factory PropertyModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyModelToJson(this);
}
