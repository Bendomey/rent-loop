import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/modules/main/more/general/root.dart';
import 'package:rentloop_manager/src/repository/models/client_model.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/user_model.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// "Company" is also the ownership pill on the identity card, so category
/// rows have to be found by the row widget rather than by text alone.
Finder _categoryRow(String label) => find.widgetWithText(RLRow, label);

ClientModel _company() => ClientModel(
  id: 'c1',
  name: 'Rentloop Test Company',
  type: 'COMPANY',
  subType: 'PROPERTY_MANAGER',
  address: 'Liberty Road, Adenta',
  city: 'Adenta Municipality',
  region: 'Greater Accra Region',
  country: 'Ghana',
  supportEmail: 'support@rentloopapp.com',
  supportPhone: '+233201234567',
);

ClientModel _individual() => ClientModel(
  id: 'c2',
  name: 'Benjamin Domey',
  type: 'INDIVIDUAL',
  subType: 'LANDLORD',
  city: 'Accra',
  country: 'Ghana',
  idType: 'NATIONAL_ID',
  idNumber: 'GHA-123456789-0',
);

UserModel _user(ClientModel client) => UserModel(
  id: 'u1',
  name: 'Benjamin Domey',
  email: 'benjamin@rentloopapp.com',
  clientUsers: [
    ClientUserModel(
      id: 'cu1',
      clientId: client.id,
      role: 'OWNER',
      status: 'ClientUser.Status.Active',
      client: client,
    ),
  ],
);

Widget _app(ClientModel client) => ProviderScope(
  overrides: [
    currentUserNotifierProvider.overrideWith(
      () => _StubCurrentUser(_user(client)),
    ),
  ],
  child: const MaterialApp(home: GeneralSettingsScreen()),
);

class _StubCurrentUser extends CurrentUserNotifier {
  _StubCurrentUser(this._user);

  final UserModel _user;

  @override
  UserModel? build() => _user;
}

void main() {
  testWidgets('hub shows the account and every category', (tester) async {
    await tester.pumpWidget(_app(_company()));
    await tester.pumpAndSettle();

    expect(find.text('Rentloop Test Company'), findsOneWidget);
    // Ownership and business type are derived from the API's enums.
    expect(find.text('Company'), findsWidgets);
    expect(find.text('Property Manager'), findsOneWidget);

    for (final category in ['Profile', 'Location', 'Branding', 'Preferences']) {
      expect(_categoryRow(category), findsOneWidget);
    }
    // The location row summarises rather than repeating a static label.
    expect(find.text('Adenta Municipality, Ghana'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('individual accounts get Identity, not Company', (tester) async {
    await tester.pumpWidget(_app(_individual()));
    await tester.pumpAndSettle();

    expect(_categoryRow('Identity'), findsOneWidget);
    expect(find.text('Company'), findsNothing);
    expect(find.text('National ID'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  // Every category body is a plain Column that leans on the sub-page shell's
  // scroll view. My Account shipped a page that brought its own ListView and
  // failed layout on open — this walks each one to catch the same mistake.
  testWidgets('each category page opens without a layout exception', (
    tester,
  ) async {
    await tester.pumpWidget(_app(_company()));
    await tester.pumpAndSettle();

    for (final category in [
      'Profile',
      'Company',
      'Location',
      'Branding',
      'Preferences',
    ]) {
      await tester.tap(_categoryRow(category));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: '$category page');

      // pageBack() hunts for a Material/Cupertino back button; these pages
      // use the custom RLBackHeader, so pop the route directly.
      tester.state<NavigatorState>(find.byType(Navigator).first).pop();
      await tester.pumpAndSettle();
    }
  });

  testWidgets('empty company fields render as em-dashes', (tester) async {
    await tester.pumpWidget(_app(_company()));
    await tester.pumpAndSettle();

    await tester.tap(_categoryRow('Company'));
    await tester.pumpAndSettle();

    // Description, registration number and website are all unset above.
    expect(find.text('—'), findsNWidgets(3));
    expect(find.text('support@rentloopapp.com'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
