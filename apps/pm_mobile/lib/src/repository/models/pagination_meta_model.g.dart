// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pagination_meta_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaginationMetaModel _$PaginationMetaModelFromJson(Map<String, dynamic> json) =>
    PaginationMetaModel(
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      pageSize: (json['page_size'] as num).toInt(),
      hasNextPage: json['has_next_page'] as bool,
      hasPreviousPage: json['has_previous_page'] as bool,
      order: json['order'] as String?,
      orderBy: json['order_by'] as String?,
    );

Map<String, dynamic> _$PaginationMetaModelToJson(
        PaginationMetaModel instance) =>
    <String, dynamic>{
      'total': instance.total,
      'page': instance.page,
      'page_size': instance.pageSize,
      'has_next_page': instance.hasNextPage,
      'has_previous_page': instance.hasPreviousPage,
      'order': instance.order,
      'order_by': instance.orderBy,
    };
