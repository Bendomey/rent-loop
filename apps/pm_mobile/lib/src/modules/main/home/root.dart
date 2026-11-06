import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/workspace_resolution.dart';
import 'package:rentloop_manager/src/modules/main/workspace_sheet.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:shimmer/shimmer.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: RefreshIndicator(
        color: RLTokens.crimson,
        onRefresh: () async {
          await Haptics.vibrate(HapticsType.light);
          ref.invalidate(homeStatsProvider);
          ref.invalidate(activityCountsProvider);
          try {
            await ref.read(homeStatsProvider.future);
          } catch (_) {
            // A failed refresh keeps the numbers already on screen.
          }
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _TopHeader()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const _MoneyCard(),
                  const SizedBox(height: 10),
                  const _StatGrid(),
                  const SizedBox(height: 22),
                  _QuickActionsSection(),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
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
    final hasMultipleWorkspaces =
        ref
            .watch(currentUserNotifierProvider)
            ?.clientUsers
            .where(isActiveClientUser)
            .length !=
        1;

    final nameText = Text(
      workspaceName,
      style: TextStyle(
        fontFamily: RLTokens.fontMono,
        fontSize: 10.5,
        fontWeight: RLTokens.semibold,
        letterSpacing: 1,
        color: RLTokens.crimson,
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
          : nameText,
      title: 'Good morning',
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

class _MoneyCard extends ConsumerWidget {
  const _MoneyCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
    final stats = ref.watch(homeStatsProvider);
    final value = stats.valueOrNull;
    final data = value?.clientId == clientId ? value : null;

    if (data == null && (stats.isLoading || !stats.hasError)) {
      return Shimmer.fromColors(
        baseColor: RLTokens.fill,
        highlightColor: RLTokens.paper,
        child: Container(
          height: 150,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: data == null
          ? Column(
              children: [
                Text(
                  "Couldn't load your numbers.",
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    color: Colors.white.withAlpha(204),
                  ),
                ),
                const SizedBox(height: 14),
                RLBtn(
                  label: 'Try again',
                  large: false,
                  onPressed: () => ref.invalidate(homeStatsProvider),
                ),
              ],
            )
          : _MoneyCardBody(data),
    );
  }
}

class _MoneyCardBody extends StatelessWidget {
  const _MoneyCardBody(this.stats);
  final HomeStats stats;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Collected this month',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 12.5,
            color: Colors.white.withAlpha(153),
          ),
        ),
        const SizedBox(height: 12),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: RLMoney(
            pesewasToCedis(stats.collectedThisMonth),
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
            Text(
              formatPesewas(stats.stillToCollect),
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 14,
                fontWeight: RLTokens.semibold,
                color: Colors.white,
              ),
            ),
          ],
        ),
        if (stats.late > 0) ...[
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${formatPesewas(stats.late)} of it is late',
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

class _StatGrid extends ConsumerWidget {
  const _StatGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
    final stats = ref.watch(homeStatsProvider);
    final counts = ref.watch(activityCountsProvider);
    final statsValue = stats.valueOrNull;
    final countsValue = counts.valueOrNull;
    final statsData = statsValue?.clientId == clientId ? statsValue : null;
    final countsData = countsValue?.clientId == clientId ? countsValue : null;

    String? shown(
      AsyncValue<Object?> async,
      Object? data,
      String Function() f,
    ) {
      if (data != null) return f();
      return async.hasError && !async.isLoading ? '—' : null;
    }

    final emptyUnits = shown(
      stats,
      statsData,
      () => '${statsData!.emptyUnits} of ${statsData.totalUnits}',
    );
    final repairs = shown(
      counts,
      countsData,
      () => '${countsData!.maintenance}',
    );
    final pending = shown(
      counts,
      countsData,
      () => '${countsData!.applications}',
    );

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: _StatCard(
              value: emptyUnits,
              label: 'Empty units',
              onTap: () => context.go('/properties'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _StatCard(
              value: repairs,
              label: 'Open repairs',
              onTap: () => context.push('/repairs'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _StatCard(
              value: pending,
              label: 'Pending tenants',
              onTap: () => context.go('/tenants'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.value,
    required this.label,
    required this.onTap,
  });

  /// Null while loading.
  final String? value;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final loading = value == null;
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: loading
            ? Shimmer.fromColors(
                baseColor: RLTokens.fill,
                highlightColor: RLTokens.paper,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      value!,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSerif,
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
                      fontSize: 11.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _QuickActionsSection extends ConsumerWidget {
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
      label: 'Announcement',
      route: '/more/announcements/add',
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final managesAny = roles?.values.any((r) => r == 'MANAGER') ?? false;
    final actions = [
      for (final a in _actions)
        if (a.route != '/money/record-payment' || managesAny) a,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RLLabel('Quick actions'),
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
