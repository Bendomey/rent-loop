import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';

typedef Slice<T> = Future<T> Function(Ref ref, String? propertyId);

HomePayments paymentsFor({
  int thisMonth = 0,
  int lastMonth = 0,
  Map<String, int> byProperty = const {},
  String? clientId,
}) {
  final now = DateTime.now();
  return HomePayments(
    months: [
      for (var i = homeTrendMonths - 1; i >= 0; i--)
        HomeMonthTotal(DateTime(now.year, now.month - i, 1), switch (i) {
          0 => thisMonth,
          1 => lastMonth,
          _ => 10000 * i,
        }),
    ],
    thisMonthByProperty: byProperty,
    clientId: clientId,
  );
}

String lastMonthName() {
  final now = DateTime.now();
  return shortMonthName(DateTime(now.year, now.month - 1, 1));
}

/// Fakes for every Home slice. Each slice records how often it was built,
/// keyed `name:propertyId`.
class HomeFakes {
  HomeFakes({
    Slice<HomePayments>? payments,
    Slice<HomeCharges>? charges,
    Slice<HomeLeases>? leases,
    Slice<HomeRepairs>? repairs,
    Slice<HomeUnits>? units,
    Slice<HomePendingTenants>? pending,
    Future<HomePropertyNames> Function(Ref ref)? names,
  }) : payments =
           payments ??
           ((_, __) async => paymentsFor(
             thisMonth: 220000,
             lastMonth: 196000,
             byProperty: {'p1': 150000, 'p2': 70000},
           )),
       charges =
           charges ??
           ((_, __) async => const HomeCharges(
             stillToCollect: 615000,
             late: 15000,
             lateProperties: 1,
           )),
       leases =
           leases ??
           ((_, __) async => const HomeLeases(active: 1, expiring: 2)),
       repairs =
           repairs ?? ((_, __) async => const HomeRepairs(open: 3, urgent: 1)),
       units =
           units ??
           ((_, __) async => const HomeUnits(total: 2, occupied: 1, empty: 1)),
       pending =
           pending ?? ((_, __) async => const HomePendingTenants(count: 0)),
       names =
           names ??
           ((_) async => const HomePropertyNames(
             names: {'p1': 'Ama Court', 'p2': 'Bay View', 'p3': 'Cedar'},
           ));

  Slice<HomePayments> payments;
  Slice<HomeCharges> charges;
  Slice<HomeLeases> leases;
  Slice<HomeRepairs> repairs;
  Slice<HomeUnits> units;
  Slice<HomePendingTenants> pending;
  Future<HomePropertyNames> Function(Ref ref) names;

  final calls = <String, int>{};

  Future<T> _track<T>(String key, Future<T> Function() run) {
    calls[key] = (calls[key] ?? 0) + 1;
    return run();
  }

  List<Override> overrides({List<String?> ids = const [null, 'p1']}) => [
    for (final id in ids) ...[
      homePaymentsProvider(
        id,
      ).overrideWith((ref) => _track('payments:$id', () => payments(ref, id))),
      homeChargesProvider(
        id,
      ).overrideWith((ref) => _track('charges:$id', () => charges(ref, id))),
      homeLeasesProvider(
        id,
      ).overrideWith((ref) => _track('leases:$id', () => leases(ref, id))),
      homeRepairsProvider(
        id,
      ).overrideWith((ref) => _track('repairs:$id', () => repairs(ref, id))),
      homeUnitsProvider(
        id,
      ).overrideWith((ref) => _track('units:$id', () => units(ref, id))),
      homePendingTenantsProvider(
        id,
      ).overrideWith((ref) => _track('pending:$id', () => pending(ref, id))),
    ],
    homePropertyNamesProvider.overrideWith(
      (ref) => _track('names', () => names(ref)),
    ),
  ];
}
