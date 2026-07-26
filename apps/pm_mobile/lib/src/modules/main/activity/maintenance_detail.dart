import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_detail_tabs.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_status_actions.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_request_status_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/maintenance_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Single maintenance request.
///
/// [propertyId] is a hint, not a requirement: every detail endpoint is
/// property-scoped but the route carries only the request id, so the board
/// passes `unit.property_id` through as GoRouter `extra`. When it is absent
/// (deep link, cold start) the providers recover it from the cross-property
/// list — see `maintenance_detail_provider.dart`.
class MaintenanceDetailScreen extends ConsumerStatefulWidget {
  const MaintenanceDetailScreen({super.key, required this.id, this.propertyId});

  final String id;
  final String? propertyId;

  @override
  ConsumerState<MaintenanceDetailScreen> createState() =>
      _MaintenanceDetailScreenState();
}

class _MaintenanceDetailScreenState
    extends ConsumerState<MaintenanceDetailScreen> {
  static const _tabHistory = 'history';
  static const _tabComments = 'comments';
  static const _tabExpenses = 'expenses';

  String _tab = _tabHistory;
  bool _submittingStatus = false;

  @override
  Widget build(BuildContext context) {
    final provider = maintenanceRequestDetailProvider(
      widget.id,
      widget.propertyId,
    );
    final requestAsync = ref.watch(provider);

    final showSkeleton = !requestAsync.hasValue && requestAsync.isLoading;
    final showError = requestAsync.hasError && !requestAsync.hasValue;
    final request = requestAsync.valueOrNull;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: request != null ? '#${request.code}' : 'Request',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: RLIconBtn(
              icon: Icons.more_horiz_rounded,
              bg: Colors.transparent,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                showRLToast(
                  ref,
                  tone: RLToastTone.info,
                  title: 'Coming soon',
                  body: 'Editing a request is not available in the app yet.',
                );
              },
            ),
          ),
          Expanded(
            child: showSkeleton
                ? const _DetailSkeleton()
                : showError
                ? Padding(
                    padding: const EdgeInsets.all(RLTokens.gutter),
                    child: RLSectionError(
                      title: "Couldn't load request",
                      body: _errorBody(requestAsync.error),
                      onRetry: () => ref.invalidate(provider),
                    ),
                  )
                : RefreshIndicator(
                    color: RLTokens.crimson,
                    onRefresh: () => _refresh(),
                    child: _Body(
                      request: request!,
                      propertyIdHint: widget.propertyId,
                      tab: _tab,
                      onTabChanged: (t) => setState(() => _tab = t),
                    ),
                  ),
          ),
          if (request != null)
            _ActionBar(
              request: request,
              busy: _submittingStatus,
              onAssign: () => showRLToast(
                ref,
                tone: RLToastTone.info,
                title: 'Coming soon',
                body: 'Assigning from the app is not available yet.',
              ),
              onChangeStatus: () => _changeStatus(request),
            ),
        ],
      ),
    );
  }

  /// The provider raises a plain [StateError] for the two recoverable setup
  /// failures (no workspace, unresolvable property) — surfacing its message
  /// tells the manager what to do, where the generic network copy would not.
  String _errorBody(Object? error) => error is StateError
      ? error.message.toString()
      : 'Check your connection and try again.';

  /// Refreshes the request plus whichever tab is on screen — the other two
  /// refetch on first open, so pulling never pays for hidden tabs. Both are
  /// awaited together so the spinner lasts as long as the slower of the two.
  Future<void> _refresh() async {
    final id = widget.id;
    final hint = widget.propertyId;
    try {
      await Future.wait(<Future<Object?>>[
        ref.refresh(maintenanceRequestDetailProvider(id, hint).future),
        switch (_tab) {
          _tabComments => ref.refresh(
            maintenanceRequestCommentsProvider(id, hint).future,
          ),
          _tabExpenses => ref.refresh(
            maintenanceRequestExpensesProvider(id, hint).future,
          ),
          _ => ref.refresh(
            maintenanceRequestActivityLogsProvider(id, hint).future,
          ),
        },
      ]);
    } catch (_) {
      // Swallowed deliberately: each provider already holds its own error and
      // renders it inline. Letting it escape here would only surface an
      // unhandled exception from RefreshIndicator on top of that.
    }
  }

  Future<void> _changeStatus(MaintenanceRequestModel request) async {
    final current = mrStatusLabel(request.status);
    final target = await pickMaintenanceStatus(context, current);
    if (!mounted || target == null) return;

    String? reason;
    if (target == 'Resolved') {
      if (!await confirmMaintenanceResolve(context, request.title)) return;
    } else if (target == 'Cancelled') {
      reason = await promptMaintenanceCancelReason(context, request.title);
      if (reason == null) return;
    }
    if (!mounted) return;

    setState(() => _submittingStatus = true);
    final success = await ref
        .read(maintenanceRequestStatusNotifierProvider.notifier)
        .updateStatus(
          request: request,
          toStatusLabel: target,
          cancellationReason: reason,
        );
    if (!mounted) return;
    setState(() => _submittingStatus = false);

    if (success) {
      await Haptics.vibrate(HapticsType.light);
      if (!mounted) return;
      // The move writes an activity-log entry, so History is stale too.
      ref.invalidate(
        maintenanceRequestDetailProvider(widget.id, widget.propertyId),
      );
      ref.invalidate(
        maintenanceRequestActivityLogsProvider(widget.id, widget.propertyId),
      );
      showRLToast(
        ref,
        tone: RLToastTone.success,
        title: 'Status updated',
        body: 'Request moved to $target.',
      );
    } else {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: "Couldn't update status",
        body:
            ref.read(maintenanceRequestStatusNotifierProvider).errorMessage ??
            'Please try again.',
      );
    }
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _Body extends StatelessWidget {
  const _Body({
    required this.request,
    required this.propertyIdHint,
    required this.tab,
    required this.onTabChanged,
  });

  final MaintenanceRequestModel request;
  final String? propertyIdHint;
  final String tab;
  final ValueChanged<String> onTabChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        8,
        RLTokens.gutter,
        8,
      ),
      children: [
        _HeroCard(request: request),
        if (request.attachments.isNotEmpty)
          _Attachments(urls: request.attachments),
        const RLLabel('Assignments'),
        _AssignmentsCard(request: request),
        const RLLabel('Properties'),
        _PropertiesCard(request: request),
        const SizedBox(height: 18),
        RLSegmented(
          value: tab,
          onChanged: onTabChanged,
          items: const [
            RLSegmentItem(key: 'history', label: 'History'),
            RLSegmentItem(key: 'comments', label: 'Comments'),
            RLSegmentItem(key: 'expenses', label: 'Expenses'),
          ],
        ),
        const SizedBox(height: 14),
        switch (tab) {
          'comments' => MaintenanceCommentsTab(
            requestId: request.id,
            propertyIdHint: propertyIdHint,
          ),
          'expenses' => MaintenanceExpensesTab(
            requestId: request.id,
            propertyIdHint: propertyIdHint,
          ),
          _ => MaintenanceHistoryTab(
            request: request,
            propertyIdHint: propertyIdHint,
          ),
        },
        _Footer(request: request),
      ],
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context) {
    final statusLabel = mrStatusLabel(request.status);
    final description = request.description;

    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '#${request.code}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 12,
                    color: RLTokens.muted,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              RLPill(statusLabel, tone: statusTone(statusLabel), large: true),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            request.title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 22,
              color: RLTokens.ink,
              letterSpacing: -0.3,
              height: 1.2,
            ),
          ),
          if (request.createdAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Opened ${_dateTime(request.createdAt)}',
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            ),
          ],
          if (description != null && description.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.only(top: 14),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: RLTokens.hairlineSoft)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'DESCRIPTION',
                    style: TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 10,
                      letterSpacing: 0.6,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    description,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      color: RLTokens.inkSoft,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Attachments ───────────────────────────────────────────────────────────────

/// Attachments come back as bare URLs with no MIME hint, so each tile
/// optimistically renders an image and falls back to a labelled file card when
/// that fails. Tapping hands the URL to the system browser rather than
/// building an in-app viewer.
class _Attachments extends StatelessWidget {
  const _Attachments({required this.urls});

  final List<String> urls;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(2, RLTokens.space6, 2, 10),
          child: Row(
            children: [
              const Icon(
                Icons.attach_file_rounded,
                size: 15,
                color: RLTokens.ink,
              ),
              const SizedBox(width: 7),
              const Text(
                'Attachments',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.bold,
                  color: RLTokens.ink,
                ),
              ),
              const SizedBox(width: 5),
              Text(
                '(${urls.length})',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: RLTokens.muted,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 92,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: urls.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => _AttachmentTile(url: urls[i]),
          ),
        ),
      ],
    );
  }
}

class _AttachmentTile extends StatelessWidget {
  const _AttachmentTile({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        final uri = Uri.tryParse(url);
        if (uri == null) return;
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      },
      child: Container(
        width: 118,
        decoration: BoxDecoration(
          color: RLTokens.fill,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: RLTokens.hairline),
        ),
        clipBehavior: Clip.antiAlias,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _AttachmentFallback(url: url),
          loadingBuilder: (_, child, progress) =>
              progress == null ? child : const _AttachmentLoading(),
        ),
      ),
    );
  }
}

class _AttachmentFallback extends StatelessWidget {
  const _AttachmentFallback({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final name = Uri.tryParse(url)?.pathSegments.lastOrNull ?? 'Attachment';
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.insert_drive_file_outlined,
            size: 22,
            color: RLTokens.mutedSoft,
          ),
          const SizedBox(height: 6),
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 9.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttachmentLoading extends StatelessWidget {
  const _AttachmentLoading();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Container(color: Colors.white),
    );
  }
}

// ── Assignments ───────────────────────────────────────────────────────────────

class _AssignmentsCard extends ConsumerWidget {
  const _AssignmentsCard({required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _EditRow(
            label: 'Worker',
            value: request.assignedWorker?.name ?? 'Unassigned',
            unset: request.assignedWorker == null,
            onTap: () => _editSoon(context, ref, 'Assigning a worker'),
          ),
          _EditRow(
            label: 'Manager',
            value: request.assignedManager?.name ?? 'Unassigned',
            unset: request.assignedManager == null,
            last: true,
            onTap: () => _editSoon(context, ref, 'Assigning a manager'),
          ),
        ],
      ),
    );
  }
}

/// Placeholder for the edit sheets that will eventually back every tokenized
/// row. The rows are already built as tap targets so wiring each one is a
/// matter of swapping this call for its sheet — nothing about the row
/// treatment has to change then.
Future<void> _editSoon(BuildContext context, WidgetRef ref, String what) async {
  await Haptics.vibrate(HapticsType.selection);
  if (!context.mounted) return;
  showRLToast(
    ref,
    tone: RLToastTone.info,
    title: 'Coming soon',
    body: '$what is not available in the app yet.',
  );
}

// ── Properties ────────────────────────────────────────────────────────────────

class _PropertiesCard extends ConsumerWidget {
  const _PropertiesCard({required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final priority = mrPriorityLabelFromApi(request.priority);
    // Both destinations are property-scoped routes, so neither link can be
    // offered without the unit's property id.
    final propertyId = request.unit?.propertyId;
    final leaseId = request.leaseId;
    final canOpenUnit = propertyId != null;
    final canOpenLease = propertyId != null && leaseId != null;

    return RLCard(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _EditRow(
            label: 'Priority',
            value: priority,
            tone: statusTone(priority),
            onTap: () => _editSoon(context, ref, 'Changing priority'),
          ),
          _EditRow(
            label: 'Category',
            value: mrCategoryLabelFromApi(request.category),
            onTap: () => _editSoon(context, ref, 'Changing category'),
          ),
          _EditRow(
            label: 'Visibility',
            value: mrVisibilityLabelFromApi(request.visibility),
            onTap: () => _editSoon(context, ref, 'Changing visibility'),
            last: !canOpenUnit && !canOpenLease,
          ),
          if (canOpenUnit)
            _NavRow(
              label: 'Unit',
              value: request.unit?.name ?? 'View unit',
              last: !canOpenLease,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                context.push('/properties/$propertyId/units/${request.unitId}');
              },
            ),
          if (canOpenLease)
            _NavRow(
              label: 'Lease',
              value: 'View lease',
              last: true,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                // LeaseDetailScreen reads its property scope from a query
                // param, not the path — see routes.dart.
                context.push('/more/leases/$leaseId?property_id=$propertyId');
              },
            ),
        ],
      ),
    );
  }
}

/// Label left, value right, hairline between — the shared shape of both row
/// kinds below. Deliberately not [RLRow]: that primitive leads with a bold
/// title and treats the right side as secondary, which inverts the emphasis
/// these spec rows need.
class _SpecRow extends StatelessWidget {
  const _SpecRow({
    required this.label,
    required this.trailing,
    required this.onTap,
    this.last = false,
  });

  final String label;
  final Widget trailing;
  final VoidCallback? onTap;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          border: last
              ? null
              : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(width: 12),
            // All the leftover width goes to one Expanded and the trailing
            // group is right-aligned inside it, so every chevron/arrow lands
            // on the same edge no matter how wide its value is. A `Spacer()`
            // plus a `Flexible(trailing)` would each claim flex: 1 and split
            // that space in half, leaving short values floating mid-row.
            Expanded(
              child: Align(alignment: Alignment.centerRight, child: trailing),
            ),
          ],
        ),
      ),
    );
  }
}

/// A value the manager can change: plain text plus a chevron.
///
/// The chevron is what marks these rows as editable and separates them from
/// the navigation rows below. Only Priority renders as a tag, via [tone] —
/// it's the one value with a status meaning, so it earns the colour. Names,
/// categories and visibility stay plain strings.
class _EditRow extends StatelessWidget {
  const _EditRow({
    required this.label,
    required this.value,
    required this.onTap,
    this.tone,
    this.unset = false,
    this.last = false,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  /// Set only for Priority — the one value that carries a status meaning and
  /// so renders as a tag. Every other value is plain text: wrapping a name or
  /// a category in a tag would imply a status it doesn't have.
  final RLTone? tone;

  /// Dims the value for "Unassigned", which is a prompt to act, not a value.
  final bool unset;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final t = tone;

    return _SpecRow(
      label: label,
      last: last,
      onTap: onTap,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: t != null
                ? RLPill(value, tone: t)
                : Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.semibold,
                      color: unset ? RLTokens.mutedSoft : RLTokens.ink,
                    ),
                  ),
          ),
          const SizedBox(width: 6),
          const Icon(
            Icons.chevron_right_rounded,
            size: 18,
            color: RLTokens.micro,
          ),
        ],
      ),
    );
  }
}

/// A value that leaves this screen: crimson text plus a forward arrow, the
/// app's existing "go somewhere" signal. Colour and glyph both differ from
/// the rows above, which is the whole point — a chevron edits something here,
/// an arrow navigates away.
class _NavRow extends StatelessWidget {
  const _NavRow({
    required this.label,
    required this.value,
    required this.onTap,
    this.last = false,
  });

  final String label;
  final String value;
  final VoidCallback onTap;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return _SpecRow(
      label: label,
      last: last,
      onTap: onTap,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.crimson,
              ),
            ),
          ),
          const SizedBox(width: 6),
          const Icon(
            Icons.arrow_forward_rounded,
            size: 14,
            color: RLTokens.crimson,
          ),
        ],
      ),
    );
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  const _Footer({required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 18),
      padding: const EdgeInsets.only(top: 14),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Created ${_dateTime(request.createdAt)}',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            'Updated ${_dateTime(request.updatedAt)}',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Action bar ────────────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.request,
    required this.busy,
    required this.onAssign,
    required this.onChangeStatus,
  });

  final MaintenanceRequestModel request;
  final bool busy;
  final VoidCallback onAssign;
  final VoidCallback onChangeStatus;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        RLTokens.gutter,
        12,
        RLTokens.gutter,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: Row(
        children: [
          RLBtn(
            label: 'Assign',
            kind: RLBtnKind.light,
            icon: Icons.person_outline_rounded,
            onPressed: busy ? null : onAssign,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: busy ? 'Updating…' : 'Change status',
              kind: RLBtnKind.primary,
              icon: Icons.swap_horiz_rounded,
              full: true,
              onPressed: busy ? null : onChangeStatus,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          8,
          RLTokens.gutter,
          0,
        ),
        children: [
          _block(184),
          _block(92, top: 30),
          _block(104, top: 30),
          _block(214, top: 30),
        ],
      ),
    );
  }

  Widget _block(double height, {double top = 0}) => Container(
    height: height,
    margin: EdgeInsets.only(top: top),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(RLTokens.rLg),
    ),
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

String _dateTime(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMMM y, h:mm a').format(date.toLocal());
}
