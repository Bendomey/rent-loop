import 'package:json_annotation/json_annotation.dart';

part 'pagination_meta_model.g.dart';

@JsonSerializable()
class PaginationMetaModel {
  final int total;
  final int page;
  @JsonKey(name: 'page_size')
  final int pageSize;
  @JsonKey(name: 'has_next_page')
  final bool hasNextPage;
  @JsonKey(name: 'has_previous_page')
  final bool hasPreviousPage;
  final String? order;
  @JsonKey(name: 'order_by')
  final String? orderBy;

  PaginationMetaModel({
    required this.total,
    required this.page,
    required this.pageSize,
    required this.hasNextPage,
    required this.hasPreviousPage,
    this.order,
    this.orderBy,
  });

  factory PaginationMetaModel.fromJson(Map<String, dynamic> json) =>
      _$PaginationMetaModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaginationMetaModelToJson(this);
}
