import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

final _tm = TokenManager(_NoStorage());

PaginationMetaModel _meta(int page, bool hasNext) => PaginationMetaModel(
  total: 100,
  page: page,
  pageSize: 20,
  hasNextPage: hasNext,
  hasPreviousPage: page > 1,
);

PropertyModel _property(String id) => PropertyModel(
  id: id,
  name: id,
  type: 'Property.Type.Apartment',
  status: 'Property.Status.Active',
);

UnitModel _unit(String id, String status) => UnitModel(
  id: id,
  name: id,
  type: 'Unit.Type.Apartment',
  status: status,
  rentFee: 1,
  rentFeeCurrency: 'GHS',
);

class _PropertyApi extends ClientUserPropertyApi {
  _PropertyApi() : super(tokenManager: _tm);

  final List<({int page, int pageSize, String? search})> calls = [];
  Future<PropertiesPage> Function(int page, String? search)? handler;

  @override
  Future<PropertiesPage> getMyProperties({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? order,
    String? orderBy,
  }) {
    calls.add((page: page, pageSize: pageSize, search: search));
    return handler!(page, search);
  }
}

class _UnitApi extends UnitApi {
  _UnitApi() : super(tokenManager: _tm);

  final List<({int page, int pageSize, String? search})> calls = [];
  Future<UnitsPage> Function(int page, String? search)? handler;

  @override
  Future<UnitsPage> getUnitsPageAcrossProperties({
    required String clientId,
    List<String>? propertyIds,
    String? blockId,
    int page = 1,
    int pageSize = 20,
    String? search,
  }) {
    calls.add((page: page, pageSize: pageSize, search: search));
    return handler!(page, search);
  }
}

class _SignedIn extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

void main() {
  late _PropertyApi propertyApi;
  late _UnitApi unitApi;
  late ProviderContainer container;
  var roles = <String, String>{};

  setUp(() {
    propertyApi = _PropertyApi();
    unitApi = _UnitApi();
    roles = {};
    container = ProviderContainer(
      overrides: [
        clientUserPropertyApiProvider.overrideWithValue(propertyApi),
        unitApiProvider.overrideWithValue(unitApi),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        myPropertyRolesProvider.overrideWith((ref) async => roles),
      ],
    );
    addTearDown(container.dispose);
  });

  Future<void> settle() => Future<void>.delayed(Duration.zero);

  test('property options page 20 and search hits the server', () async {
    propertyApi.handler = (page, search) async => PropertiesPage(
      rows: [_property('p$page')],
      meta: _meta(page, page < 2),
    );
    final provider = propertyOptionsNotifierProvider();
    container.listen(provider, (_, __) {});
    await settle();

    expect(propertyApi.calls.single, (page: 1, pageSize: 20, search: ''));
    expect(container.read(provider).hasLoaded, isTrue);
    expect(container.read(provider).hasNextPage, isTrue);

    await container.read(provider.notifier).loadNextPage();
    expect(container.read(provider).items.map((p) => p.id), ['p1', 'p2']);
    expect(container.read(provider).hasNextPage, isFalse);

    container.read(provider.notifier).setSearch('oak');
    await settle();
    expect(propertyApi.calls.last, (page: 1, pageSize: 20, search: 'oak'));
    expect(container.read(provider).items.map((p) => p.id), ['p1']);
  });

  test('a failed search clears old results and shows the error', () async {
    propertyApi.handler = (page, search) async {
      if (search == 'B2') throw Exception('offline');
      return PropertiesPage(rows: [_property('p1')], meta: _meta(1, false));
    };
    final provider = propertyOptionsNotifierProvider();
    container.listen(provider, (_, __) {});
    await settle();
    expect(container.read(provider).items, hasLength(1));

    container.read(provider.notifier).setSearch('B2');
    await settle();

    expect(container.read(provider).items, isEmpty);
    expect(container.read(provider).error, isNotNull);
  });

  test('last search wins', () async {
    final gates = <String, Completer<PropertiesPage>>{};
    propertyApi.handler = (page, search) {
      final completer = Completer<PropertiesPage>();
      gates[search ?? ''] = completer;
      return completer.future;
    };
    final provider = propertyOptionsNotifierProvider();
    container.listen(provider, (_, __) {});
    await settle();
    final notifier = container.read(provider.notifier);

    notifier.setSearch('a');
    await settle();
    notifier.setSearch('ab');
    await settle();

    gates['ab']!.complete(
      PropertiesPage(rows: [_property('new')], meta: _meta(1, false)),
    );
    await settle();
    gates['a']!.complete(
      PropertiesPage(rows: [_property('old')], meta: _meta(1, false)),
    );
    await settle();

    expect(container.read(provider).items.map((p) => p.id), ['new']);
    expect(container.read(provider).search, 'ab');
  });

  test('managerOnly keeps paging until rows show', () async {
    roles = {'m1': 'MANAGER', 'm2': 'MANAGER'};
    propertyApi.handler = (page, search) async => PropertiesPage(
      rows: page < 4
          ? [_property('s$page')]
          : [_property('m1'), _property('m2')],
      meta: _meta(page, page < 4),
    );
    final provider = propertyOptionsNotifierProvider(managerOnly: true);
    container.listen(provider, (_, __) {});
    await settle();
    await settle();

    expect(propertyApi.calls.map((c) => c.page), [1, 2, 3, 4]);
    expect(container.read(provider).items.map((p) => p.id), ['m1', 'm2']);
    expect(container.read(provider).hasNextPage, isFalse);
  });

  test('managerOnly stops auto-paging after five pages', () async {
    propertyApi.handler = (page, search) async =>
        PropertiesPage(rows: [_property('s$page')], meta: _meta(page, true));
    final provider = propertyOptionsNotifierProvider(managerOnly: true);
    container.listen(provider, (_, __) {});
    await settle();
    await settle();

    expect(propertyApi.calls, hasLength(5));
    expect(container.read(provider).items, isEmpty);
    expect(container.read(provider).hasNextPage, isTrue);
  });

  test('bookable units filter and auto-page', () async {
    unitApi.handler = (page, search) async => UnitsPage(
      rows: page == 1
          ? [
              _unit('a', 'Unit.Status.Occupied'),
              _unit('b', 'Unit.Status.Available'),
            ]
          : [
              for (var i = 0; i < 8; i++)
                _unit('c$i', 'Unit.Status.PartiallyOccupied'),
              _unit('x', 'Unit.Status.Draft'),
            ],
      meta: _meta(page, page < 2),
    );
    final provider = unitOptionsNotifierProvider(
      const UnitOptionsQuery(bookableOnly: true),
    );
    container.listen(provider, (_, __) {});
    await settle();
    await settle();

    expect(unitApi.calls.map((c) => c.page), [1, 2]);
    final ids = container.read(provider).items.map((u) => u.id);
    expect(ids, hasLength(9));
    expect(ids, isNot(contains('a')));
    expect(ids, isNot(contains('x')));
  });

  test('unit queries with equal fields share one provider', () {
    expect(
      const UnitOptionsQuery(propertyIds: ['a', 'b']),
      const UnitOptionsQuery(propertyIds: ['a', 'b']),
    );
    expect(
      const UnitOptionsQuery(propertyIds: ['a', 'b']).hashCode,
      const UnitOptionsQuery(propertyIds: ['a', 'b']).hashCode,
    );
  });
}
