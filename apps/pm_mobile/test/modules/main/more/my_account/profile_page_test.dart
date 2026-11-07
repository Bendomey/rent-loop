import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/root.dart';
import 'package:rentloop_manager/src/repository/models/user_model.dart';

class _SignedInUser extends CurrentUserNotifier {
  @override
  UserModel? build() => UserModel(
    id: 'u1',
    name: 'Ama Mensah',
    email: 'ama@example.com',
    phoneNumber: '+233201234567',
  );
}

void main() {
  testWidgets('profile is read-only with the signed-in user details', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          currentUserNotifierProvider.overrideWith(_SignedInUser.new),
        ],
        child: const MaterialApp(home: MyAccountScreen()),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Ama Mensah'), findsOneWidget);
    expect(find.text('ama@example.com'), findsOneWidget);
    expect(find.text('+233201234567'), findsOneWidget);
    expect(find.text('Change'), findsNothing);
    expect(find.text('Verified'), findsNothing);
    expect(find.textContaining('coming soon'), findsNothing);
    expect(find.textContaining('photo', findRichText: true), findsNothing);
    expect(find.text('Remove'), findsNothing);
    expect(find.byIcon(Icons.photo_camera_outlined), findsNothing);
  });
}
