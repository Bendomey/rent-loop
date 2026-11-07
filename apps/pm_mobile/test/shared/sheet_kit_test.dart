import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

Future<void> _open(WidgetTester tester, {required bool dismissible}) async {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
  await tester.pumpWidget(
    MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: TextButton(
            onPressed: () => showRLSheet(
              context,
              (close) => RLSheet(
                title: 'A sheet',
                onClose: close,
                dismissible: dismissible,
                footer: const SizedBox(height: 40),
                child: const SizedBox(height: 200),
              ),
            ),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
  expect(find.text('A sheet'), findsOneWidget);
}

void main() {
  testWidgets('a locked sheet ignores the barrier, a drag, close and back', (
    tester,
  ) async {
    await _open(tester, dismissible: false);

    await tester.tapAt(const Offset(10, 10));
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsOneWidget);

    await tester.drag(find.text('A sheet'), const Offset(0, 500));
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.close_rounded));
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsOneWidget);
  });

  testWidgets('an unlocked sheet closes on the barrier', (tester) async {
    await _open(tester, dismissible: true);

    await tester.tapAt(const Offset(10, 10));
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsNothing);
  });

  testWidgets('an unlocked sheet closes on a drag down', (tester) async {
    await _open(tester, dismissible: true);

    await tester.drag(find.text('A sheet'), const Offset(0, 500));
    await tester.pumpAndSettle();
    expect(find.text('A sheet'), findsNothing);
  });

  testWidgets(
    'a tall sheet stays below the top safe area with the keyboard up',
    (tester) async {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
            const MethodChannel('haptic_feedback'),
            (_) async => null,
          );
      tester.view.physicalSize = const Size(400, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              padding: const EdgeInsets.only(top: 59, bottom: 34),
              viewInsets: const EdgeInsets.only(bottom: 300),
            ),
            child: child!,
          ),
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => showRLSheet(
                  context,
                  (close) => RLSheet(
                    title: 'A sheet',
                    onClose: close,
                    footer: const SizedBox(height: 40),
                    child: const SizedBox(height: 2000),
                  ),
                ),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      final top = tester.getTopLeft(find.byType(RLSheet)).dy;
      expect(top, greaterThanOrEqualTo(59));
    },
  );
}
