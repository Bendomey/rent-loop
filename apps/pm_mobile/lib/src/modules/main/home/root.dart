import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/workspace_resolution.dart';
import 'package:rentloop_manager/src/modules/main/activity/activity_filters.dart';
import 'package:rentloop_manager/src/modules/main/leases/root.dart'
    show leasesEndingSoonFilter;
import 'package:rentloop_manager/src/modules/main/workspace_sheet.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/money/rent_focus_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:shimmer/shimmer.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.light);
    for (final p in homeStatsProviders) {
      ref.invalidate(p);
    }
    final id = ref.read(homePropertyProvider)?.id;
    await Future.wait<void>([
      for (final f in <Future<Object?>>[
        ref.read(homePaymentsProvider(id).future),
        ref.read(homeChargesProvider(id).future),
        ref.read(homeLeasesProvider(id).future),
        ref.read(homeRepairsProvider(id).future),
        ref.read(homeUnitsProvider(id).future),
        ref.read(homePendingTenantsProvider(id).future),
        if (id == null) ref.read(homePropertyNamesProvider.future),
      ])
        // A failed refresh keeps the numbers already on screen.
        f.then((_) {}, onError: (_) {}),
    ]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoped = ref.watch(homePropertyProvider) != null;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          RefreshIndicator(
            color: RLTokens.crimson,
            onRefresh: () => _refresh(ref),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(child: _TopHeader()),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      const _PropertySwitcher(),
                      const SizedBox(height: 12),
                      const _MoneyCard(),
                      const _AttentionSection(),
                      const SizedBox(height: 14),
                      const _UnitsGrid(),
                      const _RentTrendSection(),
                      if (!scoped) const _PropertiesSection(),
                      _QuickActionsSection(),
                      const SizedBox(height: 40),
                    ]),
                  ),
                ),
              ],
            ),
          ),
          // Keeps scrolled content from running under the clock and notch.
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.paddingOf(context).top,
            child: const ColoredBox(color: RLTokens.surface),
          ),
        ],
      ),
    );
  }
}

enum _Phase { loading, failed, ready }

T? _current<T extends HomeSlice>(AsyncValue<T> value, String? clientId) {
  final data = value.valueOrNull;
  return data?.clientId == clientId ? data : null;
}

_Phase _phaseOf(List<AsyncValue<HomeSlice>> values, String? clientId) {
  if (values.every((v) => _current(v, clientId) != null)) return _Phase.ready;
  final failed = values.any(
    (v) => _current(v, clientId) == null && v.hasError && !v.isLoading,
  );
  return failed ? _Phase.failed : _Phase.loading;
}

String? _clientId(WidgetRef ref) =>
    ref.watch(currentWorkspaceNotifierProvider)?.clientId;

String? _propertyId(WidgetRef ref) => ref.watch(homePropertyProvider)?.id;

String _withProperty(String path, FilterOption? property, [Map? extra]) => Uri(
  path: path,
  queryParameters: {
    ...?extra?.cast<String, String>(),
    if (property != null) 'property_id': property.id,
    if (property != null) 'property_name': property.name,
  },
).toString().replaceFirst(RegExp(r'\?$'), '');

Future<void> _tap(BuildContext context, VoidCallback go) async {
  await Haptics.vibrate(HapticsType.selection);
  if (context.mounted) go();
}

class _Skeleton extends StatelessWidget {
  const _Skeleton({required this.height});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
        ),
      ),
    );
  }
}

class _Failed extends StatelessWidget {
  const _Failed({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return RLSectionError(
      compact: true,
      title: "Couldn't load this.",
      onRetry: onRetry,
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 24, 2, 10),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: RLTokens.fontSerif,
          fontWeight: RLTokens.headingWeight,
          fontSize: RLTokens.textCardHead,
          letterSpacing: -0.2,
          color: RLTokens.ink,
          height: 1.2,
        ),
      ),
    );
  }
}

class _TopHeader extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceName =
        ref.watch(currentWorkspaceNotifierProvider)?.client?.name ??
        'your workspace';
    final managerName =
        ref.watch(currentUserNotifierProvider)?.name ?? 'Manager';
    final firstName = managerName.trim().split(RegExp(r'\s+')).first;
    final hasMultipleWorkspaces =
        ref
            .watch(currentUserNotifierProvider)
            ?.clientUsers
            .where(isActiveClientUser)
            .length !=
        1;

    final nameText = Flexible(
      child: Text(
        workspaceName,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 10.5,
          fontWeight: RLTokens.semibold,
          letterSpacing: 1,
          color: RLTokens.crimson,
        ),
      ),
    );

    return RLTopHeader(
      eyebrow: hasMultipleWorkspaces
          ? GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  await showWorkspaceSheet(context);
                }
              },
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  nameText,
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 14,
                    color: RLTokens.crimson,
                  ),
                ],
              ),
            )
          : Row(mainAxisSize: MainAxisSize.min, children: [nameText]),
      title: '${greetingFor(DateTime.now())}, $firstName',
      trailing: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) context.push('/more/my-profile');
          },
          child: RLAvatar(managerName, size: 38, crimsonTone: true),
        ),
      ],
    );
  }
}

class _PropertySwitcher extends ConsumerWidget {
  const _PropertySwitcher();

  Future<void> _pick(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    final options = propertyOptionsNotifierProvider();
    final current = ref.read(homePropertyProvider);
    final picked = await showPagedPickerSheet<FilterOption>(
      context: context,
      title: 'Property',
      state: asFilterOptions(options, id: (p) => p.id, name: (p) => p.name),
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (o) => o.name,
      id: (o) => o.id,
      initial: [?current],
    );
    if (context.mounted) ref.read(options.notifier).setSearch('');
    if (picked == null || picked.isEmpty || !context.mounted) return;
    ref.read(homePropertyProvider.notifier).select(picked.first);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final property = ref.watch(homePropertyProvider);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _Chip(
          label: property?.name ?? 'All properties',
          active: property != null,
          trailingIcon: Icons.keyboard_arrow_down_rounded,
          onTap: () => _pick(context, ref),
        ),
        if (property != null)
          _Chip(
            label: 'All properties',
            active: false,
            onTap: () => _tap(
              context,
              () => ref.read(homePropertyProvider.notifier).select(null),
            ),
          ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.active,
    required this.onTap,
    this.trailingIcon,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;
  final IconData? trailingIcon;

  @override
  Widget build(BuildContext context) {
    final color = active ? RLTokens.crimson : RLTokens.inkSoft;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? RLTokens.crimsonTint : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rPill),
          border: Border.all(
            color: active ? RLTokens.crimson : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: color,
                ),
              ),
            ),
            if (trailingIcon != null) ...[
              const SizedBox(width: 4),
              Icon(trailingIcon, size: 16, color: color),
            ],
          ],
        ),
      ),
    );
  }
}

class _MoneyCard extends ConsumerWidget {
  const _MoneyCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = _clientId(ref);
    final id = _propertyId(ref);
    final payments = ref.watch(homePaymentsProvider(id));
    final charges = ref.watch(homeChargesProvider(id));

    switch (_phaseOf([payments, charges], clientId)) {
      case _Phase.loading:
        return const _Skeleton(height: 150);
      case _Phase.failed:
        return _Failed(
          onRetry: () {
            ref.invalidate(homePaymentsProvider(id));
            ref.invalidate(homeChargesProvider(id));
          },
        );
      case _Phase.ready:
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: RLTokens.ink,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
          ),
          child: _MoneyCardBody(
            payments: _current(payments, clientId)!,
            charges: _current(charges, clientId)!,
          ),
        );
    }
  }
}

class _MoneyCardBody extends StatelessWidget {
  const _MoneyCardBody({required this.payments, required this.charges});
  final HomePayments payments;
  final HomeCharges charges;

  @override
  Widget build(BuildContext context) {
    final change = percentChange(payments.thisMonth, payments.lastMonth);
    final lastMonthName = payments.months.length < 2
        ? ''
        : shortMonthName(payments.months[payments.months.length - 2].month);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 6,
          children: [
            Text(
              'Collected this month',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: Colors.white.withAlpha(153),
              ),
            ),
            if (change != null)
              _ChangeBadge(percent: change, monthName: lastMonthName),
          ],
        ),
        const SizedBox(height: 12),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: RLMoney(
            pesewasToCedis(payments.thisMonth),
            size: 40,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 14),
        Container(height: 1, color: Colors.white.withAlpha(26)),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: Text(
                'Still to collect',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: Colors.white.withAlpha(166),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerRight,
                child: Text(
                  formatPesewas(charges.stillToCollect),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.semibold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
        if (charges.late > 0) ...[
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${formatPesewas(charges.late)} of it is late',
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: RLTokens.semibold,
                color: Color(0xFFFF6F8E),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ChangeBadge extends StatelessWidget {
  const _ChangeBadge({required this.percent, required this.monthName});
  final int percent;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final up = percent >= 0;
    final color = up ? const Color(0xFF6FD99B) : const Color(0xFFFF6F8E);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(20),
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        '${up ? '▲' : '▼'} ${percent.abs()}% vs $monthName',
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 11.5,
          fontWeight: RLTokens.semibold,
          color: color,
        ),
      ),
    );
  }
}

class _AttentionSection extends ConsumerWidget {
  const _AttentionSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = _clientId(ref);
    final property = ref.watch(homePropertyProvider);
    final id = property?.id;
    final charges = ref.watch(homeChargesProvider(id));
    final leases = ref.watch(homeLeasesProvider(id));
    final repairs = ref.watch(homeRepairsProvider(id));

    final Widget body;
    switch (_phaseOf([charges, leases, repairs], clientId)) {
      case _Phase.loading:
        body = const _Skeleton(height: 150);
      case _Phase.failed:
        body = _Failed(
          onRetry: () {
            ref.invalidate(homeChargesProvider(id));
            ref.invalidate(homeLeasesProvider(id));
            ref.invalidate(homeRepairsProvider(id));
          },
        );
      case _Phase.ready:
        body = _AttentionRows(
          property: property,
          charges: _current(charges, clientId)!,
          leases: _current(leases, clientId)!,
          repairs: _current(repairs, clientId)!,
        );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [const _Heading('Needs your attention'), body],
    );
  }
}

String _plural(int n, String one, String many) => n == 1 ? one : many;

class _AttentionRows extends ConsumerWidget {
  const _AttentionRows({
    required this.property,
    required this.charges,
    required this.leases,
    required this.repairs,
  });

  final FilterOption? property;
  final HomeCharges charges;
  final HomeLeases leases;
  final HomeRepairs repairs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lateWhere = property == null && charges.lateProperties > 0
        ? ' · ${charges.lateProperties} '
              '${_plural(charges.lateProperties, 'property', 'properties')}'
        : '';
    final rows = [
      if (charges.late > 0)
        _AttentionRow(
          icon: Icons.error_outline_rounded,
          tone: RLTone.danger,
          text: '${formatPesewas(charges.late)} rent is late$lateWhere',
          onTap: () => _tap(context, () {
            ref
                .read(rentFocusNotifierProvider.notifier)
                .showOwing(property: property);
            context.go('/money');
          }),
        ),
      if (leases.expiring > 0)
        _AttentionRow(
          icon: Icons.hourglass_bottom_rounded,
          tone: RLTone.warning,
          text:
              '${leases.expiring} '
              '${_plural(leases.expiring, 'lease is', 'leases are')} '
              'ending soon',
          onTap: () => _tap(
            context,
            () => context.push(
              _withProperty('/more/leases', property, {
                'filter': leasesEndingSoonFilter,
              }),
            ),
          ),
        ),
      if (repairs.open > 0)
        _AttentionRow(
          icon: Icons.build_outlined,
          tone: RLTone.info,
          text:
              '${repairs.open} open '
              '${_plural(repairs.open, 'repair', 'repairs')}'
              '${repairs.urgent > 0 ? ' · ${repairs.urgent} urgent' : ''}',
          onTap: () => _tap(
            context,
            () => context.push(_withProperty('/repairs', property)),
          ),
        ),
    ];

    if (rows.isEmpty) {
      return RLCard(
        child: Row(
          children: [
            const RLIconTile(
              icon: Icons.check_circle_outline_rounded,
              tone: RLTone.success,
              size: 34,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Nothing needs your attention.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: RLTokens.textBody,
                  color: RLTokens.inkSoft,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      child: Column(
        children: [
          for (final (i, row) in rows.indexed) ...[
            if (i > 0) Container(height: 1, color: RLTokens.hairlineSoft),
            row,
          ],
        ],
      ),
    );
  }
}

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({
    required this.icon,
    required this.tone,
    required this.text,
    required this.onTap,
  });

  final IconData icon;
  final RLTone tone;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            RLIconTile(icon: icon, tone: tone, size: 34),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: RLTokens.textBody,
                  fontWeight: RLTokens.medium,
                  color: RLTokens.ink,
                  height: 1.3,
                ),
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, size: 18, color: RLTokens.micro),
          ],
        ),
      ),
    );
  }
}

class _UnitsGrid extends ConsumerWidget {
  const _UnitsGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = _clientId(ref);
    final property = ref.watch(homePropertyProvider);
    final id = property?.id;
    final units = ref.watch(homeUnitsProvider(id));
    final leases = ref.watch(homeLeasesProvider(id));
    final pending = ref.watch(homePendingTenantsProvider(id));

    switch (_phaseOf([units, leases, pending], clientId)) {
      case _Phase.loading:
        return const _Skeleton(height: 170);
      case _Phase.failed:
        return _Failed(
          onRetry: () {
            ref.invalidate(homeUnitsProvider(id));
            ref.invalidate(homeLeasesProvider(id));
            ref.invalidate(homePendingTenantsProvider(id));
          },
        );
      case _Phase.ready:
    }
    final u = _current(units, clientId)!;
    final l = _current(leases, clientId)!;
    final p = _current(pending, clientId)!;

    void openProperties() => _tap(
      context,
      () => property == null
          ? context.go('/properties')
          : context.push('/properties/${property.id}'),
    );

    Widget pair(Widget a, Widget b) => IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: a),
          const SizedBox(width: 10),
          Expanded(child: b),
        ],
      ),
    );

    return Column(
      children: [
        pair(
          _StatCard(
            value: '${u.occupiedPercent}%',
            label: 'Occupied · ${u.occupied} of ${u.total}',
            onTap: openProperties,
          ),
          _StatCard(
            value: '${l.active}',
            label: _plural(l.active, 'Active lease', 'Active leases'),
            onTap: () => _tap(
              context,
              () => context.push(
                _withProperty('/more/leases', property, {'filter': 'Active'}),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        pair(
          _StatCard(
            value: '${u.empty}',
            label: _plural(u.empty, 'Empty unit', 'Empty units'),
            onTap: openProperties,
          ),
          _StatCard(
            value: '${p.count}',
            label: _plural(p.count, 'Pending tenant', 'Pending tenants'),
            onTap: () => _tap(context, () => context.go('/tenants')),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.value,
    required this.label,
    required this.onTap,
  });

  final String value;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontWeight: RLTokens.headingWeight,
                  fontSize: 24,
                  color: RLTokens.ink,
                  letterSpacing: -0.4,
                  height: 1,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12,
                color: RLTokens.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RentTrendSection extends ConsumerWidget {
  const _RentTrendSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = _clientId(ref);
    final id = _propertyId(ref);
    final payments = ref.watch(homePaymentsProvider(id));

    final Widget body;
    switch (_phaseOf([payments], clientId)) {
      case _Phase.loading:
        body = const _Skeleton(height: 190);
      case _Phase.failed:
        body = _Failed(onRetry: () => ref.invalidate(homePaymentsProvider(id)));
      case _Phase.ready:
        body = RLCard(
          child: _RentBars(
            key: ValueKey(id),
            months: _current(payments, clientId)!.months,
          ),
        );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _Heading('Rent collected — last $homeTrendMonths months'),
        body,
      ],
    );
  }
}

class _RentBars extends StatefulWidget {
  const _RentBars({super.key, required this.months});
  final List<HomeMonthTotal> months;

  @override
  State<_RentBars> createState() => _RentBarsState();
}

class _RentBarsState extends State<_RentBars> {
  int? _selected;

  static const _barsHeight = 110.0;

  @override
  Widget build(BuildContext context) {
    final months = widget.months;
    if (months.isEmpty) return const SizedBox.shrink();
    final selected = (_selected ?? months.length - 1).clamp(
      0,
      months.length - 1,
    );
    final max = months.fold<int>(0, (m, e) => e.amount > m ? e.amount : m);
    final picked = months[selected];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          shortMonthName(picked.month),
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: RLTokens.textSubtitle,
            color: RLTokens.muted,
          ),
        ),
        const SizedBox(height: 2),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: RLMoney(pesewasToCedis(picked.amount), size: 22),
        ),
        const SizedBox(height: 14),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (final (i, m) in months.indexed)
              Expanded(
                child: Semantics(
                  button: true,
                  selected: i == selected,
                  label:
                      '${shortMonthName(m.month)}: ${formatPesewas(m.amount)}',
                  child: GestureDetector(
                    key: ValueKey('rent-bar-$i'),
                    behavior: HitTestBehavior.opaque,
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (mounted) setState(() => _selected = i);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            height: _barsHeight,
                            child: Align(
                              alignment: Alignment.bottomCenter,
                              child: Container(
                                height: max == 0
                                    ? 3
                                    : (m.amount / max * _barsHeight).clamp(
                                        3,
                                        _barsHeight,
                                      ),
                                decoration: BoxDecoration(
                                  color: i == selected
                                      ? RLTokens.crimson
                                      : RLTokens.crimsonTint2,
                                  borderRadius: BorderRadius.circular(5),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              shortMonthName(m.month),
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 11,
                                fontWeight: i == selected
                                    ? RLTokens.semibold
                                    : RLTokens.regular,
                                color: i == selected
                                    ? RLTokens.ink
                                    : RLTokens.muted,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _PropertyAmountRow extends StatelessWidget {
  const _PropertyAmountRow({required this.row, required this.onTap});
  final HomePropertyAmount row;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Text(
                row.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: RLTokens.textRowTitle,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.ink,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              flex: 2,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerRight,
                child: Text(
                  formatPesewas(row.amount),
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: RLTokens.textBody,
                    fontWeight: RLTokens.semibold,
                    color: row.amount > 0 ? RLTokens.ink : RLTokens.mutedSoft,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 17, color: RLTokens.micro),
          ],
        ),
      ),
    );
  }
}

class _PropertiesSection extends ConsumerStatefulWidget {
  const _PropertiesSection();

  @override
  ConsumerState<_PropertiesSection> createState() => _PropertiesSectionState();
}

class _PropertiesSectionState extends ConsumerState<_PropertiesSection> {
  static const _collapsedCount = 5;
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final clientId = _clientId(ref);
    final payments = ref.watch(homePaymentsProvider(null));
    final names = ref.watch(homePropertyNamesProvider);

    final Widget body;
    switch (_phaseOf([payments, names], clientId)) {
      case _Phase.loading:
        body = const _Skeleton(height: 160);
      case _Phase.failed:
        body = _Failed(
          onRetry: () {
            ref.invalidate(homePaymentsProvider(null));
            ref.invalidate(homePropertyNamesProvider);
          },
        );
      case _Phase.ready:
        final rows = rankHomeProperties(
          amounts: _current(payments, clientId)!.thisMonthByProperty,
          names: _current(names, clientId)!.names,
        );
        body = rows.isEmpty
            ? RLCard(
                child: Text(
                  'No properties yet.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: RLTokens.textBody,
                    color: RLTokens.muted,
                  ),
                ),
              )
            : _rankList(rows);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [const _Heading('Your properties this month'), body],
    );
  }

  Widget _rankList(List<HomePropertyAmount> rows) {
    final shown = _expanded ? rows : rows.take(_collapsedCount).toList();
    final hidden = rows.length - shown.length;
    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      child: Column(
        children: [
          for (final (i, row) in shown.indexed) ...[
            if (i > 0) Container(height: 1, color: RLTokens.hairlineSoft),
            _PropertyAmountRow(
              row: row,
              onTap: () =>
                  _tap(context, () => context.push('/properties/${row.id}')),
            ),
          ],
          if (hidden > 0 || _expanded)
            Container(height: 1, color: RLTokens.hairlineSoft),
          if (hidden > 0 || _expanded)
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => _tap(context, () {
                if (mounted) setState(() => _expanded = !_expanded);
              }),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 13),
                child: Center(
                  child: Text(
                    _expanded ? 'Show fewer' : 'Show all ${rows.length}',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: RLTokens.textSubtitle,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.crimson,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _QuickActionsSection extends ConsumerWidget {
  static const _managerOnlyRoutes = {
    '/money/record-payment',
    '/more/announcements/add',
  };

  static const _actions = [
    _QuickAction(
      icon: Icons.person_add_alt_1_outlined,
      label: 'Add tenant',
      route: '/activity/applications/add',
    ),
    _QuickAction(
      icon: Icons.credit_card_outlined,
      label: 'Record payment',
      route: '/money/record-payment',
    ),
    _QuickAction(
      icon: Icons.build_outlined,
      label: 'Repairs',
      route: '/repairs',
    ),
    _QuickAction(
      icon: Icons.campaign_outlined,
      label: 'Announce',
      route: '/more/announcements/add',
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final managesAny = roles?.values.any((r) => r == 'MANAGER') ?? false;
    final actions = [
      for (final a in _actions)
        if (!_managerOnlyRoutes.contains(a.route) || managesAny) a,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Heading('Quick actions'),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children: actions
                .asMap()
                .entries
                .map(
                  (e) => Padding(
                    padding: EdgeInsets.only(
                      right: e.key < actions.length - 1 ? 10 : 0,
                    ),
                    child: _QuickChip(action: e.value),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _QuickAction {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.route,
  });
  final IconData icon;
  final String label;
  final String route;
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.action});
  final _QuickAction action;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push(action.route);
      },
      child: SizedBox(
        width: 66,
        child: Column(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Icon(action.icon, size: 22, color: RLTokens.crimson),
            ),
            const SizedBox(height: 8),
            Text(
              action.label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11,
                fontWeight: RLTokens.medium,
                color: RLTokens.inkSoft,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}
