import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/money/root.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/rent_focus_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

import '../../../support/options_fakes.dart';

class _StubBills extends BillsNotifier {
  @override
  BillsState build(BillsView view, String? propertyId, {bool picker = false}) =>
      const BillsState(hasLoaded: true);

  @override
  Future<void> loadFirstPage({String? search}) async {}
}

Future<ProviderContainer> _pump(
  WidgetTester tester, {
  void Function(ProviderContainer)? before,
}) async {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
  final container = ProviderContainer(
    overrides: [
      myPropertyRolesProvider.overrideWith((ref) async => {}),
      propertyOptionsNotifierProvider().overrideWith(
        () => FakePropertyOptions([
          for (final (id, name) in [('p1', 'Ama Court'), ('p2', 'Bay View')])
            PropertyModel(
              id: id,
              name: name,
              type: 'Property.Type.Apartment',
              status: 'Property.Status.Active',
            ),
        ]),
      ),
      for (final view in BillsView.values)
        for (final id in <String?>[null, 'p1'])
          billsNotifierProvider(view, id).overrideWith(_StubBills.new),
    ],
  );
  addTearDown(container.dispose);
  before?.call(container);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(home: MoneyScreen()),
    ),
  );
  await tester.pump();
  return container;
}

void main() {
  testWidgets('a focus set before the tab opens scopes it to the property', (
    tester,
  ) async {
    await _pump(
      tester,
      before: (c) => c
          .read(rentFocusNotifierProvider.notifier)
          .showOwing(property: (id: 'p1', name: 'Ama Court')),
    );

    expect(find.text('Property: Ama Court'), findsOneWidget);
  });

  testWidgets('a focus sent to an open tab switches back to Owing', (
    tester,
  ) async {
    final container = await _pump(tester);
    await tester.tap(find.text('Paid'));
    await tester.pump();
    expect(tester.widget<RLSegmented>(find.byType(RLSegmented)).value, 'paid');

    container
        .read(rentFocusNotifierProvider.notifier)
        .showOwing(property: (id: 'p1', name: 'Ama Court'));
    await tester.pump();

    expect(find.text('Property: Ama Court'), findsOneWidget);
    expect(tester.widget<RLSegmented>(find.byType(RLSegmented)).value, 'owing');
  });
}
