import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/modules/main/properties/add_unit.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_blocks_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';

import '../../../support/real_notifier_support.dart';

PropertyBlockModel _block(String id, String name) =>
    PropertyBlockModel(id: id, name: name, status: 'Active', unitsCount: 0);

Future<void> _pump(WidgetTester tester, List<PropertyBlockModel> blocks) async {
  tester.view.physicalSize = const Size(1200, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final onError = FlutterError.onError;
  FlutterError.onError = (d) {
    if (!d.toString().contains('overflowed')) onError?.call(d);
  };
  addTearDown(() => FlutterError.onError = onError);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        propertyBlocksProvider('p1').overrideWith(
          (ref) async => PropertyBlocksPage(rows: blocks, meta: emptyMeta()),
        ),
        propertyDetailProvider('p1').overrideWith(
          (ref) async => PropertyModel(
            id: 'p1',
            name: 'Ring Road',
            type: 'Property.Type.Apartment',
            status: 'Property.Status.Active',
          ),
        ),
      ],
      child: const MaterialApp(home: AddUnitScreen(propertyId: 'p1')),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('preselects the block when the property has exactly one', (
    tester,
  ) async {
    await _pump(tester, [_block('b1', 'Main')]);
    expect(find.text('Main'), findsOneWidget);
    expect(find.text('Select block…'), findsNothing);
  });

  testWidgets('leaves the block unset when there are several', (tester) async {
    await _pump(tester, [_block('b1', 'Main'), _block('b2', 'West Wing')]);
    expect(find.text('Select block…'), findsOneWidget);
  });
}
