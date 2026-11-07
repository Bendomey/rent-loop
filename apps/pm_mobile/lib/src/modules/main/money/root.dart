import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/financial/payment_providers.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_roles.dart';
import 'package:rentloop_manager/src/modules/main/activity/activity_filters.dart';
import 'package:rentloop_manager/src/modules/main/money/bill_row.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/rent_focus_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _allProperties = 'All properties';

class MoneyScreen extends ConsumerStatefulWidget {
  const MoneyScreen({super.key});

  @override
  ConsumerState<MoneyScreen> createState() => _MoneyScreenState();
}

class _MoneyScreenState extends ConsumerState<MoneyScreen> {
  BillsView _view = BillsView.owing;
  FilterOption? _property;
  bool? _multipleProperties;
  int? _appliedFocus;
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    final focus = ref.read(rentFocusNotifierProvider);
    if (focus != null) _applyFocus(focus);
  }

  void _applyFocus(RentFocus focus) {
    if (focus.seq == _appliedFocus) return;
    _appliedFocus = focus.seq;
    _view = BillsView.owing;
    _property = focus.property;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  BillsNotifierProvider _provider(BillsView view) =>
      billsNotifierProvider(view, _property?.id);

  Future<void> _loadBoth() => Future.wait([
    ref.read(_provider(BillsView.owing).notifier).loadFirstPage(),
    if (_view == BillsView.paid)
      ref.read(_provider(BillsView.paid).notifier).loadFirstPage(),
  ]);

  void _onScroll() {
    if (!ref.read(_provider(_view)).loadMoreFailed &&
        _scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200) {
      ref.read(_provider(_view).notifier).loadNextPage();
    }
  }

  Future<void> _refresh() async {
    await _loadBoth();
  }

  Future<void> _selectView(String key) async {
    await Haptics.vibrate(HapticsType.selection);
    final next = key == 'paid' ? BillsView.paid : BillsView.owing;
    setState(() => _view = next);
  }

  Future<void> _pickProperty() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final options = propertyOptionsNotifierProvider();
    final picked = await showPagedPickerSheet<FilterOption>(
      context: context,
      title: 'Property',
      state: asFilterOptions(options, id: (p) => p.id, name: (p) => p.name),
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (o) => o.name,
      id: (o) => o.id,
      initial: [?_property],
    );
    if (mounted) ref.read(options.notifier).setSearch('');
    if (picked == null || picked.isEmpty || !mounted) return;
    setState(() => _property = picked.first);
  }

  Future<void> _clearProperty() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _property = null);
  }

  Future<void> _openBill(InvoiceModel bill) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final propertyId = bill.propertyId;
    context.push(
      propertyId == null
          ? '/money/invoices/${bill.id}'
          : '/money/invoices/${bill.id}?property_id=$propertyId',
    );
  }

  Widget _summary(BillsState owing, DateTime now) {
    if (owing.items.isEmpty && owing.error != null) {
      return const SizedBox.shrink();
    }
    if (owing.items.isEmpty && (owing.isLoading || !owing.hasLoaded)) {
      return Shimmer.fromColors(
        baseColor: RLTokens.fill,
        highlightColor: RLTokens.paper,
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
          ),
        ),
      );
    }
    return _SummaryCard(state: owing, now: now);
  }

  @override
  Widget build(BuildContext context) {
    final owing = ref.watch(_provider(BillsView.owing));
    final state = ref.watch(_provider(_view));
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final properties = ref.watch(propertyOptionsNotifierProvider());
    final now = DateTime.now();
    ref.listen(rentFocusNotifierProvider, (_, next) {
      if (next != null) setState(() => _applyFocus(next));
    });
    ref.listen(currentWorkspaceNotifierProvider, (_, __) {
      setState(() {
        _property = null;
        _multipleProperties = null;
      });
    });
    final paidView = _view == BillsView.paid;

    ref.listen(_provider(_view), (prev, next) {
      if (next.error != null &&
          next.error != prev?.error &&
          next.items.isNotEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(next.error!)));
      }
    });

    final showError = state.error != null && state.items.isEmpty;
    final showSkeleton =
        (state.isLoading || !state.hasLoaded) &&
        state.items.isEmpty &&
        state.error == null;
    final showEmpty =
        state.hasLoaded &&
        !state.isLoading &&
        state.error == null &&
        state.items.isEmpty;

    final needsOk = [
      for (final b in owing.items)
        if (canManageProperty(roles, b.propertyId))
          for (final p in awaitingConfirmation(b)) (bill: b, payment: p),
    ];
    if (_multipleProperties == null &&
        properties.hasLoaded &&
        !properties.isLoading &&
        properties.error == null &&
        properties.search.isEmpty) {
      _multipleProperties =
          properties.items.length > 1 || properties.hasNextPage;
    }
    final showPropertyFilter =
        _property != null || (_multipleProperties ?? false);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLTopHeader(title: 'Rent'),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: _refresh,
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      RLTokens.gutter,
                      12,
                      RLTokens.gutter,
                      0,
                    ),
                    sliver: SliverToBoxAdapter(child: _summary(owing, now)),
                  ),
                  if (needsOk.isNotEmpty)
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        18,
                        RLTokens.gutter,
                        0,
                      ),
                      sliver: SliverToBoxAdapter(
                        child: _NeedsOk(items: needsOk, onTap: _openBill),
                      ),
                    ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      RLTokens.gutter,
                      18,
                      RLTokens.gutter,
                      0,
                    ),
                    sliver: SliverToBoxAdapter(
                      child: RLSegmented(
                        items: const [
                          RLSegmentItem(key: 'owing', label: 'Owing'),
                          RLSegmentItem(key: 'paid', label: 'Paid'),
                        ],
                        value: paidView ? 'paid' : 'owing',
                        onChanged: _selectView,
                      ),
                    ),
                  ),
                  if (showPropertyFilter)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          RLTokens.gutter,
                          12,
                          RLTokens.gutter,
                          0,
                        ),
                        child: Row(
                          children: [
                            RLFilterTriggerChip(
                              label: 'Property: $_allProperties',
                              value: _property == null
                                  ? null
                                  : 'Property: ${_property!.name}',
                              onTap: _pickProperty,
                            ),
                            if (_property != null) ...[
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _clearProperty,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: RLTokens.surface,
                                    borderRadius: BorderRadius.circular(
                                      RLTokens.rPill,
                                    ),
                                    border: Border.all(
                                      color: RLTokens.hairline,
                                    ),
                                  ),
                                  child: const Text(
                                    _allProperties,
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 12.5,
                                      fontWeight: RLTokens.semibold,
                                      color: RLTokens.muted,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _BillsSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          body: state.error!,
                          onRetry: () => ref
                              .read(_provider(_view).notifier)
                              .loadFirstPage(),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyBills(paidView: paidView),
                    )
                  else ...[
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        16,
                        RLTokens.gutter,
                        0,
                      ),
                      sliver: SliverList.separated(
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => BillRow(
                          bill: state.items[i],
                          paidView: paidView,
                          now: now,
                          onTap: () => _openBill(state.items[i]),
                        ),
                      ),
                    ),
                    if (state.loadMoreFailed)
                      SliverToBoxAdapter(
                        child: _LoadMoreFailed(
                          onRetry: () => ref
                              .read(_provider(_view).notifier)
                              .loadNextPage(),
                        ),
                      )
                    else if (state.isLoadingMore)
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: RLTokens.crimson,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                  const SliverToBoxAdapter(child: SizedBox(height: 96)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.state, required this.now});
  final BillsState state;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final bills = state.items;
    final sum = bills.fold<int>(0, (s, b) => s + billRemaining(b));
    final late = bills.where((b) => isOverdue(b, now)).length;
    final count = state.hasNextPage ? state.total : bills.length;
    final currency = bills.isEmpty ? defaultCurrencyCode : bills.first.currency;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            state.hasNextPage ? 'UNPAID BILLS · SO FAR' : 'UNPAID BILLS',
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              letterSpacing: 1,
              color: Color(0x8CFFFFFF),
            ),
          ),
          const SizedBox(height: 10),
          RLMoney(
            pesewasToCedis(sum),
            size: 38,
            color: Colors.white,
            currency: currencySymbol(currency),
          ),
          const SizedBox(height: 12),
          Text(
            '$count ${count == 1 ? 'bill' : 'bills'} not paid yet · $late late',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: Color(0xB3FFFFFF),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "Rent not billed yet isn't counted here.",
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: Color(0x8CFFFFFF),
            ),
          ),
        ],
      ),
    );
  }
}

typedef _PendingItem = ({InvoiceModel bill, InvoicePaymentModel payment});

class _NeedsOk extends StatelessWidget {
  const _NeedsOk({required this.items, required this.onTap});
  final List<_PendingItem> items;
  final ValueChanged<InvoiceModel> onTap;

  String _label(String? provider) {
    for (final p in paymentProviders) {
      if (p.value == provider) return p.label;
    }
    return provider ?? 'Offline';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Needs your OK',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 15,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const SizedBox(height: 8),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => onTap(item.bill),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: RLTone.warning.bg,
                  borderRadius: BorderRadius.circular(RLTokens.rLg),
                ),
                child: Text(
                  '${payerName(item.bill)} says they paid '
                  '${formatPesewas(item.payment.amount, code: item.bill.currency)}'
                  ' · ${_label(item.payment.provider)}',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    color: RLTone.warning.fg,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _LoadMoreFailed extends StatelessWidget {
  const _LoadMoreFailed({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            "Couldn't load more.",
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text(
              'Try again',
              style: TextStyle(color: RLTokens.crimson),
            ),
          ),
        ],
      ),
    );
  }
}

class _BillsSkeleton extends StatelessWidget {
  const _BillsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(
        children: List.generate(
          5,
          (_) => Container(
            margin: const EdgeInsets.fromLTRB(
              RLTokens.gutter,
              12,
              RLTokens.gutter,
              0,
            ),
            height: 84,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyBills extends StatelessWidget {
  const _EmptyBills({required this.paidView});
  final bool paidView;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(RLTokens.gutter),
        child: Text(
          paidView ? 'No paid bills yet.' : 'No unpaid bills right now.',
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 15,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
