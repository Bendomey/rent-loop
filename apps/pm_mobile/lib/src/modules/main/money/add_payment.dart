import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/property_roles.dart';
import 'package:rentloop_manager/src/modules/main/money/bill_row.dart';
import 'package:rentloop_manager/src/modules/main/money/record_bill_payment_sheet.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/record_bill_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class RecordPaymentScreen extends ConsumerStatefulWidget {
  const RecordPaymentScreen({super.key});

  @override
  ConsumerState<RecordPaymentScreen> createState() =>
      _RecordPaymentScreenState();
}

class _RecordPaymentScreenState extends ConsumerState<RecordPaymentScreen> {
  static const _maxFillPages = 5;
  static final _owing = billsNotifierProvider(
    BillsView.owing,
    null,
    picker: true,
  );

  late final ScrollController _scrollController;
  late final TextEditingController _searchController;
  Timer? _searchDebounce;
  String _search = '';
  int _fillPages = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() {
    _fillPages = 0;
    return ref
        .read(_owing.notifier)
        .loadFirstPage(search: _search.isEmpty ? null : _search);
  }

  void _fillVisible() {
    if (_fillPages >= _maxFillPages) return;
    _fillPages++;
    ref.read(_owing.notifier).loadNextPage();
  }

  void _onScroll() {
    if (!ref.read(_owing).loadMoreFailed &&
        _scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200) {
      ref.read(_owing.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      _search = value.trim();
      _load();
    });
  }

  Future<void> _refresh() async {
    ref.invalidate(myPropertyRolesProvider);
    await _load();
  }

  Future<void> _record(InvoiceModel listed) async {
    await Haptics.vibrate(HapticsType.selection);
    final propertyId = listed.propertyId;
    if (propertyId == null || !mounted) return;

    if (awaitingConfirmation(listed).isNotEmpty) {
      context.push('/money/invoices/${listed.id}?property_id=$propertyId');
      return;
    }

    var bill = listed;
    if (bill.payments.isEmpty) {
      try {
        bill = await ref.read(billDetailProvider(propertyId, bill.id).future);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              translateApiErrorMessage(
                errorMessage: e is ApiException ? e.message : null,
              ),
            ),
          ),
        );
        return;
      }
    }
    if (!mounted) return;
    ref.read(recordBillPaymentNotifierProvider.notifier).reset();
    showRLSheet(
      context,
      (close) => RecordBillPaymentSheet(
        bill: bill,
        propertyId: propertyId,
        onClose: close,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(_owing);
    final rolesAsync = ref.watch(myPropertyRolesProvider);
    final roles = rolesAsync.valueOrNull;
    final now = DateTime.now();

    final bills = [
      for (final b in state.items)
        if (canManageProperty(roles, b.propertyId)) b,
    ];
    final loading =
        state.items.isEmpty && (state.isLoading || !state.hasLoaded);
    final showSkeleton =
        (loading || (rolesAsync.isLoading && roles == null)) && bills.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final fillPending =
        roles != null &&
        bills.isEmpty &&
        state.items.isNotEmpty &&
        state.hasNextPage &&
        !state.loadMoreFailed &&
        (_fillPages < _maxFillPages || state.isLoadingMore);
    if (fillPending && !state.isLoading && !state.isLoadingMore) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _fillVisible();
      });
    }
    final showEmpty =
        !showSkeleton && !showError && !fillPending && bills.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Which bill did they pay?',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: _refresh,
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        12,
                        RLTokens.gutter,
                        0,
                      ),
                      child: RLSearchBar(
                        hint: 'Search by bill code',
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                      ),
                    ),
                  ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _PickerSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          body: state.error!,
                          onRetry: _load,
                        ),
                      ),
                    )
                  else if (showEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.all(RLTokens.gutter),
                          child: Text(
                            'No bills to record a payment on.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 15,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.ink,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
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
                        itemCount: bills.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => BillRow(
                          bill: bills[i],
                          paidView: false,
                          now: now,
                          onTap: () => _record(bills[i]),
                        ),
                      ),
                    ),
                    if (state.loadMoreFailed)
                      SliverToBoxAdapter(
                        child: Padding(
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
                                onPressed: () =>
                                    ref.read(_owing.notifier).loadNextPage(),
                                child: const Text(
                                  'Try again',
                                  style: TextStyle(color: RLTokens.crimson),
                                ),
                              ),
                            ],
                          ),
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
                  const SliverToBoxAdapter(child: SizedBox(height: 40)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PickerSkeleton extends StatelessWidget {
  const _PickerSkeleton();

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
