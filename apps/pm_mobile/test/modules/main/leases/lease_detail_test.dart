import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/leases/detail.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_checklists_provider.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';

LeaseModel _lease(String status) => LeaseModel(
  id: 'l1',
  code: 'LS-001',
  status: status,
  unitId: 'u1',
  tenantId: 't1',
  tenantApplicationId: 'a1',
  rentFee: 150000,
  rentFeeCurrency: 'GHS',
  paymentFrequency: 'MONTHLY',
  moveInDate: DateTime.now()
      .subtract(const Duration(days: 300))
      .toIso8601String(),
  moveOutDate: DateTime.now().add(const Duration(days: 10)).toIso8601String(),
);

Future<void> _pump(WidgetTester tester, LeaseModel lease) async {
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        leaseDetailProvider('p1', 'l1').overrideWith((ref) async => lease),
        leaseChecklistsProvider('p1', 'l1').overrideWith((ref) async => []),
      ],
      child: const MaterialApp(
        home: LeaseDetailScreen(id: 'l1', propertyId: 'p1'),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('active lease shows only Lease and Tenant, no hidden actions', (
    tester,
  ) async {
    await _pump(tester, _lease('Lease.Status.Active'));

    expect(find.text('Lease'), findsWidgets);
    expect(find.text('Tenant'), findsWidgets);
    expect(find.text('Docs'), findsNothing);
    expect(find.textContaining('Renew'), findsNothing);
    expect(find.textContaining('Terminate'), findsNothing);
    expect(find.textContaining('Move-In'), findsNothing);
    expect(find.textContaining('Move-Out'), findsNothing);
    expect(find.textContaining('Inspection Reports'), findsNothing);
    expect(find.textContaining('Application'), findsNothing);
    expect(find.text('View tenant setup'), findsOneWidget);
  });

  testWidgets('pending lease keeps Start Lease but drops the move-in report', (
    tester,
  ) async {
    await _pump(tester, _lease('Lease.Status.Pending'));

    expect(find.text('Start Lease'), findsWidgets);
    expect(find.textContaining('Move-In'), findsNothing);
  });
}
