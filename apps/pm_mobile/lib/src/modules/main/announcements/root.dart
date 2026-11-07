import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/announcement_labels.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/announcements_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String _labelFor(List<(String, String)> table, String value) {
  for (final (v, label) in table) {
    if (v == value) return label;
  }
  return value;
}

String _audience(AnnouncementModel a) {
  if (a.propertyId == null) return 'All properties';
  final name = a.property?.name ?? 'A property';
  if (a.propertyBlockId != null) return '$name · one block';
  final n = a.targetUnitIds.length;
  if (n > 0) return '$name · $n ${n == 1 ? 'unit' : 'units'}';
  return name;
}

String _date(AnnouncementModel a) {
  final raw = a.publishedAt ?? a.scheduledAt ?? a.createdAt;
  final date = DateTime.tryParse(raw);
  return date == null ? '' : DateFormat('d MMM').format(date.toLocal());
}

RLTone _statusTone(String status) => switch (status) {
  'PUBLISHED' => RLTone.success,
  'SCHEDULED' => RLTone.info,
  _ => RLTone.neutral,
};

class AnnouncementsScreen extends ConsumerStatefulWidget {
  const AnnouncementsScreen({super.key, this.propertyId});

  final String? propertyId;

  @override
  ConsumerState<AnnouncementsScreen> createState() =>
      _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends ConsumerState<AnnouncementsScreen> {
  late final ScrollController _scrollController;

  AnnouncementsNotifierProvider get _provider =>
      announcementsNotifierProvider(widget.propertyId);

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!ref.read(_provider).loadMoreFailed &&
        _scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200) {
      ref.read(_provider.notifier).loadNextPage();
    }
  }

  Future<void> _refresh() async {
    await ref.read(_provider.notifier).loadFirstPage();
  }

  Future<void> _add() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final id = widget.propertyId;
    context.push(
      id == null
          ? '/more/announcements/add'
          : '/more/announcements/add?property_id=$id',
    );
  }

  Future<void> _open(AnnouncementModel a) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    showRLSheet(context, (close) => _AnnouncementSheet(a: a, onClose: close));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(_provider);
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final scoped = widget.propertyId;
    final canPost = scoped == null
        ? roles?.values.any((r) => r == 'MANAGER') ?? false
        : roles?[scoped] == 'MANAGER';

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

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Announcements',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: canPost
                ? GestureDetector(
                    onTap: _add,
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(
                        Icons.add_rounded,
                        size: 22,
                        color: RLTokens.ink,
                      ),
                    ),
                  )
                : null,
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: _refresh,
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _ListSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          body: state.error!,
                          onRetry: () =>
                              ref.read(_provider.notifier).loadFirstPage(),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _Empty(canPost: canPost),
                    )
                  else ...[
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        10,
                        RLTokens.gutter,
                        0,
                      ),
                      sliver: SliverList.separated(
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _AnnCard(
                          a: state.items[i],
                          onTap: () => _open(state.items[i]),
                        ),
                      ),
                    ),
                    if (state.loadMoreFailed)
                      SliverToBoxAdapter(
                        child: _LoadMoreFailed(
                          onRetry: () =>
                              ref.read(_provider.notifier).loadNextPage(),
                        ),
                      )
                    else if (state.isLoadingMore)
                      const SliverToBoxAdapter(child: _ListSkeleton(rows: 1)),
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

class _AnnCard extends StatelessWidget {
  const _AnnCard({required this.a, required this.onTap});
  final AnnouncementModel a;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    a.title,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontWeight: RLTokens.headingWeight,
                      fontSize: 17,
                      color: RLTokens.ink,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    a.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.inkSoft,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Row(
                    children: [
                      const Icon(
                        Icons.people_outline_rounded,
                        size: 13,
                        color: RLTokens.mutedSoft,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _audience(a),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.muted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                RLPill(
                  announcementStatusLabel(a.status),
                  tone: _statusTone(a.status),
                ),
                const SizedBox(height: 8),
                Text(
                  _date(a),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementSheet extends StatelessWidget {
  const _AnnouncementSheet({required this.a, required this.onClose});
  final AnnouncementModel a;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return RLSheet(
      title: a.title,
      desc: _audience(a),
      onClose: onClose,
      footer: RLBtn(
        label: 'Close',
        kind: RLBtnKind.light,
        full: true,
        onPressed: onClose,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              RLPill(_labelFor(announcementTypes, a.type)),
              RLPill(
                _labelFor(announcementPriorities, a.priority),
                tone: a.priority == 'URGENT'
                    ? RLTone.danger
                    : a.priority == 'IMPORTANT'
                    ? RLTone.warning
                    : RLTone.neutral,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            a.content,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14.5,
              color: RLTokens.ink,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.canPost});
  final bool canPost;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(RLTokens.gutter),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.campaign_outlined,
              size: 34,
              color: RLTokens.mutedSoft,
            ),
            const SizedBox(height: 12),
            const Text(
              'No announcements yet.',
              style: TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontWeight: RLTokens.headingWeight,
                fontSize: 18,
                color: RLTokens.ink,
              ),
            ),
            if (canPost) ...[
              const SizedBox(height: 6),
              const Text(
                'Post one to tell your tenants something.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: RLTokens.muted,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ListSkeleton extends StatelessWidget {
  const _ListSkeleton({this.rows = 4});
  final int rows;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        10,
        RLTokens.gutter,
        0,
      ),
      child: Shimmer.fromColors(
        baseColor: RLTokens.fill,
        highlightColor: RLTokens.paper,
        child: Column(
          children: [
            for (var i = 0; i < rows; i++)
              Container(
                height: 104,
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(RLTokens.rLg),
                ),
              ),
          ],
        ),
      ),
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
