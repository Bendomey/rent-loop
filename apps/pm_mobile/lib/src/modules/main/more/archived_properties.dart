import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/repository/models/property_deletion_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/archived_properties_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/properties_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/restore_property_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_restore_preview_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMM y').format(date.toLocal());
}

// ── Screen ────────────────────────────────────────────────────────────────────

class ArchivedPropertiesScreen extends ConsumerStatefulWidget {
  const ArchivedPropertiesScreen({super.key});

  @override
  ConsumerState<ArchivedPropertiesScreen> createState() =>
      _ArchivedPropertiesScreenState();
}

class _ArchivedPropertiesScreenState
    extends ConsumerState<ArchivedPropertiesScreen> {
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;
  PropertyModel? _restoreTarget;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(archivedPropertiesNotifierProvider.notifier).loadFirstPage();
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
      ref.read(archivedPropertiesNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      ref
          .read(archivedPropertiesNotifierProvider.notifier)
          .loadFirstPage(search: value.isEmpty ? null : value);
    });
  }

  Future<void> _openRestoreSheet(PropertyModel property) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _restoreTarget = property);
  }

  void _closeRestoreSheet() => setState(() => _restoreTarget = null);

  Future<void> _confirmRestore(PropertyModel property) async {
    await ref
        .read(restorePropertyNotifierProvider.notifier)
        .submit(propertyId: property.id);

    if (!mounted) return;
    final result = ref.read(restorePropertyNotifierProvider);
    if (result.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(archivedPropertiesNotifierProvider);
      ref.invalidate(propertiesNotifierProvider);
      ref.read(restorePropertyNotifierProvider.notifier).reset();
      _closeRestoreSheet();
      if (mounted) {
        showRLToast(
          ref,
          tone: RLToastTone.success,
          title: 'Property restored',
          body: property.name,
        );
      }
    } else {
      await Haptics.vibrate(HapticsType.error);
      ref.read(restorePropertyNotifierProvider.notifier).reset();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.errorMessage ?? 'Something happened. Try again.',
            ),
            backgroundColor: RLTokens.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(archivedPropertiesNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              const RLBackHeader(title: 'Archived properties'),
              Expanded(
                child: RefreshIndicator(
                  color: RLTokens.crimson,
                  onRefresh: () => ref
                      .read(archivedPropertiesNotifierProvider.notifier)
                      .loadFirstPage(
                        search: _searchController.text.isEmpty
                            ? null
                            : _searchController.text,
                      ),
                  child: ListView(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(
                      RLTokens.gutter,
                      10,
                      RLTokens.gutter,
                      40,
                    ),
                    children: [
                      const Text(
                        'Archived properties',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 25,
                          color: RLTokens.ink,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'Hidden from your active portfolio. Records are '
                        'kept — restore any property to bring it back.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          color: RLTokens.muted,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 14),
                      RLSearchBar(
                        hint: 'Search archived',
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                      ),
                      const SizedBox(height: 8),
                      if (showSkeleton)
                        const _ArchivedSkeleton()
                      else if (showError)
                        Padding(
                          padding: const EdgeInsets.only(top: 30),
                          child: RLSectionError(
                            onRetry: () => ref
                                .read(
                                  archivedPropertiesNotifierProvider.notifier,
                                )
                                .loadFirstPage(),
                          ),
                        )
                      else if (showEmpty)
                        const _EmptyArchived()
                      else ...[
                        Padding(
                          padding: const EdgeInsets.fromLTRB(2, 12, 2, 10),
                          child: Text(
                            '${state.total} archived',
                            style: TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 11,
                              letterSpacing: 0.5,
                              color: RLTokens.mutedSoft,
                            ),
                          ),
                        ),
                        for (final property in state.items) ...[
                          _ArchivedCard(
                            property: property,
                            onRestore: () => _openRestoreSheet(property),
                          ),
                          const SizedBox(height: 10),
                        ],
                        if (state.isLoadingMore)
                          const Padding(
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
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (_restoreTarget != null)
            _RestoreSheet(
              property: _restoreTarget!,
              onClose: _closeRestoreSheet,
              onConfirm: () => _confirmRestore(_restoreTarget!),
            ),
        ],
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyArchived extends StatelessWidget {
  const _EmptyArchived();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.inventory_2_outlined,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            const Text(
              'No archived properties',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 15,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 3),
            const Text(
              'Deleted properties show up here and can be restored anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _ArchivedSkeleton extends StatelessWidget {
  const _ArchivedSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(
        children: List.generate(
          3,
          (_) => Container(
            margin: const EdgeInsets.only(top: 12),
            height: 128,
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

// ── Archived property card ───────────────────────────────────────────────────

class _ArchivedCard extends StatelessWidget {
  const _ArchivedCard({required this.property, required this.onRestore});
  final PropertyModel property;
  final VoidCallback onRestore;

  @override
  Widget build(BuildContext context) {
    final byName = property.deletedBy?.user?.name;
    return RLCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.apartment_outlined,
                  size: 20,
                  color: RLTokens.mutedSoft,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            property.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 16.5,
                              color: RLTokens.ink,
                              height: 1.15,
                            ),
                          ),
                        ),
                        const SizedBox(width: 7),
                        const RLPill('Archived', tone: RLTone.neutral),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${property.blocksCount} ${property.blocksCount == 1 ? 'block' : 'blocks'} · ${property.unitsCount} ${property.unitsCount == 1 ? 'unit' : 'units'}',
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                      ),
                    ),
                    if (byName != null) ...[
                      const SizedBox(height: 5),
                      Text(
                        'By $byName · ${_formatDate(property.deletedAt)}',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 10.5,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          RLBtn(
            label: 'Restore',
            icon: Icons.settings_backup_restore_rounded,
            kind: RLBtnKind.ghost,
            full: true,
            onPressed: onRestore,
          ),
        ],
      ),
    );
  }
}

// ── Restore sheet ─────────────────────────────────────────────────────────────

class _RestoreSheet extends ConsumerWidget {
  const _RestoreSheet({
    required this.property,
    required this.onClose,
    required this.onConfirm,
  });
  final PropertyModel property;
  final VoidCallback onClose;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final previewAsync = ref.watch(propertyRestorePreviewProvider(property.id));
    final restoreState = ref.watch(restorePropertyNotifierProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(RLTokens.rXl),
                ),
              ),
              padding: EdgeInsets.fromLTRB(20, 10, 20, 20 + bottomPad),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 38,
                      height: 5,
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: RLTokens.hairline,
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                  ),
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: RLTokens.crimsonTint,
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: const Icon(
                      Icons.settings_backup_restore_rounded,
                      size: 24,
                      color: RLTokens.crimson,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Restore ${property.name}?',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 22,
                      color: RLTokens.ink,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _RestoreBody(property: property, previewAsync: previewAsync),
                  const SizedBox(height: 20),
                  RLBtn(
                    label: restoreState.status.isLoading()
                        ? 'Restoring…'
                        : 'Restore property',
                    icon: Icons.settings_backup_restore_rounded,
                    kind: RLBtnKind.primary,
                    full: true,
                    onPressed: restoreState.status.isLoading()
                        ? null
                        : onConfirm,
                  ),
                  const SizedBox(height: 6),
                  TextButton(
                    onPressed: restoreState.status.isLoading() ? null : onClose,
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.muted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RestoreBody extends StatelessWidget {
  const _RestoreBody({required this.property, required this.previewAsync});
  final PropertyModel property;
  final AsyncValue<PropertyRestorePreviewModel> previewAsync;

  @override
  Widget build(BuildContext context) {
    if (!previewAsync.hasValue && previewAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 4),
        child: SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2.2,
            color: RLTokens.crimson,
          ),
        ),
      );
    }
    final preview = previewAsync.valueOrNull;
    final keptNote = preview == null
        ? ''
        : [
            if (preview.leases > 0) '${preview.leases} ended leases',
            if (preview.bookings > 0) '${preview.bookings} past bookings',
            if (preview.tenantApplications > 0)
              '${preview.tenantApplications} closed applications',
          ].join(' · ');

    return Text(
      preview == null
          ? 'It returns to your active portfolio. It resumes as inactive '
                '— no leases or bookings restart automatically.'
          : 'It returns to your active portfolio with its ${preview.blocks} '
                '${preview.blocks == 1 ? 'block' : 'blocks'} and ${preview.units} '
                '${preview.units == 1 ? 'unit' : 'units'}.'
                '${keptNote.isNotEmpty ? ' Archived records ($keptNote) come back read-only.' : ''} '
                'It resumes as inactive — no leases or bookings restart automatically.',
      style: const TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 14,
        color: RLTokens.muted,
        height: 1.55,
      ),
    );
  }
}
