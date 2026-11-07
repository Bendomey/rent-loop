import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/repair_labels.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_maintenance_request_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kAssetError = 'Pick at least one block or unit';
const _kVacantNote =
    'No tenant lives here yet, so only staff will see this repair.';
const _kMaxPhotos = 5;
const _kInternalValue = 'INTERNAL_ONLY';
const _kTenantValue = 'TENANT_VISIBLE';

String _labelFor(List<(String, String)> options, String value) {
  for (final o in options) {
    if (o.$1 == value) return o.$2;
  }
  return '';
}

class _PhotoSlot {
  final key = UniqueKey();
  String? url;
  bool blocking = false;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class AddMaintenanceScreen extends ConsumerStatefulWidget {
  const AddMaintenanceScreen({super.key, this.propertyId});

  final String? propertyId;

  @override
  ConsumerState<AddMaintenanceScreen> createState() =>
      _AddMaintenanceScreenState();
}

class _AddMaintenanceScreenState extends ConsumerState<AddMaintenanceScreen> {
  final _blocks = <String, PropertyBlockModel>{};
  final _units = <String, UnitModel>{};
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _photos = [_PhotoSlot()];
  PropertyModel? _pickedProperty;
  PropertyModel? _soleProperty;
  bool _soleDecided = false;
  String _priority = '';
  String _category = '';
  String _chosenVisibility = _kTenantValue;
  String? _activePicker;
  bool _submitting = false;
  // Only raised once the manager tries to submit, so the form doesn't scold
  // them before they've had a go at it.
  bool _showErrors = false;

  int get _assetCount => _blocks.length + _units.length;

  // Selected assets always become one combined request, so anything broader
  // than a single unit has no one tenant to show it to and stays internal.
  bool get _forcedInternal => _blocks.isNotEmpty || _assetCount > 1;

  String get _forcedInternalReason => _units.isEmpty
      ? 'Block work has no tenant attached, so only staff can see this repair.'
      : 'This repair covers more than one place, so only staff can see it and no tenant is told.';

  String get _visibility =>
      _forcedInternal ? _kInternalValue : _chosenVisibility;

  bool get _photoBlocking => _photos.any((p) => p.blocking);

  PropertyModel? _propertyFor(OptionsState<PropertyModel> options) {
    final picked = _pickedProperty;
    if (picked != null) return picked;
    final scoped = widget.propertyId;
    if (scoped != null) {
      final listed = options.items.where((p) => p.id == scoped).firstOrNull;
      if (listed != null) return listed;
      final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
      if (roles?[scoped] != 'MANAGER') return null;
      return ref.watch(propertyDetailProvider(scoped)).valueOrNull;
    }
    if (!_soleDecided &&
        options.hasLoaded &&
        !options.isLoading &&
        options.error == null &&
        options.search.isEmpty) {
      _soleDecided = true;
      if (options.items.length == 1 && !options.hasNextPage) {
        _soleProperty = options.items.first;
      }
    }
    return _soleProperty;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _openPicker(String key) {
    Haptics.vibrate(HapticsType.selection);
    setState(() => _activePicker = key);
  }

  void _closePicker() => setState(() => _activePicker = null);

  Future<void> _pickProperty(PropertyModel? current) async {
    Haptics.vibrate(HapticsType.selection);
    final options = propertyOptionsNotifierProvider(managerOnly: true);
    final picked = await showPagedPickerSheet<PropertyModel>(
      context: context,
      title: 'Property',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (p) => p.name,
      id: (p) => p.id,
      initial: [?current],
      emptyText: 'No properties found',
    );
    if (mounted) ref.read(options.notifier).setSearch('');
    if (picked == null || picked.isEmpty || !mounted) return;
    final property = picked.first;
    setState(() {
      if (property.id != current?.id) {
        _blocks.clear();
        _units.clear();
        _chosenVisibility = _kTenantValue;
        _showErrors = false;
      }
      _pickedProperty = property;
    });
  }

  Future<void> _pickBlocks(String propertyId) async {
    Haptics.vibrate(HapticsType.selection);
    final options = blockOptionsNotifierProvider(propertyId);
    final picked = await showPagedPickerSheet<PropertyBlockModel>(
      context: context,
      title: 'Select blocks',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (b) => b.name,
      id: (b) => b.id,
      multi: true,
      initial: _blocks.values.toList(),
      emptyText: 'No blocks in this property',
    );
    if (picked == null || !mounted) return;
    setState(() {
      _blocks
        ..clear()
        ..addEntries([for (final b in picked) MapEntry(b.id, b)]);
    });
  }

  Future<void> _pickUnits(String propertyId) async {
    Haptics.vibrate(HapticsType.selection);
    final options = unitOptionsNotifierProvider(
      UnitOptionsQuery(propertyIds: [propertyId]),
    );
    final picked = await showPagedPickerSheet<UnitModel>(
      context: context,
      title: 'Select units',
      state: options,
      onSearch: (v) => ref.read(options.notifier).setSearch(v),
      onLoadMore: () => ref.read(options.notifier).loadNextPage(),
      onRetry: () => ref.read(options.notifier).refresh(),
      label: (u) => u.name,
      sub: (u) => u.propertyBlock?.name ?? '',
      id: (u) => u.id,
      multi: true,
      initial: _units.values.toList(),
      emptyText: 'No units in this property',
    );
    if (picked == null || !mounted) return;
    setState(() {
      _units
        ..clear()
        ..addEntries([for (final u in picked) MapEntry(u.id, u)]);
    });
  }

  void _pick(String key, String value) {
    setState(() {
      switch (key) {
        case 'priority':
          _priority = value;
        case 'category':
          _category = value;
        case 'vis':
          _chosenVisibility = value;
      }
      _activePicker = null;
    });
    Haptics.vibrate(HapticsType.selection);
  }

  bool get _valid =>
      _assetCount > 0 &&
      _titleCtrl.text.trim().isNotEmpty &&
      _descCtrl.text.trim().isNotEmpty &&
      _priority.isNotEmpty &&
      _category.isNotEmpty;

  Future<void> _submit(String? propertyId) async {
    if (_submitting || _photoBlocking) return;
    if (propertyId == null || !_valid) {
      setState(() => _showErrors = true);
      await Haptics.vibrate(HapticsType.warning);
      return;
    }
    setState(() => _submitting = true);
    await Haptics.vibrate(HapticsType.medium);

    final notifier = ref.read(
      createMaintenanceRequestNotifierProvider.notifier,
    );
    await notifier.submit(
      propertyId: propertyId,
      unitIds: _units.keys.toList(),
      blockIds: _blocks.keys.toList(),
      title: _titleCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      priority: _priority,
      category: _category,
      visibility: _visibility,
      attachments: [
        for (final p in _photos)
          if (p.url != null) p.url!,
      ],
    );
    if (!mounted) return;
    setState(() => _submitting = false);

    final result = ref.read(createMaintenanceRequestNotifierProvider);
    if (result.status == ApiStatus.success) {
      showRLToast(ref, tone: RLToastTone.success, title: 'Repair added');
      final id = result.createdId;
      if (id == null) {
        context.pop();
      } else {
        context.pushReplacement(
          '/activity/maintenances/$id',
          extra: propertyId,
        );
      }
    } else {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: result.errorMessage ?? 'Something happened. Try again.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(createMaintenanceRequestNotifierProvider, (_, _) {});
    final options = ref.watch(
      propertyOptionsNotifierProvider(managerOnly: true),
    );
    final loading = !options.hasLoaded;
    final noAccess =
        options.hasLoaded &&
        options.items.isEmpty &&
        !options.hasNextPage &&
        options.error == null &&
        options.search.isEmpty;
    final property = _propertyFor(options);
    final propertyId = property?.id;
    final vacantSingleUnit =
        _blocks.isEmpty &&
        _units.length == 1 &&
        _units.values.first.status != 'Unit.Status.Occupied' &&
        _units.values.first.status != 'Unit.Status.PartiallyOccupied';

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Stack(
        children: [
          Column(
            children: [
              RLBackHeader(
                title: 'New repair',
                onBack: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: noAccess
                    ? const Padding(
                        padding: EdgeInsets.all(28),
                        child: Text(
                          'You need manager access to a property to add a repair.',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 15,
                            color: RLTokens.muted,
                            height: 1.45,
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 140),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'New repair',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontWeight: RLTokens.headingWeight,
                                fontSize: 25,
                                color: RLTokens.ink,
                                letterSpacing: -0.4,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 7),
                            const Text(
                              'Report something that needs fixing in a block or unit.',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13.5,
                                color: RLTokens.muted,
                              ),
                            ),
                            const SizedBox(height: 24),
                            _FormField(
                              label: 'Property',
                              error:
                                  _showErrors && propertyId == null && !loading
                                  ? 'Pick a property'
                                  : null,
                              child: loading
                                  ? const _FieldSkeleton()
                                  : _SelectField(
                                      value: property?.name ?? '',
                                      placeholder: options.error != null
                                          ? "Couldn't load properties"
                                          : 'Select property',
                                      onTap: () => _pickProperty(property),
                                    ),
                            ),
                            const SizedBox(height: 18),
                            _WhereSection(
                              enabled: propertyId != null,
                              hasError: _showErrors && _assetCount == 0,
                              units: [
                                for (final u in _units.values)
                                  (
                                    id: u.id,
                                    label: u.propertyBlock?.name == null
                                        ? u.name
                                        : '${u.name} · ${u.propertyBlock!.name}',
                                  ),
                              ],
                              blocks: [
                                for (final b in _blocks.values)
                                  (id: b.id, label: '${b.name} (whole block)'),
                              ],
                              onAddUnits: () => _pickUnits(propertyId!),
                              onAddBlocks: () => _pickBlocks(propertyId!),
                              onRemoveUnit: (id) =>
                                  setState(() => _units.remove(id)),
                              onRemoveBlock: (id) =>
                                  setState(() => _blocks.remove(id)),
                            ),
                            if (_showErrors && _assetCount == 0) ...[
                              const SizedBox(height: 8),
                              const _FieldError(_kAssetError),
                            ],
                            const SizedBox(height: 18),
                            _FormField(
                              label: 'Title',
                              error:
                                  _showErrors && _titleCtrl.text.trim().isEmpty
                                  ? 'Add a title'
                                  : null,
                              child: _InputField(
                                controller: _titleCtrl,
                                placeholder: 'e.g. Fix leaky faucet',
                              ),
                            ),
                            const SizedBox(height: 18),
                            _FormField(
                              label: 'Description',
                              error:
                                  _showErrors && _descCtrl.text.trim().isEmpty
                                  ? 'Add a description'
                                  : null,
                              child: _TextAreaField(
                                controller: _descCtrl,
                                placeholder: 'Describe the issue in detail…',
                              ),
                            ),
                            const SizedBox(height: 18),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: _FormField(
                                    label: 'Priority',
                                    error: _showErrors && _priority.isEmpty
                                        ? 'Pick how urgent it is'
                                        : null,
                                    child: _SelectField(
                                      value: _labelFor([
                                        for (final p in repairPriorities)
                                          (p.$1, p.$2),
                                      ], _priority),
                                      placeholder: 'Select urgency',
                                      onTap: () => _openPicker('priority'),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _FormField(
                                    label: 'Category',
                                    error: _showErrors && _category.isEmpty
                                        ? 'Pick a category'
                                        : null,
                                    child: _SelectField(
                                      value: _labelFor(
                                        repairCategories,
                                        _category,
                                      ),
                                      placeholder: 'Select category',
                                      onTap: () => _openPicker('category'),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 28),
                            const Text(
                              'Photos (optional)',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontWeight: RLTokens.headingWeight,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Add photos related to the issue.',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                              ),
                            ),
                            const SizedBox(height: 14),
                            for (final slot in _photos) ...[
                              ApplicationUploadTile(
                                key: slot.key,
                                label: 'Photo',
                                objectKeyPrefix: 'maintenance-requests/',
                                optional: true,
                                onChanged: (url) => slot.url = url,
                                onBlockingChanged: (b) {
                                  if (!mounted) return;
                                  setState(() => slot.blocking = b);
                                },
                              ),
                              const SizedBox(height: 10),
                            ],
                            if (_photos.length < _kMaxPhotos)
                              RLBtn(
                                label: 'Add another photo',
                                kind: RLBtnKind.light,
                                large: false,
                                onPressed: () {
                                  Haptics.vibrate(HapticsType.selection);
                                  setState(() => _photos.add(_PhotoSlot()));
                                },
                              ),
                            const SizedBox(height: 28),
                            const Text(
                              'Visibility',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontWeight: RLTokens.headingWeight,
                                fontSize: 19,
                                color: RLTokens.ink,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Should the tenant see this repair in their app?',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                                height: 1.45,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (_forcedInternal)
                              Tooltip(
                                message: _forcedInternalReason,
                                triggerMode: TooltipTriggerMode.tap,
                                showDuration: const Duration(seconds: 4),
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: RLTokens.ink,
                                  borderRadius: BorderRadius.circular(
                                    RLTokens.rSm,
                                  ),
                                ),
                                textStyle: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 12.5,
                                  color: RLTokens.surface,
                                  height: 1.4,
                                ),
                                child: _SelectField(
                                  value: _labelFor([
                                    for (final v in repairVisibilities)
                                      (v.$1, v.$2),
                                  ], _kInternalValue),
                                  placeholder: 'Select visibility',
                                  enabled: false,
                                ),
                              )
                            else
                              _SelectField(
                                value: _labelFor([
                                  for (final v in repairVisibilities)
                                    (v.$1, v.$2),
                                ], _chosenVisibility),
                                placeholder: 'Select visibility',
                                onTap: () => _openPicker('vis'),
                              ),
                            if (vacantSingleUnit) ...[
                              const SizedBox(height: 8),
                              const Text(
                                _kVacantNote,
                                style: TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 12.5,
                                  color: RLTokens.muted,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
              ),
            ],
          ),

          if (!noAccess)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: EdgeInsets.fromLTRB(
                  20,
                  12,
                  20,
                  12 + MediaQuery.of(context).padding.bottom,
                ),
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  border: const Border(
                    top: BorderSide(color: RLTokens.hairline),
                  ),
                  boxShadow: RLTokens.elevBar,
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) Navigator.of(context).pop();
                      },
                      child: const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 12,
                        ),
                        child: Text(
                          'Cancel',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: RLTokens.textAction,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (_photoBlocking)
                      const Flexible(
                        child: Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: Text(
                            'Wait for the photos to finish.',
                            textAlign: TextAlign.end,
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                            ),
                          ),
                        ),
                      ),
                    RLBtn(
                      label: 'Create repair',
                      kind: RLBtnKind.primary,
                      icon: Icons.check_rounded,
                      onPressed: _submitting || _photoBlocking
                          ? null
                          : () => _submit(propertyId),
                    ),
                  ],
                ),
              ),
            ),

          if (_activePicker == 'priority')
            _PickerSheet(
              title: 'Priority',
              options: [
                for (final p in repairPriorities)
                  _PickerOption(
                    value: p.$1,
                    label: p.$2,
                    tone: p.$1 == 'EMERGENCY'
                        ? RLTone.danger
                        : statusTone(p.$2),
                  ),
              ],
              selected: _priority,
              onPick: (v) => _pick('priority', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'category')
            _PickerSheet(
              title: 'Category',
              options: [
                for (final c in repairCategories)
                  _PickerOption(value: c.$1, label: c.$2),
              ],
              selected: _category,
              onPick: (v) => _pick('category', v),
              onClose: _closePicker,
            ),
          if (_activePicker == 'vis')
            _PickerSheet(
              title: 'Tenant visibility',
              options: [
                for (final v in repairVisibilities)
                  _PickerOption(value: v.$1, label: v.$2, sub: v.$3),
              ],
              selected: _chosenVisibility,
              onPick: (v) => _pick('vis', v),
              onClose: _closePicker,
            ),
        ],
      ),
    );
  }
}

class _FieldSkeleton extends StatelessWidget {
  const _FieldSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
        ),
      ),
    );
  }
}

// ── Form field label wrapper ──────────────────────────────────────────────────

typedef _Picked = ({String id, String label});

/// Says plainly that a repair can cover several places, and lists each picked
/// unit or block as its own removable chip rather than a filter-style field.
class _WhereSection extends StatelessWidget {
  const _WhereSection({
    required this.enabled,
    required this.hasError,
    required this.units,
    required this.blocks,
    required this.onAddUnits,
    required this.onAddBlocks,
    required this.onRemoveUnit,
    required this.onRemoveBlock,
  });

  final bool enabled;
  final bool hasError;
  final List<_Picked> units;
  final List<_Picked> blocks;
  final VoidCallback onAddUnits;
  final VoidCallback onAddBlocks;
  final ValueChanged<String> onRemoveUnit;
  final ValueChanged<String> onRemoveBlock;

  @override
  Widget build(BuildContext context) {
    final empty = units.isEmpty && blocks.isEmpty;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(
          color: hasError ? RLTokens.crimson : RLTokens.hairline,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Where is the repair? *',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            enabled
                ? 'Add one or more units, whole blocks, or both. One repair can cover them all.'
                : 'Pick a property first.',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
              height: 1.4,
            ),
          ),
          if (!empty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final u in units)
                  _PickedChip(
                    icon: Icons.door_front_door_outlined,
                    label: u.label,
                    onRemove: () => onRemoveUnit(u.id),
                  ),
                for (final b in blocks)
                  _PickedChip(
                    icon: Icons.apartment_outlined,
                    label: b.label,
                    onRemove: () => onRemoveBlock(b.id),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _AddButton(
                  label: 'Add units',
                  enabled: enabled,
                  onTap: onAddUnits,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _AddButton(
                  label: 'Add blocks',
                  enabled: enabled,
                  onTap: onAddBlocks,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PickedChip extends StatelessWidget {
  const _PickedChip({
    required this.icon,
    required this.label,
    required this.onRemove,
  });

  final IconData icon;
  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 6, 4, 6),
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: RLTokens.ink),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.ink,
              ),
            ),
          ),
          Semantics(
            button: true,
            label: 'Remove $label',
            child: GestureDetector(
              onTap: onRemove,
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(Icons.close, size: 15, color: RLTokens.muted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = enabled ? RLTokens.crimson : RLTokens.mutedSoft;
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        height: 42,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: color),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, size: 17, color: color),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13.5,
                  fontWeight: RLTokens.semibold,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.child, this.error});
  final String label;
  final Widget child;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
            const Text(
              ' *',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.bold,
                color: RLTokens.crimson,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        child,
        if (error != null) ...[const SizedBox(height: 6), _FieldError(error!)],
      ],
    );
  }
}

class _FieldError extends StatelessWidget {
  const _FieldError(this.message);
  final String message;

  @override
  Widget build(BuildContext context) => Text(
    message,
    style: const TextStyle(
      fontFamily: RLTokens.fontSans,
      fontSize: 12.5,
      color: RLTokens.danger,
    ),
  );
}

// ── Select field ──────────────────────────────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.value,
    required this.placeholder,
    this.onTap,
    this.enabled = true,
  });
  final String value;
  final String placeholder;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final isPlaceholder = value.isEmpty;

    return GestureDetector(
      // A null callback leaves the tap to any wrapper, so a locked field can
      // still open its tooltip.
      onTap: enabled ? onTap : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: enabled ? RLTokens.surface : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          border: Border.all(color: RLTokens.hairline, width: 1.5),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                isPlaceholder ? placeholder : value,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  color: isPlaceholder || !enabled
                      ? RLTokens.mutedSoft
                      : RLTokens.ink,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              enabled
                  ? Icons.keyboard_arrow_down_rounded
                  : Icons.lock_outline_rounded,
              size: enabled ? 18 : 15,
              color: RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Text input field ──────────────────────────────────────────────────────────

class _InputField extends StatelessWidget {
  const _InputField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: controller,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
        ),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

// ── Textarea field ────────────────────────────────────────────────────────────

class _TextAreaField extends StatelessWidget {
  const _TextAreaField({required this.controller, required this.placeholder});
  final TextEditingController controller;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: controller,
        maxLines: null,
        minLines: 5,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14.5,
          color: RLTokens.ink,
          height: 1.5,
        ),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14.5,
            color: RLTokens.mutedSoft,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 13),
        ),
      ),
    );
  }
}

// ── Picker option model ───────────────────────────────────────────────────────

class _PickerOption {
  const _PickerOption({
    required this.value,
    required this.label,
    this.tone,
    this.sub,
  });
  final String value;
  final String label;
  final RLTone? tone;
  final String? sub;
}

// ── Picker sheet ──────────────────────────────────────────────────────────────

class _PickerSheet extends StatelessWidget {
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.onPick,
    required this.onClose,
    this.selected = '',
  });

  final String title;
  final List<_PickerOption> options;
  final ValueChanged<String> onPick;
  final VoidCallback onClose;
  final String selected;

  bool _isSelected(String value) => selected == value;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: const Color.fromRGBO(17, 17, 16, 0.38),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {}, // prevent tap-through
            child: Container(
              decoration: const BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(RLTokens.rXl),
                ),
                boxShadow: RLTokens.elevSheet,
              ),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  const SizedBox(height: 10),
                  Container(
                    width: 38,
                    height: 5,
                    decoration: BoxDecoration(
                      color: RLTokens.hairline,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                  // Sheet header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 14, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontWeight: RLTokens.headingWeight,
                              fontSize: 20,
                              color: RLTokens.ink,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        RLIconBtn(
                          icon: Icons.close,
                          bg: RLTokens.fill,
                          iconColor: RLTokens.inkSoft,
                          onTap: onClose,
                        ),
                      ],
                    ),
                  ),
                  // Options list
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 30),
                      child: Column(
                        children: [
                          ...options.asMap().entries.map((e) {
                            final i = e.key;
                            final o = e.value;
                            final isLast = i == options.length - 1;
                            final isSelected = _isSelected(o.value);
                            return GestureDetector(
                              onTap: () => onPick(o.value),
                              behavior: HitTestBehavior.opaque,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 13,
                                  horizontal: 8,
                                ),
                                decoration: BoxDecoration(
                                  border: isLast
                                      ? null
                                      : const Border(
                                          bottom: BorderSide(
                                            color: RLTokens.hairlineSoft,
                                          ),
                                        ),
                                ),
                                child: Row(
                                  children: [
                                    if (o.tone != null) ...[
                                      RLDot(tone: o.tone!, size: 9),
                                      const SizedBox(width: 12),
                                    ],
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            o.label,
                                            style: TextStyle(
                                              fontFamily: RLTokens.fontSans,
                                              fontSize: 15,
                                              fontWeight: isSelected
                                                  ? RLTokens.bold
                                                  : RLTokens.medium,
                                              color: RLTokens.ink,
                                            ),
                                          ),
                                          if (o.sub != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              o.sub!,
                                              style: const TextStyle(
                                                fontFamily: RLTokens.fontSans,
                                                fontSize: 12,
                                                color: RLTokens.muted,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (isSelected)
                                      const Icon(
                                        Icons.check_rounded,
                                        size: 18,
                                        color: RLTokens.crimson,
                                      ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
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
