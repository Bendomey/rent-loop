import 'package:flutter_test/flutter_test.dart';

import 'package:property_manager_mobile/main.dart';

void main() {
  testWidgets('App boots to sign-in', (WidgetTester tester) async {
    await tester.pumpWidget(const PropertyManagerApp());
    await tester.pumpAndSettle();

    expect(find.text('Sign in'), findsWidgets);
    expect(find.text('Manage your portfolio from anywhere.'), findsOneWidget);
  });
}
