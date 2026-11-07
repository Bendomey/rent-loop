import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';
import 'package:rentloop_manager/src/shared/contact_buttons.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../modules/main/money/bill_fixtures.dart';

Future<List<Uri>> _pump(
  WidgetTester tester,
  String? phone, {
  bool succeeds = true,
}) async {
  mockHaptics();
  final opened = <Uri>[];
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        urlOpenerProvider.overrideWithValue((url) async {
          opened.add(url);
          return succeeds;
        }),
      ],
      child: MaterialApp(
        home: Scaffold(body: RLContactButtons(phone: phone)),
      ),
    ),
  );
  return opened;
}

void main() {
  testWidgets('WhatsApp opens wa.me with the normalised number', (t) async {
    final opened = await _pump(t, '024 455 1190');
    await t.tap(find.text('WhatsApp'));
    await t.pump();
    expect(opened.single.toString(), 'https://wa.me/233244551190');
  });

  testWidgets('Call opens tel with spaces removed', (t) async {
    final opened = await _pump(t, '+233 24 455 1190');
    await t.tap(find.text('Call'));
    await t.pump();
    expect(opened.single.toString(), 'tel:+233244551190');
  });

  testWidgets('no phone renders nothing', (t) async {
    await _pump(t, null);
    expect(find.text('Call'), findsNothing);
    expect(find.text('WhatsApp'), findsNothing);
  });

  testWidgets('a failed open shows the error toast', (t) async {
    await _pump(t, '024 455 1190', succeeds: false);
    await t.tap(find.text('Call'));
    await t.pump();
    final container = ProviderScope.containerOf(
      t.element(find.byType(RLContactButtons)),
    );
    expect(container.read(rlToastProvider)?.title, "Couldn't open that.");
    await t.pump(const Duration(seconds: 5));
  });
}
