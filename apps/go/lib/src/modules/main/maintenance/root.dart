import 'dart:async';

import 'package:rentloop_go/src/api/maintenance.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/repository/notifiers/maintenance/maintenance_requests_notifier/maintenance_requests_notifier.dart';
import 'package:rentloop_go/src/shared/adaptive/menu.dart';
import 'package:rentloop_go/src/shared/adaptive/search_input.dart';
import 'package:rentloop_go/src/shared/screen_states.dart';
import './request_card.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key, this.statusFilter});

  final String? statusFilter;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _MaintenanceScreen();
}

class _MaintenanceScreen extends ConsumerState<MaintenanceScreen> {
  bool _showSearchBar = false;
  bool _isPullRefreshing = false;
  late final TextEditingController _searchController;
  late MaintenanceRequestQuery _query;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _query = MaintenanceRequestQuery(
      status: widget.statusFilter,
      sort: '-createdAt',
    );
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(maintenanceRequestsNotifierProvider.notifier)
          .loadFirstPage(_query);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(maintenanceRequestsNotifierProvider.notifier).loadNextPage();
    }
  }

  void _applyQuery(MaintenanceRequestQuery query) {
    setState(() => _query = query);
    ref.read(maintenanceRequestsNotifierProvider.notifier).loadFirstPage(query);
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      _applyQuery(_query.copyWith(search: value, clearSearch: value.isEmpty));
    });
  }

  bool get _hasActiveFilters =>
      _query.status != null ||
      _query.priority != null ||
      _query.category != null ||
      (_query.search?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(maintenanceRequestsNotifierProvider);

    // Show controls while doing the initial skeleton load, when there is data,
    // or when filters/search are active (so the user can clear them).
    final showControls =
        (state.isLoading && state.items.isEmpty) ||
        state.items.isNotEmpty ||
        _hasActiveFilters;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Requests',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
        leading: state.isLoading && state.items.isNotEmpty && !_isPullRefreshing
            ? Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              )
            : null,
        actions: [
          if (showControls) ...[
            // Status filter menu
            AdaptiveMenu(
              title: 'Filter by Status',
              selected: _query.status ?? 'all',
              items: [
                MenuItem(value: 'all', label: 'All', isDefaultAction: true),
                MenuItem(value: 'PENDING', label: 'Pending'),
                MenuItem(value: 'IN_PROGRESS', label: 'In Progress'),
                MenuItem(value: 'RESOLVED', label: 'Resolved'),
              ],
              onSelected: (value) async {
                await Haptics.vibrate(HapticsType.selection);
                _applyQuery(
                  _query.copyWith(
                    clearStatus: value == 'all',
                    status: value == 'all' ? null : value,
                  ),
                );
              },
              icon: Badge.count(
                count: _hasActiveFilters ? 1 : 0,
                backgroundColor: Colors.blueAccent,
                child: Icon(Icons.filter_list, size: 27),
              ),
            ),
            // Search toggle
            if (_showSearchBar)
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  _searchDebounce?.cancel();
                  _searchController.clear();
                  setState(() => _showSearchBar = false);
                  _applyQuery(_query.copyWith(clearSearch: true));
                },
              )
            else
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  setState(() => _showSearchBar = true);
                },
              ),
          ] else
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                ref
                    .read(maintenanceRequestsNotifierProvider.notifier)
                    .loadFirstPage(_query);
              },
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _isPullRefreshing = true);
          await ref
              .read(maintenanceRequestsNotifierProvider.notifier)
              .loadFirstPage(_query);
          if (mounted) setState(() => _isPullRefreshing = false);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Column(
            children: [
              if (showControls && _showSearchBar)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: AdaptiveSearchInput(
                    hintText: 'Search by title or code',
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                  ),
                ),
              if (state.isLoading && state.items.isEmpty)
                const Expanded(child: _RequestListShimmer())
              else if (state.error != null && state.items.isEmpty)
                Expanded(
                  child: ScreenErrorState(
                    title: 'Failed to load requests',
                    subtitle:
                        'Check your connection and pull down to try again.',
                    onRetry: () => ref
                        .read(maintenanceRequestsNotifierProvider.notifier)
                        .loadFirstPage(_query),
                  ),
                )
              else
                Expanded(
                  child: state.items.isEmpty
                      ? CustomScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverFillRemaining(
                              child: ScreenEmptyState(
                                icon: Icons.construction_outlined,
                                title: 'No maintenance requests',
                                subtitle:
                                    'Pull down to refresh or tap + to submit your first request.',
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount:
                              state.items.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.items.length) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(vertical: 16),
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: RequestCard(request: state.items[index]),
                            );
                          },
                        ),
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            context.push('/maintenance/new');
          }
        },
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _RequestListShimmer extends StatelessWidget {
  const _RequestListShimmer();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: 5,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 180,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Container(
                    width: 70,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                width: 120,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
