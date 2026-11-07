import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/properties/root.dart';
import 'package:rentloop_manager/src/modules/main/tenants/root.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  testWidgets('properties: filtered keeps the search copy', (tester) async {
    await tester.pumpWidget(
      _wrap(PropertiesEmptyState(filtered: true, canAdd: true, onAdd: () {})),
    );
    expect(find.text('No properties found'), findsOneWidget);
    expect(find.text('Try a different search or filter.'), findsOneWidget);
    expect(find.text('Add property'), findsNothing);
  });

  testWidgets('properties: unfiltered invites the first add', (tester) async {
    var added = false;
    await tester.pumpWidget(
      _wrap(
        PropertiesEmptyState(
          filtered: false,
          canAdd: true,
          onAdd: () => added = true,
        ),
      ),
    );
    expect(find.text('No properties yet'), findsOneWidget);
    expect(
      find.text('Add your first property to get started.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Add property'));
    expect(added, isTrue);
  });

  testWidgets('tenants: filtered keeps the search copy', (tester) async {
    await tester.pumpWidget(_wrap(const TenantsEmptyState(filtered: true)));
    expect(find.text('No tenants found'), findsOneWidget);
    expect(find.text('Add tenant'), findsNothing);
  });

  testWidgets('tenants: unfiltered invites the first add', (tester) async {
    await tester.pumpWidget(_wrap(const TenantsEmptyState(filtered: false)));
    expect(find.text('No tenants yet'), findsOneWidget);
    expect(find.text('Add your first tenant.'), findsOneWidget);
  });

  testWidgets('properties: no add button without permission', (tester) async {
    await tester.pumpWidget(
      _wrap(PropertiesEmptyState(filtered: false, canAdd: false, onAdd: () {})),
    );
    expect(find.text('No properties yet'), findsOneWidget);
    expect(find.text('Add property'), findsNothing);
  });
}
