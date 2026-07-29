// Applications tab of the Activity screen.
//
// Search bar → filter chips → paginated list, mirroring the maintenance
// board's filter design (the chips and sheet are literally the same widgets,
// see activity_filters.dart). Each pending card's progress bar is computed by
// the shared checklist lib, the same code the application detail screen uses.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/modules/main/activity/activity_filters.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/tenant_applications_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_filter_options_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class ApplicationsList extends ConsumerStatefulWidget {
  const ApplicationsList({super.key});

  @override
  ConsumerState<ApplicationsList> createState() => _ApplicationsListState();
}

class _ApplicationsListState extends ConsumerState<ApplicationsList> {
  TenantApplicationsQuery _query = const TenantApplicationsQuery();
  String? _statusFilter;
  String? _genderFilter;
  String? _maritalFilter;
  List<String> _propertyFilterIds = const [];
  List<String> _unitFilterIds = const [];

  late final ScrollController _scrollController;
  late final TextEditingController _searchController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    _searchController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref
          .read(tenantApplicationsNotifierProvider.notifier)
          .loadFirstPage(_query);
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(tenantApplicationsNotifierProvider.notifier).loadNextPage();
    }
  }

  void _applyQuery(TenantApplicationsQuery next) {
    setState(() => _query = next);
    ref.read(tenantApplicationsNotifierProvider.notifier).loadFirstPage(next);
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      final trimmed = value.trim();
      _applyQuery(
        _query.copyWith(
          search: trimmed.isEmpty ? null : trimmed,
          clearSearch: trimmed.isEmpty,
        ),
      );
    });
  }

  bool get _hasActiveFilters =>
      _statusFilter != null ||
      _genderFilter != null ||
      _maritalFilter != null ||
      _propertyFilterIds.isNotEmpty ||
      _unitFilterIds.isNotEmpty ||
      (_query.search?.isNotEmpty ?? false);

  Future<void> _pickSingle({
    required String title,
    required List<String> options,
    required String? selected,
    required void Function(String? value) onChanged,
  }) async {
    final result = await showModalBottomSheet<RLFilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          RLFilterSheet(title: title, options: options, selected: selected),
    );
    if (result == null) return;
    onChanged(result.isClear ? null : result.value);
  }

  Future<void> _pickMulti({
    required String title,
    required List<({String id, String name})> options,
    required List<String> selectedIds,
    required void Function(List<String> ids) onChanged,
  }) async {
    final labels = options.map((o) => o.name).toList();
    final idsByLabel = {for (final o in options) o.name: o.id};
    final selectedLabels = options
        .where((o) => selectedIds.contains(o.id))
        .map((o) => o.name)
        .toList();
    final result = await showModalBottomSheet<RLFilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RLFilterSheet(
        title: title,
        options: labels,
        selectedMulti: selectedLabels,
        idsByLabel: idsByLabel,
        multiSelect: true,
      ),
    );
    if (result == null) return;
    onChanged(result.isClear ? const [] : (result.ids ?? const []));
  }

  Widget _buildChipsRow(
    List<({String id, String name})> propertyOptions,
    List<({String id, String name})> unitOptions,
  ) {
    return Container(
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: RLTokens.gutter,
          vertical: 8,
        ),
        child: Row(
          children: [
            RLFilterTriggerChip(
              label: 'Property',
              value: rlMultiSelectChipLabel(
                selectedIds: _propertyFilterIds,
                options: propertyOptions,
                singularNoun: 'Property',
                pluralNoun: 'Properties',
              ),
              onTap: () => _pickMulti(
                title: 'Property',
                options: propertyOptions,
                selectedIds: _propertyFilterIds,
                onChanged: (ids) {
                  _propertyFilterIds = ids;
                  _applyQuery(_query.copyWith(propertyIds: ids));
                },
              ),
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Unit',
              value: rlMultiSelectChipLabel(
                selectedIds: _unitFilterIds,
                options: unitOptions,
                singularNoun: 'Unit',
                pluralNoun: 'Units',
              ),
              onTap: () => _pickMulti(
                title: 'Unit',
                options: unitOptions,
                selectedIds: _unitFilterIds,
                onChanged: (ids) {
                  _unitFilterIds = ids;
                  _applyQuery(_query.copyWith(desiredUnitIds: ids));
                },
              ),
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Status',
              value: _statusFilter,
              onTap: () => _pickSingle(
                title: 'Status',
                options: kApplicationStatusLabels,
                selected: _statusFilter,
                onChanged: (v) {
                  _statusFilter = v;
                  _applyQuery(
                    _query.copyWith(
                      statusLabel: v,
                      clearStatusLabel: v == null,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Gender',
              value: _genderFilter,
              onTap: () => _pickSingle(
                title: 'Gender',
                options: kApplicationGenderLabels,
                selected: _genderFilter,
                onChanged: (v) {
                  _genderFilter = v;
                  _applyQuery(
                    _query.copyWith(gender: v, clearGender: v == null),
                  );
                },
              ),
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Marital Status',
              value: _maritalFilter,
              onTap: () => _pickSingle(
                title: 'Marital Status',
                options: kApplicationMaritalStatusLabels,
                selected: _maritalFilter,
                onChanged: (v) {
                  _maritalFilter = v;
                  _applyQuery(
                    _query.copyWith(
                      maritalStatus: v,
                      clearMaritalStatus: v == null,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tenantApplicationsNotifierProvider);
    final propertyOptions =
        (ref.watch(activityFilterPropertiesProvider).valueOrNull ?? [])
            .map((p) => (id: p.id, name: p.name))
            .toList();
    final unitOptions =
        (ref.watch(activityFilterUnitsProvider).valueOrNull ?? [])
            .map((u) => (id: u.id, name: u.name))
            .toList();

    final Widget body;
    if (state.isLoadingFirstPage) {
      body = const _ApplicationsSkeleton();
    } else if (state.error != null && state.items.isEmpty) {
      body = _MessageState(
        title: 'Could not load applications',
        message: state.error!,
        onRetry: () => ref
            .read(tenantApplicationsNotifierProvider.notifier)
            .loadFirstPage(_query),
      );
    } else if (state.items.isEmpty) {
      body = _MessageState(
        title: _hasActiveFilters
            ? 'No applications match these filters'
            : 'No applications yet',
        message: _hasActiveFilters
            ? 'Try clearing a filter or two.'
            : 'New rental applications will show up here.',
      );
    } else {
      body = ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          6,
          RLTokens.gutter,
          120,
        ),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i >= state.items.length) return const _LoadMoreRow();
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _ApplicationCard(application: state.items[i]),
          );
        },
      );
    }

    return Column(
      children: [
        _SearchField(
          controller: _searchController,
          onChanged: _onSearchChanged,
        ),
        _buildChipsRow(propertyOptions, unitOptions),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () =>
                ref.read(tenantApplicationsNotifierProvider.notifier).refresh(),
            color: RLTokens.crimson,
            child: body,
          ),
        ),
      ],
    );
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        8,
        RLTokens.gutter,
        4,
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: RLTokens.textBody,
          color: RLTokens.ink,
        ),
        decoration: InputDecoration(
          isDense: true,
          filled: true,
          fillColor: RLTokens.fill,
          hintText: 'Search name, email or phone',
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: RLTokens.textBody,
            color: RLTokens.mutedSoft,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            size: 20,
            color: RLTokens.mutedSoft,
          ),
          suffixIcon: ValueListenableBuilder<TextEditingValue>(
            valueListenable: controller,
            builder: (_, value, _) => value.text.isEmpty
                ? const SizedBox.shrink()
                : GestureDetector(
                    onTap: () {
                      controller.clear();
                      onChanged('');
                    },
                    child: const Icon(
                      Icons.close_rounded,
                      size: 18,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 11),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(RLTokens.rPill),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({required this.application});

  final TenantApplicationModel application;

  @override
  Widget build(BuildContext context) {
    final a = application;
    final statusLabel = applicationStatusLabel(a.status);
    final pending = isApplicationPending(a.status);
    // statusTone() deliberately leaves 'Completed' on the neutral default —
    // the leases list relies on that — so a finished application is mapped to
    // success here rather than globally, the same way application_detail.dart
    // handles an approved one.
    final tone = statusLabel == 'Completed'
        ? RLTone.success
        : statusTone(statusLabel);
    final completeCount = pending
        ? buildApplicationChecklist(a).where((s) => s.complete).length
        : 0;

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (!context.mounted) return;
        context.push('/activity/applications/${a.id}', extra: a);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _Avatar(application: a),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        a.fullName.isEmpty ? a.code : a.fullName,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 15.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        a.desiredUnit?.name ?? 'No unit selected',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                RLPill(statusLabel, tone: tone),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  pending ? 'STEP $completeCount/5' : a.code,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    color: RLTokens.mutedSoft,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  formatApplicationAge(a.createdAt),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
            // The completeness bar is only meaningful while an application is
            // still in progress — a completed one is complete by definition and
            // a cancelled one is moot.
            if (pending) ...[
              const SizedBox(height: 6),
              RLBar(percent: applicationProgress(a), height: 6),
            ],
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.application});

  final TenantApplicationModel application;

  @override
  Widget build(BuildContext context) {
    final url = application.profilePhotoUrl;
    final fallback = RLAvatar(
      application.fullName.isEmpty ? application.code : application.fullName,
      size: 42,
    );
    if (url == null || url.isEmpty) return fallback;

    return ClipOval(
      child: Image.network(
        url,
        width: 42,
        height: 42,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
      ),
    );
  }
}

/// Relative age of an application, for the card's trailing metadata.
String formatApplicationAge(DateTime? created) {
  if (created == null) return '—';
  final days = DateTime.now().difference(created).inDays;
  if (days <= 0) return 'Today';
  if (days == 1) return 'Yesterday';
  if (days < 7) return '${days}d ago';
  return '${created.day} ${_months[created.month - 1]}';
}

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ── States ────────────────────────────────────────────────────────────────────

/// Scrollable so pull-to-refresh still works when there is nothing to show.
class _MessageState extends StatelessWidget {
  const _MessageState({
    required this.title,
    required this.message,
    this.onRetry,
  });

  final String title;
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        80,
        RLTokens.gutter,
        120,
      ),
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 18,
            color: RLTokens.ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: RLTokens.textBody,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
        if (onRetry != null) ...[
          const SizedBox(height: 20),
          Center(
            child: SizedBox(
              width: 160,
              child: RLBtn(label: 'Try again', onPressed: onRetry),
            ),
          ),
        ],
      ],
    );
  }
}

class _LoadMoreRow extends StatelessWidget {
  const _LoadMoreRow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade50,
        child: Container(
          height: 12,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(RLTokens.rPill),
          ),
        ),
      ),
    );
  }
}

class _ApplicationsSkeleton extends StatelessWidget {
  const _ApplicationsSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget bar(double width, double height) => Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
      ),
    );

    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          6,
          RLTokens.gutter,
          120,
        ),
        children: [
          for (var i = 0; i < 5; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rLg),
                  border: Border.all(color: RLTokens.hairline),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              bar(140, 13),
                              const SizedBox(height: 6),
                              bar(100, 11),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        bar(62, 20),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [bar(54, 10), bar(70, 10)],
                    ),
                    const SizedBox(height: 8),
                    bar(double.infinity, 6),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
