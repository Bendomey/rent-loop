import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

void main() {
  test('PaginationMetaModel.fromJson parses snake_case fields', () {
    final json = {
      'total': 100,
      'page': 1,
      'page_size': 20,
      'has_next_page': true,
      'has_previous_page': false,
      'order': 'desc',
      'order_by': 'created_at',
    };

    final model = PaginationMetaModel.fromJson(json);

    expect(model.total, 100);
    expect(model.page, 1);
    expect(model.pageSize, 20);
    expect(model.hasNextPage, isTrue);
    expect(model.hasPreviousPage, isFalse);
    expect(model.order, 'desc');
    expect(model.orderBy, 'created_at');
  });
}
