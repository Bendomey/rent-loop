import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/properties/add.dart';
import 'package:rentloop_manager/src/modules/main/properties/edit_sheets.dart';

Future<void> _openRentalModeSheet(WidgetTester tester, String current) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Builder(
        builder: (context) => TextButton(
          onPressed: () => showRentalModeSheet(context, current: current),
          child: const Text('open'),
        ),
      ),
    ),
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('add property offers only long-term rentals', (tester) async {
    tester.view.physicalSize = const Size(800, 3000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: AddPropertyScreen())),
    );
    await tester.pump();

    expect(find.text('Long-term (Leases)'), findsOneWidget);
    expect(
      find.text('Monthly rent, tenants, lease agreements.'),
      findsOneWidget,
    );
    expect(find.text('Short-term (Bookings)'), findsNothing);
    expect(find.text('Both'), findsNothing);
  });

  testWidgets('rental mode sheet hides short-term for a lease property', (
    tester,
  ) async {
    await _openRentalModeSheet(tester, 'lease');

    expect(find.text('Long-term (Leases)'), findsOneWidget);
    expect(
      find.text('Monthly rent, tenants, lease agreements.'),
      findsOneWidget,
    );
    expect(find.text('Short-term (Bookings)'), findsNothing);
  });

  testWidgets('rental mode sheet keeps short-term for a booking property', (
    tester,
  ) async {
    await _openRentalModeSheet(tester, 'booking');

    expect(find.text('Short-term (Bookings)'), findsOneWidget);
  });
}
