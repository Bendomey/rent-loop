import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/root.dart';

void main() {
  testWidgets('My account lists Profile only', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: MyAccountScreen())),
    );
    await tester.pump();

    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('Security'), findsNothing);
    expect(find.text('Sessions'), findsNothing);
    expect(find.text('Sign out of this device'), findsOneWidget);
  });
}
